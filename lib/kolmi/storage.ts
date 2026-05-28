import AsyncStorage from '@react-native-async-storage/async-storage'
import { dnaCategories } from '@/data/kolmiDna'
import { kolmiQuestions } from '@/data/kolmiQuestions'
import type { KolmiAnswer, KolmiDnaResult, Meeting } from './types'
import { clearAllConversations } from './conversationEngine'
import {
  syncAnswerToDb,
  syncDnaResultToDb,
  syncMeetingDeletionToDb,
  syncMeetingToDb,
  syncPassedProfileToDb,
  syncProfileToDb,
  syncProgressToDb,
  syncTokensToDb,
} from './sync'

// Fire-and-forget : la sync Supabase ne doit jamais bloquer l'UI ni casser
// le flow local. Toute erreur DB est déjà loguée dans `sync.ts`.
function fireAndForget(p: Promise<unknown>) {
  p.catch((err) => console.warn('[kolmi.storage] sync error', err))
}

const PROGRESS_KEY = 'kolmi.progress'
const ANSWERS_KEY = 'kolmi.answers'
const DNA_RESULT_KEY = 'kolmi.dna_result'
const PREFERENCES_KEY = 'kolmi.preferences'
const PROFILE_KEY = 'kolmi.profile'
const TOKENS_KEY = 'kolmi.tokens'
const PASSED_PROFILES_KEY = 'kolmi.passed_profiles'
const MEETINGS_KEY = 'kolmi.meetings'
const PUSH_TOKEN_KEY = 'kolmi.push_token'
const SUBSCRIPTION_KEY = 'kolmi.subscription'
const HAS_PURCHASED_KEY = 'kolmi.has_purchased'

export type KolmiProgress = {
  hasCompletedBaseOnboarding: boolean
  hasCompletedMatchmaker: boolean
}

export type KolmiPreferences = {
  minAge: number
  maxAge: number
  distance: string
  seekingGenders?: string[]
}

export type KolmiProfile = {
  firstName?: string
  birthDate?: { day: number; month: number; year: number }
  gender?: string
  showGenderOnProfile?: boolean
  heightCm?: number
  orientations?: string[]
  photoUrls?: string[]
  locationCity?: string
  education?: string
  occupation?: string
  hasChildren?: string
  origins?: string[]
  religion?: string
  selfieVerifUrl?: string
  pushNotificationsEnabled?: boolean
}

const defaultProgress: KolmiProgress = {
  hasCompletedBaseOnboarding: false,
  hasCompletedMatchmaker: false,
}

// ─── Helpers JSON robustes ───────────────────────────────────────────
//
// Si AsyncStorage contient une donnée corrompue (JSON invalide, type
// inattendu après une migration), on supprime la clé et on retourne le
// fallback plutôt que de laisser l'app crasher au boot.

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch (err) {
    console.warn(`[kolmi] corrupt JSON for ${key}, resetting`, err)
    await AsyncStorage.removeItem(key)
    return fallback
  }
}

async function setJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value))
}

export async function getKolmiProgress(): Promise<KolmiProgress> {
  const stored = await getJson<Partial<KolmiProgress>>(PROGRESS_KEY, {})
  return { ...defaultProgress, ...stored }
}

export async function saveKolmiProgress(progress: Partial<KolmiProgress>) {
  const current = await getKolmiProgress()
  const next = { ...current, ...progress }
  await setJson(PROGRESS_KEY, next)
  // Sync les flags onboarding/matchmaker vers la DB.
  fireAndForget(syncProgressToDb(next))
}

export async function getKolmiAnswers(): Promise<KolmiAnswer[]> {
  const raw = await getJson<KolmiAnswer[]>(ANSWERS_KEY, [])
  // Migration : si toutes les réponses stockées référencent des questions
  // qui n'existent plus dans le registre actuel (ancien système 16-Q), on
  // wipe pour libérer de la place + éviter de garder des données mortes.
  // On évite le wipe partiel pour ne pas perdre une réponse en cours d'un
  // test rejoué.
  const validIds = new Set(kolmiQuestions.map((q) => q.id))
  const valid = raw.filter((a) => validIds.has(a.questionId))
  if (raw.length > 0 && valid.length === 0) {
    try {
      await AsyncStorage.removeItem(ANSWERS_KEY)
    } catch (err) {
      console.warn('[kolmi] failed to wipe stale answers', err)
    }
    return []
  }
  return valid
}

