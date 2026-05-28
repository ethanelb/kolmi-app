import { dnaCategories, type DnaCategoryId } from '@/data/kolmiDna'
import type { SelectedProfile } from '@/data/mockSelectedProfiles'
import type { KolmiDnaResult } from './types'

// Score d'affinité entre deux Maisons, dans [0, 4] :
//   4 → même Maison (match parfait)
//   3 → curée comme "compatible" dans data/kolmiDna.ts (affinité éditoriale)
//   0-3 → nombre d'axes (intensity / rhythm / openness) en accord
//
// Conséquence : un GIGI (ardent/fast/open) face à un Vesna (calm/slow/selective)
// retourne 0 — opposés totaux. Face à un Soléa (ardent/slow/open) → 2 axes
// en accord, mais aussi listé "compatible" donc on prend le max → 3.
export function scoreMaisonAffinity(a: DnaCategoryId, b: DnaCategoryId): number {
  if (a === b) return 4

  const catA = dnaCategories[a]
  const catB = dnaCategories[b]
  if (!catA || !catB) return 0

  const axesMatch =
    (catA.axes.intensity === catB.axes.intensity ? 1 : 0) +
    (catA.axes.rhythm === catB.axes.rhythm ? 1 : 0) +
    (catA.axes.openness === catB.axes.openness ? 1 : 0)

  // Les Maisons "compatible" sont une curation éditoriale qui peut traverser
  // l'opposition d'axes (ex: GIGI ↔ Soléa diffèrent en rythme mais sont
  // friends). On prend le max pour qu'une affinité curée ne soit jamais
  // dégradée par un axe en désaccord.
  const curatedBonus = catA.compatible.includes(b) ? 3 : 0
  return Math.max(axesMatch, curatedBonus)
}

// Filtre + classe les profils par affinité avec la Maison du user.
// - Si pas de DNA : retourne la liste inchangée (pas de filtre).
// - Sinon : ne garde que les profils de score >= MIN_SCORE, trié décroissant.
//   En cas d'égalité de score, on conserve l'ordre d'origine pour la
//   stabilité (un re-build le même jour montre la même séquence).
const MIN_SCORE = 2

export type RankedProfile = SelectedProfile & { affinityScore: number }

export function rankProfilesByAffinity(
  profiles: SelectedProfile[],
  dna: KolmiDnaResult | null,
): RankedProfile[] {
  if (!dna) {
    return profiles.map((p) => ({ ...p, affinityScore: 0 }))
  }
  const userMaison = dna.categoryId
  const scored = profiles.map((p, i) => {
    const score = p.maisonId ? scoreMaisonAffinity(userMaison, p.maisonId) : 0
    return { profile: p, score, originalIndex: i }
  })
  const filtered = scored.filter((s) => s.score >= MIN_SCORE)
  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.originalIndex - b.originalIndex
  })
  return filtered.map((s) => ({ ...s.profile, affinityScore: s.score }))
}
