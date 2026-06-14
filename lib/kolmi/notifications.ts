import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'

// Demande la permission push et récupère l'expoPushToken associé à l'appareil.
// Renvoie null si l'appareil n'est pas physique, si la permission est refusée,
// ou si une erreur survient (réseau / projectId manquant). Ne throw jamais —
// l'appelant peut être démarré au boot et ne doit pas crasher l'app.
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    // Les push tokens ne sont pas disponibles sur le simulateur iOS / l'émulateur.
    return null
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') {
      return null
    }

    // projectId est requis par expo-notifications pour récupérer un expoPushToken
    // valide. On le lit depuis EAS config / app config selon le runtime.
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId

    const tokenResponse = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync()

    return tokenResponse.data ?? null
  } catch (err) {
    console.warn('[kolmi] registerForPushNotificationsAsync failed', err)
    return null
  }
}

// Affiche immédiatement une notification locale. Utilisé par le mock
// backend pour simuler les transitions côté autre (acceptation, choix
// de slot, etc.). Pas besoin de permission token push — c'est uniquement
// local. Sur simulateur où expo-notifications est inerte, on retombe en
// silence sur un console.log.
export async function presentLocalNotification(
  title: string,
  body: string,
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    })
  } catch (err) {
    console.warn('[kolmi] presentLocalNotification failed', err)
  }
}

// Planifie une notification à un instant donné. Renvoie l'identifiant
// pour pouvoir l'annuler plus tard (cancelScheduledNotificationAsync).
export async function scheduleNotificationAt(
  date: Date,
  title: string,
  body: string,
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    })
    return id
  } catch (err) {
    console.warn('[kolmi] scheduleNotificationAt failed', err)
    return null
  }
}

export async function cancelScheduledNotification(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id)
  } catch (err) {
    console.warn('[kolmi] cancelScheduledNotification failed', err)
  }
}

// ─── Rappels de rendez-vous ─────────────────────────────────────────
//
// Une fois un Meeting confirmé, on planifie 4 notifications éditoriales :
//   • J-1 18h  : "Demain, vous voyez Léa à 20h."
//   • Jour J 9h: "Aujourd'hui : Léa, 20h, Café de Flore."
//   • À l'heure: "C'est l'heure de votre rendez-vous avec Léa."
//   • H+5      : "Comment était votre rendez-vous avec Léa ?"
//
// Chaque schedule renvoie un id (ou null si push impossibles). On ne
// persiste pas ces ids ici — c'est l'appelant qui décide de les garder
// pour pouvoir annuler plus tard via cancelScheduledNotification.
//
// Les contenus sont en plain text — iOS/Android ne supportent pas
// l'italique dans les push. La voix reste mate, sans emojis.

export type MeetingReminderInput = {
  // Date/heure du rendez-vous (ISO 8601 ou Date)
  meetingAt: Date
  // Prénom de l'autre, pour personnaliser le push.
  otherName: string
  // Optionnel : lieu (ex. "Café de Flore") pour le push du matin.
  venue?: string
  // Optionnel : heure formattée (ex. "20h00") pour les push.
  timeLabel?: string
}

function setHour(d: Date, hour: number, minute = 0): Date {
  const out = new Date(d)
  out.setHours(hour, minute, 0, 0)
  return out
}

export async function scheduleMeetingReminderJ1(
  input: MeetingReminderInput,
): Promise<string | null> {
  // J-1 à 18h
  const target = new Date(input.meetingAt)
  target.setDate(target.getDate() - 1)
  const at = setHour(target, 18, 0)
  if (at.getTime() <= Date.now()) return null
  const time = input.timeLabel ?? formatHm(input.meetingAt)
  return scheduleNotificationAt(
    at,
    `Demain, vous voyez ${input.otherName}.`,
    `Rendez-vous à ${time}${input.venue ? `, ${input.venue}` : ''}.`,
  )
}

export async function scheduleMeetingReminderMorning(
  input: MeetingReminderInput,
): Promise<string | null> {
  // Jour J à 9h
  const at = setHour(new Date(input.meetingAt), 9, 0)
  if (at.getTime() <= Date.now()) return null
  const time = input.timeLabel ?? formatHm(input.meetingAt)
  return scheduleNotificationAt(
    at,
    `Aujourd'hui : ${input.otherName}.`,
    `${time}${input.venue ? ` · ${input.venue}` : ''}.`,
  )
}

export async function scheduleMeetingReminderTime(
  input: MeetingReminderInput,
): Promise<string | null> {
  // À l'heure exacte du rdv
  const at = new Date(input.meetingAt)
  if (at.getTime() <= Date.now()) return null
  return scheduleNotificationAt(
    at,
    `C'est l'heure.`,
    `Vous voyez ${input.otherName} maintenant.`,
  )
}

export async function scheduleFeedbackPrompt(
  input: MeetingReminderInput,
): Promise<string | null> {
  // H+5 (fenêtre standard d'un dîner)
  const at = new Date(input.meetingAt.getTime() + 5 * 60 * 60 * 1000)
  if (at.getTime() <= Date.now()) return null
  return scheduleNotificationAt(
    at,
    `Comment était votre rendez-vous ?`,
    `Avec ${input.otherName} — votre réponse en deux mots.`,
  )
}

// Convenience : programme les 4 push d'un coup et renvoie leurs ids.
// Stocker le tableau permet de tout annuler en bloc si le rdv est
// annulé / modifié.
export async function scheduleAllMeetingReminders(
  input: MeetingReminderInput,
): Promise<(string | null)[]> {
  return Promise.all([
    scheduleMeetingReminderJ1(input),
    scheduleMeetingReminderMorning(input),
    scheduleMeetingReminderTime(input),
    scheduleFeedbackPrompt(input),
  ])
}

function formatHm(d: Date): string {
  const h = d.getHours()
  const m = d.getMinutes()
  return `${h}h${m === 0 ? '00' : String(m).padStart(2, '0')}`
}