// Mutations critiques : on laisse l'erreur AsyncStorage remonter au caller
// pour que l'UI ne navigue pas comme si tout était OK alors que la donnée
// n'a pas été persistée.

export async function saveKolmiAnswer(answer: KolmiAnswer) {
  // Best-effort : appelé à chaque réponse du matchmaker, on évite de
  // bloquer l'UI si AsyncStorage hiccupe sur une question. Le DNA final
  // sera recalculé sur l'ensemble des réponses présentes.
  try {
    const current = await getKolmiAnswers()
    const next = current.filter((item) => item.questionId !== answer.questionId)
    next.push(answer)
    await setJson(ANSWERS_KEY, next)
    fireAndForget(syncAnswerToDb(answer))
  } catch (err) {
    console.warn('[kolmi] saveKolmiAnswer failed', err)
  }
}

// Wipe les réponses du matchmaker pour permettre de refaire le test.
// On ne touche pas au DNA stocké : si l'utilisateur abandonne le retest,
// son ancien résultat reste valide. Le nouveau DNA écrasera l'ancien
// quand `saveKolmiDnaResult` sera appelé en fin de test.
export async function clearKolmiAnswers(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ANSWERS_KEY)
  } catch (err) {
    console.warn('[kolmi] clearKolmiAnswers failed', err)
  }
}

// Cache mémoire du résultat DNA. Lu sur chaque focus du tab Profil et sur
// l'écran résultat — on évite de retoucher AsyncStorage à chaque switch.
// Sentinelle séparée du `null` métier (pas de DNA) pour distinguer
// "pas hydraté" de "hydraté → null".
let _dnaCache: KolmiDnaResult | null | undefined = undefined

export async function saveKolmiDnaResult(result: KolmiDnaResult) {
  _dnaCache = result
  await setJson(DNA_RESULT_KEY, result)
  fireAndForget(syncDnaResultToDb(result))
}

export async function getKolmiDnaResult(): Promise<KolmiDnaResult | null> {
  if (_dnaCache !== undefined) return _dnaCache
  const stored = await getJson<KolmiDnaResult | null>(DNA_RESULT_KEY, null)
  if (!stored) {
    _dnaCache = null
    return null
  }
  // Migration : si le résultat stocké date de l'ancien système (16 Maisons,
  // 10 dimensions) son `categoryId` n'existe plus dans le nouveau registre
  // 8-Maisons. On nettoie + on demande à l'utilisateur de refaire le test.
  // try/catch : on tolère un échec de removeItem (storage saturé, etc.) —
  // mieux vaut renvoyer null et laisser l'utilisateur passer le matchmaker
  // que crasher au boot sur un wipe ratée.
  if (!dnaCategories[stored.categoryId]) {
    try {
      await AsyncStorage.multiRemove([DNA_RESULT_KEY, ANSWERS_KEY])
    } catch (err) {
      console.warn('[kolmi] failed to wipe stale dna_result', err)
    }
    _dnaCache = null
    return null
  }
  _dnaCache = stored
  return stored
}

// Cache mémoire du profil. L'onboarding navigue d'un écran à l'autre en
// chaîne, et chaque écran appelait `getKolmiProfile()` au mount → un read
// AsyncStorage (~10-30 ms) par écran. Le cache hydrate au premier appel
// puis sert toutes les lectures suivantes en O(1). Toute écriture (via
// `saveKolmiProfile`) met à jour le cache atomiquement avant la persistance.
let _profileCache: KolmiProfile | null = null

export async function getKolmiProfile(): Promise<KolmiProfile> {
  if (_profileCache) return _profileCache
  _profileCache = await getJson<KolmiProfile>(PROFILE_KEY, {})
  return _profileCache
}

export async function saveKolmiProfile(patch: Partial<KolmiProfile>) {
  const current = await getKolmiProfile()
  const next = { ...current, ...patch }
  // Mise à jour du cache d'abord pour que toute lecture concurrente voie
  // la valeur la plus récente, même si AsyncStorage prend du temps.
  _profileCache = next
  await setJson(PROFILE_KEY, next)
  fireAndForget(syncProfileToDb(next))
}

// Cache mémoire des préférences. Sentinelle `undefined` distincte de
// `null` métier pour différencier "pas hydraté" de "hydraté → absent".
let _prefsCache: KolmiPreferences | null | undefined = undefined

