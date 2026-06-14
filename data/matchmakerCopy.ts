// Banque de phrases du matchmaker. Tout est mat, court, italique
// éditorial. On varie pour ne pas répéter jour après jour, mais on
// garde un registre cohérent (vouvoiement, pas d'exclamation, jamais
// d'emoji, jamais de sales-pitch).

import type { DnaCategoryId } from './kolmiDna'

// ─── Ouvertures de la session du jour ────────────────────────────────
export const OPENINGS_MORNING = [
  "Bonjour. J'ai trois envois pour vous ce matin.",
  'Bonjour. Voici votre courrier du jour.',
  "Bonjour. J'ai pris le temps de vous lire — voici trois noms.",
] as const

export const OPENINGS_DAY = [
  'Voici votre sélection du jour.',
  "J'ai pensé à trois personnes pour vous.",
  "Trois envois aujourd'hui. À vous de lire.",
] as const

export const OPENINGS_EVENING = [
  'Trois lectures pour ce soir.',
  "J'ai pris la liberté de vous présenter trois noms ce soir.",
  'Bonsoir. Voici votre sélection.',
] as const

// ─── Introductions d'un profil (avant la carte) ──────────────────────
export const INTROS = [
  "J'ai pensé à vous pour {name}.",
  'Voici {name}.',
  '{name}, je vous le présente.',
  "Je commence par {name}.",
] as const

export const INTROS_NEXT = [
  'Ensuite : {name}.',
  'Puis {name}.',
  'Et enfin : {name}.',
  '{name} maintenant.',
] as const

// ─── Phrases contextuelles (après la carte, avant la décision) ───────
// Le moteur en pioche une qui matche les axes de Maison communs entre
// l'utilisateur et le profil présenté. Si rien ne matche, on retombe
// sur GENERIC_CONTEXT.
export type AxisMatchKey =
  | 'same_intensity_ardent'
  | 'same_intensity_calm'
  | 'same_rhythm_fast'
  | 'same_rhythm_slow'
  | 'same_openness_open'
  | 'same_openness_selective'
  | 'complementary'
  | 'same_maison'

export const CONTEXT_BY_AXIS: Record<AxisMatchKey, readonly string[]> = {
  same_intensity_ardent: [
    'Vous brûlez du même feu.',
    'Même intensité — ça se reconnaîtra vite.',
  ],
  same_intensity_calm: [
    'Vous avez le même tempérament calme.',
    "L'un comme l'autre, vous gardez la mesure.",
  ],
  same_rhythm_fast: [
    'Vous avancez vite tous les deux.',
    "Même rythme — pas le genre à attendre dix rendez-vous.",
  ],
  same_rhythm_slow: [
    'Iel prend son temps, comme vous.',
    "Pas pressé·e. Vous non plus.",
  ],
  same_openness_open: [
    'Iel reste ouvert·e. Vous aussi.',
    'Vous laissez tous les deux la place à la surprise.',
  ],
  same_openness_selective: [
    "Iel choisit avec soin. Vous aussi.",
    'Profils sélectifs — vous savez ce que vous cherchez.',
  ],
  complementary: [
    "Iel n'est pas comme vous — c'est peut-être ce qu'il vous faut.",
    'Profils opposés. Mes meilleures intuitions sont sur ce genre de paire.',
  ],
  same_maison: [
    "Même Maison que vous. C'est rare.",
    "Vous appartenez à la même Maison. Je vous le présente sans hésiter.",
  ],
}

export const GENERIC_CONTEXT = [
  "Je vous le présente parce que ça m'a semblé juste.",
  'Une intuition. À vous de voir.',
  "Quelque chose dans son profil m'a fait penser à vous.",
] as const

// ─── Réactions après une décision utilisateur ────────────────────────
export const REACTIONS_AFTER_REQUEST = [
  'Bien noté. {name} recevra votre demande.',
  'Transmis.',
  "C'est parti. {name} décidera dans les heures qui viennent.",
] as const

