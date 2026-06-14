// Moteur de la "conversation du jour" — la timeline éditoriale du
// tab central. C'est de la logique pure : pas d'UI, pas d'animations.
// L'écran consume juste les events et les rend.
//
// Une conversation est une succession d'events typés (matchmaker
// message, présentation profil, décision user, etc.). Le moteur
// génère la séquence initiale à partir des profils du jour, puis
// applique les décisions utilisateur pour produire la suite.

import AsyncStorage from '@react-native-async-storage/async-storage'
import type { SelectedProfile } from '@/data/mockSelectedProfiles'
import type { DnaCategoryId } from '@/data/kolmiDna'
import type { KolmiDnaResult } from './types'
import {
  pickOpening,
  pickIntro,
  pickReaction,
  pickContext,
  pickClosing,
  fillTemplate,
  type UserAxes,
  type ProfileAxes,
} from '@/data/matchmakerCopy'
import { dnaCategories } from '@/data/kolmiDna'

const STORAGE_PREFIX = 'kolmi.conversation.'
const RETENTION_DAYS = 7

// ─── Types ───────────────────────────────────────────────────────────

export type ProfileStage = 'building' | 'ready' | 'decided'
export type Choice = 'request' | 'pass'
export type MessageTone = 'opening' | 'intro' | 'context' | 'reaction' | 'closing'

export type TimelineEvent =
  | {
      kind: 'day_header'
      id: string
      date: string
      label: string
    }
  | {
      kind: 'matchmaker_message'
      id: string
      text: string
      tone: MessageTone
      at: string
    }
  | {
      kind: 'profile_presentation'
      id: string
      profileId: string
      stage: ProfileStage
      at: string
    }
  | {
      kind: 'decision_inline'
      id: string
      profileId: string
      at: string
    }
  | {
      kind: 'user_decision'
      id: string
      profileId: string
      choice: Choice
      note?: string
      at: string
    }
  | {
      kind: 'session_end'
      id: string
      text: string
      at: string
    }

export type ConversationState = {
  dayKey: string
  events: TimelineEvent[]
  // Index 0/1/2 = profil en cours. Si 3 → journée terminée.
  currentProfileIndex: number
  // Liste figée des profileIds présentés ce jour (dans l'ordre).
  profileIds: string[]
  // Last cursor — sert au tab à restaurer la position de scroll.
  cursorEventId: string | null
}

// ─── Helpers de date / id ────────────────────────────────────────────

const FRENCH_DAYS = [
  'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi',
] as const

const FRENCH_MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
] as const

function toDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey(now: Date = new Date()): string {
  return toDayKey(now)
}

function frenchDateLabel(d: Date): string {
  return `${FRENCH_DAYS[d.getDay()]} ${d.getDate()} ${FRENCH_MONTHS[d.getMonth()]}`
}

function nowIso(): string {
  return new Date().toISOString()
}

let _idCounter = 0
function newId(prefix: string): string {
  _idCounter += 1
  return `${prefix}-${Date.now()}-${_idCounter}`
}

// ─── Déductions Maison ──────────────────────────────────────────────

function userAxesFromDna(dna: KolmiDnaResult | null): UserAxes | null {
  if (!dna) return null
  const cat = dnaCategories[dna.categoryId]
  if (!cat) return null
  return {
    maisonId: dna.categoryId,
    intensity: cat.axes.intensity,
    rhythm: cat.axes.rhythm,
    openness: cat.axes.openness,
  }
}

function profileAxes(profile: SelectedProfile): ProfileAxes {
  if (profile.maisonId) {
    const cat = dnaCategories[profile.maisonId]
    if (cat) {
      return {
        maisonId: profile.maisonId,
        intensity: cat.axes.intensity,
        rhythm: cat.axes.rhythm,
        openness: cat.axes.openness,
      }
    }
  }
  return { maisonId: profile.maisonId }
}

// ─── Build initial — première ouverture de la journée ───────────────

export function buildDayConversation(
  profiles: SelectedProfile[],
  dna: KolmiDnaResult | null,
  now: Date = new Date(),
): ConversationState {
  const dayKey = toDayKey(now)
  const label = frenchDateLabel(now)
  const events: TimelineEvent[] = []

  events.push({
    kind: 'day_header',
    id: newId('day'),
    date: dayKey,
    label,
  })

  if (profiles.length === 0) {
    // Cas : plus aucun profil disponible (tous passés ou rien généré).
    events.push({
      kind: 'matchmaker_message',
      id: newId('msg'),
      tone: 'opening',
      text: 'Je travaille pour vous. Vos premiers envois arrivent bientôt.',
      at: nowIso(),
    })
    return {
      dayKey,
      events,
      currentProfileIndex: 0,
      profileIds: [],
      cursorEventId: null,
    }
  }

  // Ouverture
  events.push({
    kind: 'matchmaker_message',
    id: newId('msg'),
    tone: 'opening',
    text: pickOpening(now.getHours(), dayKey),
    at: nowIso(),
  })

  // Intro + présentation + contexte + décision pour le 1er profil
  const first = profiles[0]
  appendProfileBlock(events, first, dna, true)

  return {
    dayKey,
    events,
    currentProfileIndex: 0,
    profileIds: profiles.map((p) => p.id),
    cursorEventId: events[events.length - 1]?.id ?? null,
  }
}

