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
