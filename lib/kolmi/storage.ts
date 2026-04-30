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

export async function getKolmiProgress(): Promise<KolmiProgress> {
  const raw = await AsyncStorage.getItem(PROGRESS_KEY)
  if (!raw) return defaultProgress
  return { ...defaultProgress, ...JSON.parse(raw) }
}

export async function saveKolmiProgress(progress: Partial<KolmiProgress>) {
  const current = await getKolmiProgress()
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...current, ...progress }))
}

export async function getKolmiAnswers(): Promise<KolmiAnswer[]> {
  const raw = await AsyncStorage.getItem(ANSWERS_KEY)
  return raw ? JSON.parse(raw) : []
}

export async function saveKolmiAnswer(answer: KolmiAnswer) {
  try {
    const current = await getKolmiAnswers()
    const next = current.filter((item) => item.questionId !== answer.questionId)
    next.push(answer)
    await AsyncStorage.setItem(ANSWERS_KEY, JSON.stringify(next))
    // TODO Supabase sync later
  } catch (err) {
    console.warn('[kolmi] saveKolmiAnswer failed', err)
  }
}

export async function saveKolmiDnaResult(result: KolmiDnaResult) {
  try {
    await AsyncStorage.setItem(DNA_RESULT_KEY, JSON.stringify(result))
    // TODO Supabase sync later
  } catch (err) {
    console.warn('[kolmi] saveKolmiDnaResult failed', err)
  }
}

export async function getKolmiDnaResult(): Promise<KolmiDnaResult | null> {
  const raw = await AsyncStorage.getItem(DNA_RESULT_KEY)
  return raw ? JSON.parse(raw) : null
}

export async function getKolmiProfile(): Promise<KolmiProfile> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY)
  return raw ? JSON.parse(raw) : {}
}

export async function saveKolmiProfile(patch: Partial<KolmiProfile>) {
  try {
    const current = await getKolmiProfile()
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ ...current, ...patch }))
    // TODO Supabase sync later
  } catch (err) {
    console.warn('[kolmi] saveKolmiProfile failed', err)
  }
}

export async function saveKolmiPreferences(prefs: KolmiPreferences) {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs))
    // TODO Supabase sync later
  } catch (err) {
    console.warn('[kolmi] saveKolmiPreferences failed', err)
  }
}

export async function getKolmiPreferences(): Promise<KolmiPreferences | null> {
  const raw = await AsyncStorage.getItem(PREFERENCES_KEY)
  return raw ? JSON.parse(raw) : null
}

// ─── Tokens (paid meeting requests) ──────────────────────────────────

export async function getTokens(): Promise<number> {
  const raw = await AsyncStorage.getItem(TOKENS_KEY)
  if (!raw) return 0
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? n : 0
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
  const raw = await AsyncStorage.getItem(PASSED_PROFILES_KEY)
  return raw ? JSON.parse(raw) : []
}

export async function passProfile(profileId: string) {
  try {
    const current = await getPassedProfiles()
    if (current.includes(profileId)) return
    const next = [...current, profileId]
    await AsyncStorage.setItem(PASSED_PROFILES_KEY, JSON.stringify(next))
  } catch (err) {
    console.warn('[kolmi] passProfile failed', err)
  }
}

// ─── Meetings (request → schedule → confirm) ─────────────────────────

export async function getMeetings(): Promise<Meeting[]> {
  const raw = await AsyncStorage.getItem(MEETINGS_KEY)
  return raw ? JSON.parse(raw) : []
}

export async function getMeetingById(id: string): Promise<Meeting | null> {
  const all = await getMeetings()
  return all.find((m) => m.id === id) ?? null
}

export async function saveMeeting(meeting: Meeting) {
  try {
    const all = await getMeetings()
    const next = [...all.filter((m) => m.id !== meeting.id), meeting]
    await AsyncStorage.setItem(MEETINGS_KEY, JSON.stringify(next))
    // TODO Supabase sync later
  } catch (err) {
    console.warn('[kolmi] saveMeeting failed', err)
  }
}

export async function updateMeeting(id: string, patch: Partial<Meeting>) {
  try {
    const all = await getMeetings()
    const next = all.map((m) => (m.id === id ? { ...m, ...patch } : m))
    await AsyncStorage.setItem(MEETINGS_KEY, JSON.stringify(next))
  } catch (err) {
    console.warn('[kolmi] updateMeeting failed', err)
  }
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
