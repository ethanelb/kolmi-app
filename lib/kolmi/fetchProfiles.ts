import { supabase } from '@/lib/supabase'
import type { DnaCategoryId } from '@/data/kolmiDna'
import {
  mockSelectedProfiles,
  type SelectedProfile,
} from '@/data/mockSelectedProfiles'

type UserRow = {
  id: string
  first_name: string | null
  age: number | null
  city: string | null
  dna_category_id: DnaCategoryId | null
  photo_urls: string[] | null
  profile_extras: ProfileExtras | null
}

type ProfileExtras = {
  dnaLabel?: string
  occupation?: string
  teaser?: string
  reason?: string
  bio?: string
  prompts?: { question: string; answer: string }[]
  intentions?: string
  interests?: string[]
  compatibilityPoints?: string[]
  cautionPoints?: string[]
  availabilityHint?: string
}

function rowToProfile(row: UserRow): SelectedProfile | null {
  // Un profil sans nom, sans DNA ou sans photo ne peut pas être affiché
  // proprement — on le skip côté client. Idem si une donnée critique
  // (intentions, interests) est absente : on retombe sur des défauts.
  if (!row.first_name || !row.dna_category_id) return null
  const extras = row.profile_extras ?? {}
  return {
    id: row.id,
    firstName: row.first_name,
    age: row.age ?? 0,
    city: row.city ?? '',
    dnaLabel: extras.dnaLabel ?? '',
    maisonId: row.dna_category_id,
    occupation: extras.occupation,
    teaser: extras.teaser,
    compatibility: 0, // déprécié — non utilisé pour le matching
    reason: extras.reason ?? '',
    photoUrl: row.photo_urls?.[0],
    photoUrls: row.photo_urls ?? [],
    bio: extras.bio,
    prompts: extras.prompts,
    intentions: extras.intentions ?? '',
    interests: extras.interests ?? [],
    compatibilityPoints: extras.compatibilityPoints ?? [],
    cautionPoints: extras.cautionPoints ?? [],
    availabilityHint: extras.availabilityHint ?? '',
  }
}

// Cache module-level des profils DB. Hydratée par fetchSelectableProfiles
// et lue par getProfileByIdSync (consommé dans les screens matches/meeting/*
// qui restent synchrones). À chaque nouveau fetch on remplace la map en
// entier — pas d'invalidation partielle.
const _profileCache = new Map<string, SelectedProfile>()

// Lookup sync : DB cache d'abord (uuid), puis mock file (slug).
// Utilisé par les screens existants qui ne peuvent pas devenir async.
export function getProfileByIdSync(id: string): SelectedProfile | undefined {
  const cached = _profileCache.get(id)
  if (cached) return cached
  return mockSelectedProfiles.find((p) => p.id === id)
}

// Fetch les profils sélectionnables : tous les users de la DB qui ont
// complété le matchmaker (donc qui ont un dna_category_id), sauf le user
// courant. Fallback sur les mocks statiques si la DB est vide ou KO.
export async function fetchSelectableProfiles(): Promise<SelectedProfile[]> {
  const { data: sessionData } = await supabase.auth.getSession()
  const currentUserId = sessionData.session?.user?.id

  // On exclut les profils qui ne sont pas prêts à être montrés :
  // - matchmaker non complété (pas de DNA → pas de Maison → on saurait
  //   pas où les ranger)
  // - onboarding incomplet (potentiellement pas de bio/photos/age,
  //   l'écran détail casserait)
  let query = supabase
    .from('users')
    .select(
      'id, first_name, age, city, dna_category_id, photo_urls, profile_extras',
    )
    .not('dna_category_id', 'is', null)
    .eq('onboarding_complete', true)
    .eq('matchmaker_complete', true)
  if (currentUserId) {
    query = query.neq('id', currentUserId)
  }

  const { data, error } = await query
  if (error || !data || data.length === 0) {
    if (error)
      console.warn(
        '[kolmi] fetchSelectableProfiles error, fallback to mocks',
        error.message,
      )
    return mockSelectedProfiles
  }

  const rows = data as UserRow[]
  const profiles: SelectedProfile[] = []
  for (const r of rows) {
    const p = rowToProfile(r)
    if (p) profiles.push(p)
  }
  if (profiles.length === 0) return mockSelectedProfiles
  // Hydrate le cache pour les lookups sync (screens matches/meeting/*).
  _profileCache.clear()
  for (const p of profiles) _profileCache.set(p.id, p)
  return profiles
}