export const REACTIONS_AFTER_PASS = [
  "Très bien. {name} ne vous reverra pas.",
  "Je l'écarte.",
  "Bien noté. On passe au suivant.",
] as const

// ─── Closings (3 profils traités) ────────────────────────────────────
export const CLOSINGS = [
  'À demain. Je vous prépare la prochaine sélection.',
  "C'est tout pour aujourd'hui. Je travaille pour demain.",
  'On en reste là. Je vous écris demain.',
] as const

// ─── Cas particulier : aucun profil disponible ───────────────────────
export const NO_PROFILES_YET = [
  "Je travaille pour vous. Vos premiers envois arrivent bientôt.",
  "Je prends le temps de vous lire. Premier courrier d'ici peu.",
] as const

// ─── Helpers ─────────────────────────────────────────────────────────

// Pioche déterministe-ish basée sur une seed (pour que la même journée
// affiche les mêmes phrases au reload). On fait un hash très simple
// (somme des codepoints) plutôt qu'un Math.random pur.
function pickByHash<T>(arr: readonly T[], seed: string): T {
  let n = 0
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i)
  return arr[n % arr.length]
}

export function pickOpening(hour: number, dayKey: string): string {
  if (hour < 11) return pickByHash(OPENINGS_MORNING, dayKey + 'morning')
  if (hour < 19) return pickByHash(OPENINGS_DAY, dayKey + 'day')
  return pickByHash(OPENINGS_EVENING, dayKey + 'evening')
}

export function pickIntro(profileId: string, isFirst: boolean): string {
  const arr = isFirst ? INTROS : INTROS_NEXT
  return pickByHash(arr, profileId + (isFirst ? '-first' : '-next'))
}

export function pickReaction(profileId: string, choice: 'request' | 'pass'): string {
  const arr = choice === 'request' ? REACTIONS_AFTER_REQUEST : REACTIONS_AFTER_PASS
  return pickByHash(arr, profileId + choice)
}

export function pickClosing(dayKey: string): string {
  return pickByHash(CLOSINGS, dayKey + 'closing')
}

export function fillTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

// Trouve la meilleure clé d'axe pour un user/profile pair. Si même
// Maison, on renvoie 'same_maison' direct. Sinon on prend le premier
// axe partagé dans l'ordre intensity → rhythm → openness. Si aucun,
// on tombe sur 'complementary'.
export type UserAxes = {
  maisonId: DnaCategoryId
  intensity: 'ardent' | 'calm'
  rhythm: 'fast' | 'slow'
  openness: 'open' | 'selective'
}

export type ProfileAxes = {
  maisonId?: DnaCategoryId
  intensity?: 'ardent' | 'calm'
  rhythm?: 'fast' | 'slow'
  openness?: 'open' | 'selective'
}

export function bestAxisMatch(
  user: UserAxes,
  profile: ProfileAxes,
): AxisMatchKey {
  if (profile.maisonId && profile.maisonId === user.maisonId) {
    return 'same_maison'
  }
  if (profile.intensity === user.intensity) {
    return user.intensity === 'ardent'
      ? 'same_intensity_ardent'
      : 'same_intensity_calm'
  }
  if (profile.rhythm === user.rhythm) {
    return user.rhythm === 'fast' ? 'same_rhythm_fast' : 'same_rhythm_slow'
  }
  if (profile.openness === user.openness) {
    return user.openness === 'open'
      ? 'same_openness_open'
      : 'same_openness_selective'
  }
  return 'complementary'
}

export function pickContext(
  user: UserAxes | null,
  profile: ProfileAxes,
  profileId: string,
): string {
  if (!user) {
    return pickByHash(GENERIC_CONTEXT, profileId + 'generic')
  }
  const key = bestAxisMatch(user, profile)
  return pickByHash(CONTEXT_BY_AXIS[key], profileId + key)
}
