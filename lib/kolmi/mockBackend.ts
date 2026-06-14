// Mock backend — simule l'autre côté de la rencontre.
//
// Pas de WebSocket, pas de polling : c'est un service côté client qui
// programme des `setTimeout` pour faire avancer un Meeting au fil du
// temps, comme si l'autre personne réagissait. Une fois la transition
// déclenchée, on patche directement le Meeting en AsyncStorage et on
// pousse une notification locale pour signaler le changement.
//
// API publique (toutes async, ne throw jamais) :
//   simulateOtherDecision(meetingId)   → 70% accept · 25% decline · 5% timeout
//   simulateOtherSlotChoice(meetingId) → choisit un slot au hasard
//   simulateOtherFeedback(meetingId)   → 70% se revoit · 30% en reste là
//
// Toggle dev : KOLMI_MOCK_DELAYS_FAST divise tous les délais par 10.

import { KOLMI_MOCK_DELAYS_FAST } from '@/constants/kolmiConfig'
import {
  getMeetingById,
  updateMeeting,
  addTokens,
} from './storage'
import { presentLocalNotification } from './notifications'
import { getSelectedProfileById } from '@/data/mockSelectedProfiles'

const FAST_DIVISOR = KOLMI_MOCK_DELAYS_FAST ? 10 : 1

function applyFast(ms: number): number {
  return Math.max(800, Math.round(ms / FAST_DIVISOR))
}

// Tirage uniforme entre [min, max] (ms).
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('[kolmi-mock]', ...args)
}

// Helper pour récupérer le prénom du profil cible — sert à composer les
// notifications éditoriales ("Léa accepte.", "Léa a confirmé...").
function nameForMeeting(profileId: string): string {
  const p = getSelectedProfileById(profileId)
  return p?.firstName ?? 'votre interlocuteur·ice'
}

// ─── 1. Décision de l'autre après une demande ───────────────────────
//
// Distribution :
//  • 70 % → accept_waiting_slots (l'autre accepte, à vous de proposer)
//  • 25 % → declined (refus ; on rembourse le token)
//  • 5  % → expired après 7 j (no-response — pas modélisé en mock,
//          on tombe sur "decline" silencieux pour ne pas bloquer le user)
export async function simulateOtherDecision(meetingId: string): Promise<void> {
  const delay = applyFast(rand(5_000, 30_000))
  log(`schedule decision for ${meetingId} in ${delay}ms`)

  setTimeout(async () => {
    const meeting = await getMeetingById(meetingId)
    if (!meeting) {
      log(`decision: meeting ${meetingId} not found, skip`)
      return
    }
    if (meeting.status !== 'requested_by_me') {
      log(`decision: meeting ${meetingId} status changed (${meeting.status}), skip`)
      return
    }

    const roll = Math.random()
    const name = nameForMeeting(meeting.profileId)

    if (roll < 0.7) {
      log(`decision: ${meetingId} → accepted_waiting_slots`)
      await updateMeeting(meetingId, { status: 'accepted_waiting_slots' })
      await presentLocalNotification(
        `${name} accepte.`,
        'À vous de proposer trois moments.',
      )
    } else if (roll < 0.95) {
      log(`decision: ${meetingId} → declined (token refunded)`)
      await updateMeeting(meetingId, { status: 'declined' })
      await addTokens(1)
      await presentLocalNotification(
        `${name} préfère ne pas donner suite.`,
        'Votre token est crédité de nouveau.',
      )
    } else {
      log(`decision: ${meetingId} → expired (token refunded)`)
      await updateMeeting(meetingId, { status: 'expired' })
      await addTokens(1)
      await presentLocalNotification(
        'Demande expirée.',
        `${name} n'a pas répondu. Votre token est restitué.`,
      )
    }
  }, delay)
}

// ─── 2. Choix d'un créneau par l'autre ───────────────────────────────
//
// Une fois que l'utilisateur a soumis ses 3 slots (status =
// 'slots_submitted'), l'autre choisit un slot après 30 s à 3 min.
export async function simulateOtherSlotChoice(meetingId: string): Promise<void> {
  const delay = applyFast(rand(30_000, 180_000))
  log(`schedule slot choice for ${meetingId} in ${delay}ms`)

  setTimeout(async () => {
    const meeting = await getMeetingById(meetingId)
    if (!meeting) return
    if (meeting.status !== 'slots_submitted') {
      log(`slot choice: meeting ${meetingId} status changed (${meeting.status}), skip`)
      return
    }
    const slots = meeting.selectedSlots ?? []
    if (slots.length === 0) {
      log(`slot choice: no slots in meeting ${meetingId}, skip`)
      return
    }

    const chosen = slots[Math.floor(Math.random() * slots.length)]
    log(`slot choice: ${meetingId} → confirmed slot "${chosen}"`)
    await updateMeeting(meetingId, {
      status: 'confirmed',
      confirmedSlot: chosen,
    })
    const name = nameForMeeting(meeting.profileId)
    await presentLocalNotification(
      `${name} a confirmé.`,
      chosen,
    )
  }, delay)
}

// ─── 3. Feedback post-rdv côté autre ─────────────────────────────────
//
// Appelé quand l'utilisateur a soumis son propre feedback. L'autre
// décide après quelques secondes ; un match mutuel se forme si les
// deux ont coché "on se revoit".
export async function simulateOtherFeedback(meetingId: string): Promise<void> {
  const delay = applyFast(rand(8_000, 40_000))
  log(`schedule feedback for ${meetingId} in ${delay}ms`)

  setTimeout(async () => {
    const meeting = await getMeetingById(meetingId)
    if (!meeting) return
    // 70 % se revoit
    const wantsAgain = Math.random() < 0.7
    log(`feedback: ${meetingId} → other.wantsAgain=${wantsAgain}`)
    await updateMeeting(meetingId, {
      feedbackByOther: wantsAgain,
    })

    const name = nameForMeeting(meeting.profileId)
    const mutual = meeting.feedbackByMe === true && wantsAgain
    if (mutual) {
      await presentLocalNotification(
        `${name} aussi.`,
        'Vous pouvez écrire à présent.',
      )
    }
    // Si pas mutuel, pas de notif — on respecte le silence éditorial.
  }, delay)
}