export async function saveKolmiPreferences(patch: Partial<KolmiPreferences>) {
  // Merge plutôt qu'overwrite : edit-preferences ne touche que minAge/maxAge/
  // distance et ne doit pas effacer le seekingGenders posé par /onboarding/seeking.
  const current = (await getKolmiPreferences()) ?? {
    minAge: 22,
    maxAge: 35,
    distance: '25 km',
  }
  const next = { ...current, ...patch }
  _prefsCache = next
  await setJson(PREFERENCES_KEY, next)
  // Préférences de recherche (âge/distance) — pas synchronisées en DB
  // pour l'instant : pas de table dédiée. À ajouter si on en a besoin
  // côté serveur (matching).
}

export async function getKolmiPreferences(): Promise<KolmiPreferences | null> {
  if (_prefsCache !== undefined) return _prefsCache
  _prefsCache = await getJson<KolmiPreferences | null>(PREFERENCES_KEY, null)
  return _prefsCache
}

// ─── Tokens (paid meeting requests) ──────────────────────────────────

// Cache mémoire du nombre de tokens. Lu sur chaque focus du tab Profil et
// avant chaque demande de rencontre — coûteux de retoucher AsyncStorage à
// chaque fois. -1 sentinelle = pas hydraté (les tokens réels sont >= 0).
let _tokensCache = -1

export async function getTokens(): Promise<number> {
  if (_tokensCache >= 0) return _tokensCache
  const raw = await AsyncStorage.getItem(TOKENS_KEY)
  if (raw === null) {
    _tokensCache = 0
    return 0
  }
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n)) {
    await AsyncStorage.removeItem(TOKENS_KEY)
    _tokensCache = 0
    return 0
  }
  _tokensCache = n
  return n
}

// setTokens : écriture brute sans ledger DB. Réservé aux usages internes
// (resync depuis DB, reset). Pour toute mutation business, passer par
// addTokens / spendToken qui enregistrent un delta avec une raison.
export async function setTokens(value: number) {
  const sanitized = Math.max(0, value)
  _tokensCache = sanitized
  await AsyncStorage.setItem(TOKENS_KEY, String(sanitized))
}

export async function addTokens(delta: number, reason = 'add'): Promise<number> {
  const current = await getTokens()
  const next = Math.max(0, current + delta)
  await setTokens(next)
  fireAndForget(syncTokensToDb(next, next - current, reason))
  return next
}

export async function spendToken(reason = 'meeting_request'): Promise<boolean> {
  const current = await getTokens()
  if (current <= 0) return false
  const next = current - 1
  await setTokens(next)
  fireAndForget(syncTokensToDb(next, -1, reason))
  return true
}

// ─── Subscription (formule abonnement) ──────────────────────────────
//
// Bêta : on stocke localement l'état d'abonnement. En prod, ça sera
// servi par le backend (Stripe / RevenueCat). Le champ `lastTokenGrant`
// permet d'éviter de re-créditer plusieurs fois les 5 tokens du mois si
// l'utilisateur revient sur l'écran sans re-souscrire.

export type KolmiSubscription = {
  isActive: boolean
  startedAt?: string // ISO date — début abonnement
  lastTokenGrant?: string // ISO date — dernier crédit mensuel
}

const defaultSubscription: KolmiSubscription = { isActive: false }

let _subscriptionCache: KolmiSubscription | undefined

export async function getSubscription(): Promise<KolmiSubscription> {
  if (_subscriptionCache !== undefined) return _subscriptionCache
  _subscriptionCache = await getJson<KolmiSubscription>(
    SUBSCRIPTION_KEY,
    defaultSubscription,
  )
  return _subscriptionCache
}

export async function setSubscription(
  patch: Partial<KolmiSubscription>,
): Promise<KolmiSubscription> {
  const current = await getSubscription()
  const next: KolmiSubscription = { ...current, ...patch }
  _subscriptionCache = next
  await setJson(SUBSCRIPTION_KEY, next)
  return next
}

export async function isSubscribed(): Promise<boolean> {
  const sub = await getSubscription()
  return sub.isActive
}

// Flag : l'utilisateur a-t-il déjà payé une fois ? (pack OU abo).
// Sert au nudge premium pour ne plus harceler ceux qui ont déjà
// converti. Une fois passé à true, on ne le repasse JAMAIS à false
// (sauf reset complet) — un user qui résilie son abo reste un client.
let _hasPurchasedCache: boolean | undefined

export async function getHasPurchased(): Promise<boolean> {
  if (_hasPurchasedCache !== undefined) return _hasPurchasedCache
  const raw = await AsyncStorage.getItem(HAS_PURCHASED_KEY)
  _hasPurchasedCache = raw === '1'
  return _hasPurchasedCache
}

