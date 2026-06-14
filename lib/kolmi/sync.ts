import { supabase } from '@/lib/supabase'
import type { KolmiAnswer, KolmiDnaResult, Meeting, MeetingStatus } from './types'
import type { KolmiProfile, KolmiProgress } from './storage'

// Helpers pour récupérer le user_id courant (session anonyme ou réelle).
async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

// Adaptateur birthDate {day, month, year} → ISO date string. Renvoie null
// si tout n'est pas rempli (l'onboarding écrit ce champ progressivement).
function birthDateToISO(b: KolmiProfile['birthDate']): string | null {
  if (!b || !b.year || !b.month || !b.day) return null
  const mm = String(b.month).padStart(2, '0')
  const dd = String(b.day).padStart(2, '0')
  return `${b.year}-${mm}-${dd}`
}

// ─── Profile ────────────────────────────────────────────────────────

export async function syncProfileToDb(profile: KolmiProfile): Promise<void> {
  const userId = await currentUserId()
  if (!userId) return

  // Champs simples + payload `lifestyle` qui regroupe le reste pour ne pas
  // multiplier les colonnes au fur et à mesure que l'onboarding évolue.
  const lifestyle = {
    education: profile.education,
    occupation: profile.occupation,
    hasChildren: profile.hasChildren,
    origins: profile.origins,
    religion: profile.religion,
    showGenderOnProfile: profile.showGenderOnProfile,
    selfieVerifUrl: profile.selfieVerifUrl,
  }

  const { error } = await supabase
    .from('users')
    .update({
      first_name: profile.firstName ?? null,
      birthday: birthDateToISO(profile.birthDate),
      gender: profile.gender ?? null,
      height_cm: profile.heightCm ?? null,
      orientation: profile.orientations?.[0] ?? null,
      photo_urls: profile.photoUrls ?? [],
      city: profile.locationCity ?? null,
      lifestyle,
    })
    .eq('id', userId)

  if (error) console.warn('[kolmi.sync] profile failed', error.message)
}

// ─── Progress (flags onboarding / matchmaker) ──────────────────────

export async function syncProgressToDb(progress: KolmiProgress): Promise<void> {
  const userId = await currentUserId()
  if (!userId) return
  const { error } = await supabase
    .from('users')
    .update({
      onboarding_complete: progress.hasCompletedBaseOnboarding,
      matchmaker_complete: progress.hasCompletedMatchmaker,
    })
    .eq('id', userId)
  if (error) console.warn('[kolmi.sync] progress failed', error.message)
}

// ─── DNA result ─────────────────────────────────────────────────────

export async function syncDnaResultToDb(dna: KolmiDnaResult): Promise<void> {
  const userId = await currentUserId()
  if (!userId) return

  const { error } = await supabase
    .from('users')
    .update({
      dna_category_id: dna.categoryId,
      dna_scores: dna.scores,
      dna_calculated_at: dna.createdAt,
      matchmaker_complete: true,
    })
    .eq('id', userId)

  if (error) console.warn('[kolmi.sync] dna failed', error.message)
}

// ─── Tokens ────────────────────────────────────────────────────────

export async function syncTokensToDb(
  newValue: number,
  delta: number,
  reason: string,
): Promise<void> {
  const userId = await currentUserId()
  if (!userId) return

  const { error: updateErr } = await supabase
    .from('users')
    .update({ tokens: newValue })
    .eq('id', userId)
  if (updateErr) {
    console.warn('[kolmi.sync] tokens update failed', updateErr.message)
    return
  }

  if (delta !== 0) {
    const { error: ledgerErr } = await supabase
      .from('tokens_ledger')
      .insert({ user_id: userId, delta, reason })
    if (ledgerErr) console.warn('[kolmi.sync] ledger failed', ledgerErr.message)
  }
}

// ─── Answers ───────────────────────────────────────────────────────

export async function syncAnswerToDb(answer: KolmiAnswer): Promise<void> {
  const userId = await currentUserId()
  if (!userId) return

  const { error } = await supabase
    .from('answers')
    .upsert(
      {
        user_id: userId,
        question_id: answer.questionId,
        option_id: answer.optionId,
        value: answer.value,
        answered_at: answer.answeredAt,
      },
      { onConflict: 'user_id,question_id' },
    )
  if (error) console.warn('[kolmi.sync] answer failed', error.message)
}

// ─── Meetings ──────────────────────────────────────────────────────

// Map les statuts locaux (UX-rich) vers les statuts DB (proto).
const STATUS_LOCAL_TO_DB: Record<MeetingStatus, string> = {
  requested_by_me: 'pending',
  waiting_for_other: 'pending',
  accepted_waiting_slots: 'accepted',
  slots_submitted: 'scheduled',
  confirmed: 'confirmed',
  completed: 'confirmed',
  declined: 'declined',
  expired: 'cancelled',
}

export async function syncMeetingToDb(meeting: Meeting): Promise<void> {
  const userId = await currentUserId()
  if (!userId) return

  // En local, `profileId` est le profil cible (mock string id). Tant que la
  // table `users` ne contient que de vrais users de l'app, on ne peut pas
  // stocker un target_id qui pointe sur un id mock. On loggue et on no-op.
  // Quand le matching réel arrivera, `profileId` sera un UUID de users.id.
  if (!isUuid(meeting.profileId)) {
    console.log('[kolmi.sync] meeting target is mock profileId, skipping DB sync', meeting.profileId)
    return
  }

  const { error } = await supabase
    .from('meetings')
    .upsert(
      {
        id: meeting.id,
        requester_id: userId,
        target_id: meeting.profileId,
        status: STATUS_LOCAL_TO_DB[meeting.status],
        slot_options: meeting.selectedSlots ?? null,
        confirmed_slot: meeting.confirmedSlot ?? null,
        venue_id: meeting.venueId ?? null,
        matchmaker_note: meeting.note ?? null,
        created_at: meeting.createdAt,
      },
      { onConflict: 'id' },
    )
  if (error) console.warn('[kolmi.sync] meeting failed', error.message)
}

export async function syncMeetingDeletionToDb(id: string): Promise<void> {
  const userId = await currentUserId()
  if (!userId) return
  if (!isUuid(id)) return
  const { error } = await supabase.from('meetings').delete().eq('id', id)
  if (error) console.warn('[kolmi.sync] meeting delete failed', error.message)
}

// ─── Passed profiles ───────────────────────────────────────────────

export async function syncPassedProfileToDb(profileId: string): Promise<void> {
  const userId = await currentUserId()
  if (!userId) return

  const { error } = await supabase
    .from('passed_profiles')
    .upsert(
      { user_id: userId, profile_id: profileId },
      { onConflict: 'user_id,profile_id' },
    )
  if (error) console.warn('[kolmi.sync] passed failed', error.message)
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}
