import AsyncStorage from '@react-native-async-storage/async-storage'
import type { KolmiAnswer, KolmiDnaResult, Meeting } from './types'

const PROGRESS_KEY = 'kolmi.progress'
const ANSWERS_KEY = 'kolmi.answers'
const DNA_RESULT_KEY = 'kolmi.dna_result'
const PREFERENCES_KEY = 'kolmi.preferences'
const PROFILE_KEY = 'kolmi.profile'
const TOKENS_KEY = 'kolmi.tokens'
const PASSED_PROFILES_KEY = 'kolmi.passed_profiles'
const MEETINGS_KEY = 'kolmi.meetings'

export type KolmiProgress = {
  hasCompletedBaseOnboarding: boolean
  hasCompletedMatchmaker: boolean
}

export type KolmiPreferences = {
  minAge: number
  maxAge: number
  distance: string
}

export type KolmiProfile = {
  phone?: string
  firstName?: string
  birthDate?: { day: number; month: number; year: number }
  gender?: string
  showGenderOnProfile?: boolean
  orientations?: string[]
  heightCm?: number
  lifestyle?: Record<string, string>
  photoUrls?: string[]
  hasVocalIntro?: boolean
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
  return getJson<KolmiAnswer[]>(ANSWERS_KEY, [])
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

export async function saveKolmiDnaResult(result: KolmiDnaResult) {
  await setJson(DNA_RESULT_KEY, result)
  // TODO Supabase sync later
}

export async function getKolmiDnaResult(): Promise<KolmiDnaResult | null> {
  return getJson<KolmiDnaResult | null>(DNA_RESULT_KEY, null)
}

export async function getKolmiProfile(): Promise<KolmiProfile> {
  return getJson<KolmiProfile>(PROFILE_KEY, {})
}

export async function saveKolmiProfile(patch: Partial<KolmiProfile>) {
  const current = await getKolmiProfile()
  await setJson(PROFILE_KEY, { ...current, ...patch })
  // TODO Supabase sync later
}

export async function saveKolmiPreferences(prefs: KolmiPreferences) {
  await setJson(PREFERENCES_KEY, prefs)
  // TODO Supabase sync later
}

export async function getKolmiPreferences(): Promise<KolmiPreferences | null> {
  return getJson<KolmiPreferences | null>(PREFERENCES_KEY, null)
}

// ─── Tokens (paid meeting requests) ──────────────────────────────────

export async function getTokens(): Promise<number> {
  const raw = await AsyncStorage.getItem(TOKENS_KEY)
  if (raw === null) return 0
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n)) {
    await AsyncStorage.removeItem(TOKENS_KEY)
    return 0
  }
  return n
}

export async function setTokens(value: number) {
  await AsyncStorage.setItem(TOKENS_KEY, String(Math.max(0, value)))
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

export async function resetKolmiState() {
  await AsyncStorage.multiRemove([
    PROGRESS_KEY,
    ANSWERS_KEY,
    DNA_RESULT_KEY,
    PREFERENCES_KEY,
    PROFILE_KEY,
    TOKENS_KEY,
    PASSED_PROFILES_KEY,
    MEETINGS_KEY,
  ])
}
