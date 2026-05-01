import { dnaCategories, type DnaCategoryId } from '@/data/kolmiDna'
import {
  kolmiQuestions,
  type AxisPole,
  type KolmiAxis,
  type KolmiQuestion,
} from '@/data/kolmiQuestions'
import type {
  KolmiAnswer,
  KolmiAxisScores,
  KolmiDnaResult,
} from './types'

// Pôle "primaire" de chaque axe — celui pour lequel un score signé positif
// vote. Le pôle opposé est le pôle "doux" (calm / slow / selective) et gagne
// en cas d'égalité parfaite (score = 0), comme demandé par le spec.
const PRIMARY_POLE: Record<KolmiAxis, AxisPole> = {
  intensity: 'ardent',
  rhythm: 'fast',
  openness: 'open',
}

const emptyScores: KolmiAxisScores = {
  intensity: 0,
  rhythm: 0,
  openness: 0,
}

export function calculateKolmiDna(answers: KolmiAnswer[]): KolmiDnaResult {
  const scores = computeAxisScores(answers, kolmiQuestions)
  const profile = resolveAxisProfile(scores)
  const categoryId = mapAxisProfileToCategory(profile)
  const category = dnaCategories[categoryId]

  return {
    categoryId,
    categoryLabel: category.label,
    scores,
    primaryTraits: category.traits,
    summary: category.description,
    createdAt: new Date().toISOString(),
  }
}

// Somme les poids signés question par question. Pour chaque réponse, le poids
// de l'option pousse vers `targetPole` ; on convertit en score signé sur
// l'axe (positif = pôle primaire) en inversant le poids quand `targetPole`
// est le pôle "doux".
export function computeAxisScores(
  answers: KolmiAnswer[],
  questions: KolmiQuestion[],
): KolmiAxisScores {
  const scores: KolmiAxisScores = { ...emptyScores }
  const byId = new Map(questions.map((q) => [q.id, q]))

  for (const answer of answers) {
    const question = byId.get(answer.questionId)
    if (!question) continue
    const option = question.options.find((opt) => opt.id === answer.optionId)
    if (!option) continue

    const sign = question.targetPole === PRIMARY_POLE[question.axis] ? 1 : -1
    scores[question.axis] += option.weight * sign
  }

  return scores
}

export type AxisProfile = {
  intensity: 'ardent' | 'calm'
  rhythm: 'fast' | 'slow'
  openness: 'open' | 'selective'
}

// Score > 0 → pôle primaire ; <= 0 → pôle doux (par défaut, comme spec).
export function resolveAxisProfile(scores: KolmiAxisScores): AxisProfile {
  return {
    intensity: scores.intensity > 0 ? 'ardent' : 'calm',
    rhythm: scores.rhythm > 0 ? 'fast' : 'slow',
    openness: scores.openness > 0 ? 'open' : 'selective',
  }
}

// Lookup direct des 8 combinaisons. La clé est `intensity|rhythm|openness`.
const PROFILE_TO_CATEGORY: Record<string, DnaCategoryId> = {
  'ardent|fast|open': 'cinabre',
  'ardent|fast|selective': 'carmen',
  'ardent|slow|open': 'saudade',
  'ardent|slow|selective': 'terracotta',
  'calm|fast|open': 'montparnasse',
  'calm|fast|selective': 'bauhaus',
  'calm|slow|open': 'bloomsbury',
  'calm|slow|selective': 'indigo',
}

export function mapAxisProfileToCategory(profile: AxisProfile): DnaCategoryId {
  const key = `${profile.intensity}|${profile.rhythm}|${profile.openness}`
  // Le lookup est exhaustif (8 entrées pour 8 combinaisons), mais on
  // garde un fallback explicite vers la Maison "doux totale" pour
  // satisfaire TS et couvrir un futur changement d'axe.
  return PROFILE_TO_CATEGORY[key] ?? 'indigo'
}
