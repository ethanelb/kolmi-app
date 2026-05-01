import AsyncStorage from '@react-native-async-storage/async-storage'
import { dnaCategories } from '@/data/kolmiDna'
import { kolmiQuestions } from '@/data/kolmiQuestions'
import type { KolmiAnswer, KolmiDnaResult, Meeting } from './types'

const PROGRESS_KEY = 'kolmi.progress'
const ANSWERS_KEY = 'kolmi.answers'
const DNA_RESULT_KEY = 'kolmi.dna_result'
const PREFERENCES_KEY = 'kolmi.preferences'
const PROFILE_KEY = 'kolmi.profile'
const TOKENS_KEY = 'kolmi.tokens'
const PASSED_PROFILES_KEY = 'kolmi.passed_profiles'
const MEETINGS_KEY = 'kolmi.meetings'
const PUSH_TOKEN_KEY = 'kolmi.push_token'

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
  await setJson(PROGRESS_KEY, { ...current, ...progress })
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
    // TODO Supabase sync later
  } catch (err) {
    console.warn('[kolmi] saveKolmiAnswer failed', err)
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
  // TODO Supabase sync later
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
  // TODO Supabase sync later
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
  // TODO Supabase sync later
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

export async function setTokens(value: number) {
  const sanitized = Math.max(0, value)
  _tokensCache = sanitized
  await AsyncStorage.setItem(TOKENS_KEY, String(sanitized))
}

export async function addTokens(delta: number): Promise<number> {
  const current = await getTokens()
  const next = Math.max(0, current + delta)
  await setTokens(next)
  return next
}

export async function spendToken(): Promise<boolean> {
  const current = await getTokens()
  if (current <= 0) return false
  await setTokens(current - 1)
  return true
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
  // TODO Supabase sync later
}

export async function updateMeeting(id: string, patch: Partial<Meeting>) {
  const all = await getMeetings()
  const next = all.map((m) => (m.id === id ? { ...m, ...patch } : m))
  await setJson(MEETINGS_KEY, next)
}

export async function deleteMeeting(id: string) {
  const all = await getMeetings()
  const next = all.filter((m) => m.id !== id)
  await setJson(MEETINGS_KEY, next)
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
  await AsyncStorage.multiRemove([
    PROGRESS_KEY,
    ANSWERS_KEY,
    DNA_RESULT_KEY,
    PREFERENCES_KEY,
    PROFILE_KEY,
    TOKENS_KEY,
    PASSED_PROFILES_KEY,
    MEETINGS_KEY,
    PUSH_TOKEN_KEY,
  ])
}