// Ajoute le bloc d'un profil : intro + présentation (building) +
// message contextuel + decision_inline. Mutation in-place pour rester
// simple (le caller ne réutilise pas l'array original).
function appendProfileBlock(
  events: TimelineEvent[],
  profile: SelectedProfile,
  dna: KolmiDnaResult | null,
  isFirst: boolean,
) {
  const intro = fillTemplate(pickIntro(profile.id, isFirst), {
    name: profile.firstName,
  })
  events.push({
    kind: 'matchmaker_message',
    id: newId('msg'),
    tone: 'intro',
    text: intro,
    at: nowIso(),
  })

  events.push({
    kind: 'profile_presentation',
    id: newId('prof'),
    profileId: profile.id,
    stage: 'building',
    at: nowIso(),
  })

  const user = userAxesFromDna(dna)
  const ctx = pickContext(user, profileAxes(profile), profile.id)
  events.push({
    kind: 'matchmaker_message',
    id: newId('msg'),
    tone: 'context',
    text: ctx,
    at: nowIso(),
  })

  events.push({
    kind: 'decision_inline',
    id: newId('dec'),
    profileId: profile.id,
    at: nowIso(),
  })
}

// ─── Application d'une décision utilisateur ─────────────────────────

export function recordDecision(
  state: ConversationState,
  profileId: string,
  choice: Choice,
  profiles: SelectedProfile[],
  dna: KolmiDnaResult | null,
  note?: string,
): ConversationState {
  // 1. Marquer la presentation comme decided
  // 2. Remplacer decision_inline par user_decision
  // 3. Append matchmaker_message (réaction)
  // 4. Si profil suivant existe → append intro + présentation + contexte + décision
  //    Sinon → append closing + session_end

  const events = state.events.map((ev) => {
    if (ev.kind === 'profile_presentation' && ev.profileId === profileId) {
      return { ...ev, stage: 'decided' as ProfileStage }
    }
    return ev
  })

  // Trouve l'event decision_inline pour ce profil et le remplace.
  const decisionIdx = events.findIndex(
    (ev) => ev.kind === 'decision_inline' && ev.profileId === profileId,
  )
  if (decisionIdx >= 0) {
    events[decisionIdx] = {
      kind: 'user_decision',
      id: events[decisionIdx].id,
      profileId,
      choice,
      note,
      at: nowIso(),
    }
  }

  // Profil concerné (pour {name} dans la réaction)
  const profile = profiles.find((p) => p.id === profileId)
  const reactionTpl = pickReaction(profileId, choice)
  events.push({
    kind: 'matchmaker_message',
    id: newId('msg'),
    tone: 'reaction',
    text: fillTemplate(reactionTpl, { name: profile?.firstName ?? '·' }),
    at: nowIso(),
  })

  const nextIndex = state.currentProfileIndex + 1
  const isLast = nextIndex >= state.profileIds.length

  if (!isLast) {
    const nextProfileId = state.profileIds[nextIndex]
    const nextProfile = profiles.find((p) => p.id === nextProfileId)
    if (nextProfile) {
      appendProfileBlock(events, nextProfile, dna, false)
    }
  } else {
    // Closing + session_end
    events.push({
      kind: 'matchmaker_message',
      id: newId('msg'),
      tone: 'closing',
      text: pickClosing(state.dayKey),
      at: nowIso(),
    })
    events.push({
      kind: 'session_end',
      id: newId('end'),
      text: '— · —',
      at: nowIso(),
    })
  }

  return {
    ...state,
    events,
    currentProfileIndex: nextIndex,
    cursorEventId: events[events.length - 1]?.id ?? state.cursorEventId,
  }
}

// Marque une présentation comme `ready` (animations finies, prêt à
// l'interaction). Idempotent — relancer ne fait rien si déjà ready.
export function markPresentationReady(
  state: ConversationState,
  profileId: string,
): ConversationState {
  const events = state.events.map((ev) => {
    if (
      ev.kind === 'profile_presentation' &&
      ev.profileId === profileId &&
      ev.stage === 'building'
    ) {
      return { ...ev, stage: 'ready' as ProfileStage }
    }
    return ev
  })
  return { ...state, events }
}

// ─── Persistance AsyncStorage ────────────────────────────────────────

export async function loadConversation(
  dayKey: string,
): Promise<ConversationState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_PREFIX + dayKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConversationState
    return parsed
  } catch (err) {
    console.warn('[kolmi] loadConversation failed', err)
    return null
  }
}

export async function saveConversation(
  state: ConversationState,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_PREFIX + state.dayKey,
      JSON.stringify(state),
    )
  } catch (err) {
    console.warn('[kolmi] saveConversation failed', err)
  }
}

// Cleanup paresseux : appelé à l'ouverture du tab. Supprime les
// conversations de plus de RETENTION_DAYS jours.
export async function cleanupOldConversations(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys()
    const convoKeys = allKeys.filter((k) => k.startsWith(STORAGE_PREFIX))
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)
    const cutoffKey = toDayKey(cutoff)
    const toDelete = convoKeys.filter((k) => {
      const day = k.slice(STORAGE_PREFIX.length)
      return day < cutoffKey
    })
    if (toDelete.length > 0) {
      await AsyncStorage.multiRemove(toDelete)
    }
  } catch (err) {
    console.warn('[kolmi] cleanupOldConversations failed', err)
  }
}

// Reset complet (appelé par resetKolmiState).
export async function clearAllConversations(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys()
    const convoKeys = allKeys.filter((k) => k.startsWith(STORAGE_PREFIX))
    if (convoKeys.length > 0) {
      await AsyncStorage.multiRemove(convoKeys)
    }
  } catch (err) {
    console.warn('[kolmi] clearAllConversations failed', err)
  }
}

// ─── Sélecteurs utiles côté UI ──────────────────────────────────────

export function isDayCompleted(state: ConversationState): boolean {
  return (
    state.profileIds.length > 0 &&
    state.currentProfileIndex >= state.profileIds.length
  )
}

export function activeProfileId(state: ConversationState): string | null {
  if (isDayCompleted(state)) return null
  return state.profileIds[state.currentProfileIndex] ?? null
}