export async function markPurchased(): Promise<void> {
  _hasPurchasedCache = true
  await AsyncStorage.setItem(HAS_PURCHASED_KEY, '1')
}

// ─── Passed profiles (locally hidden) ────────────────────────────────

export async function getPassedProfiles(): Promise<string[]> {
  return getJson<string[]>(PASSED_PROFILES_KEY, [])
}

export async function passProfile(profileId: string) {
  const current = await getPassedProfiles()
  if (current.includes(profileId)) return
  const next = [...current, profileId]
  await setJson(PASSED_PROFILES_KEY, next)
  fireAndForget(syncPassedProfileToDb(profileId))
}

// ─── Meetings (request → schedule → confirm) ─────────────────────────

export async function getMeetings(): Promise<Meeting[]> {
  return getJson<Meeting[]>(MEETINGS_KEY, [])
}

export async function getMeetingById(id: string): Promise<Meeting | null> {
  const all = await getMeetings()
  return all.find((m) => m.id === id) ?? null
}

// Statuts considérés terminaux : la rencontre est close, l'utilisateur peut
// en redemander une autre avec le même profil.
const TERMINAL_STATUSES: ReadonlyArray<Meeting['status']> = [
  'completed',
  'declined',
  'expired',
]

export function isTerminalStatus(status: Meeting['status']): boolean {
  return TERMINAL_STATUSES.includes(status)
}

// Renvoie le meeting le plus récent et non terminal pour un profil donné,
// ou null. Sert à empêcher les doublons côté `meeting/request`.
export async function findActiveMeetingForProfile(
  profileId: string,
): Promise<Meeting | null> {
  const all = await getMeetings()
  const active = all
    .filter((m) => m.profileId === profileId && !isTerminalStatus(m.status))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  return active[0] ?? null
}

export async function saveMeeting(meeting: Meeting) {
  const all = await getMeetings()
  const next = [...all.filter((m) => m.id !== meeting.id), meeting]
  await setJson(MEETINGS_KEY, next)
  fireAndForget(syncMeetingToDb(meeting))
}

export async function updateMeeting(id: string, patch: Partial<Meeting>) {
  const all = await getMeetings()
  const next = all.map((m) => (m.id === id ? { ...m, ...patch } : m))
  await setJson(MEETINGS_KEY, next)
  const merged = next.find((m) => m.id === id)
  if (merged) fireAndForget(syncMeetingToDb(merged))
}

export async function deleteMeeting(id: string) {
  const all = await getMeetings()
  const next = all.filter((m) => m.id !== id)
  await setJson(MEETINGS_KEY, next)
  fireAndForget(syncMeetingDeletionToDb(id))
}

// ─── Push notifications token ────────────────────────────────────────

export async function savePushToken(token: string | null): Promise<void> {
  try {
    if (token === null) {
      await AsyncStorage.removeItem(PUSH_TOKEN_KEY)
      return
    }
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token)
    // TODO Supabase sync later (push tokens must be associated to user_id server-side)
  } catch (err) {
    console.warn('[kolmi] savePushToken failed', err)
  }
}

export async function getPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY)
  } catch (err) {
    console.warn('[kolmi] getPushToken failed', err)
    return null
  }
}

export async function resetKolmiState() {
  // Invalide tous les caches mémoire avant le wipe disque pour qu'aucun
  // appel concurrent ne ré-hydrate sur des données mortes.
  _profileCache = null
  _dnaCache = undefined
  _prefsCache = undefined
  _tokensCache = -1
  _subscriptionCache = undefined
  _hasPurchasedCache = undefined
  await Promise.all([
    AsyncStorage.multiRemove([
      PROGRESS_KEY,
      ANSWERS_KEY,
      DNA_RESULT_KEY,
      PREFERENCES_KEY,
      PROFILE_KEY,
      TOKENS_KEY,
      PASSED_PROFILES_KEY,
      MEETINGS_KEY,
      PUSH_TOKEN_KEY,
      SUBSCRIPTION_KEY,
      HAS_PURCHASED_KEY,
    ]),
    // Les conversations sont indexées par dayKey, donc absentes des
    // clés statiques ci-dessus. Sans ce wipe, un re-onboarding le
    // même jour ressuscite une timeline éditoriale d'avant le reset.
    clearAllConversations(),
  ])
}
