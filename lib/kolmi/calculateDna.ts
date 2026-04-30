import { dnaCategories, type DnaCategoryId } from '@/data/kolmiDna'
import {
  kolmiQuestions,
  bonusDnaQuestions,
  type KolmiDimension,
} from '@/data/kolmiQuestions'
import type {
  KolmiAnswer,
  KolmiDimensionScores,
  KolmiDnaResult,
} from './types'

const emptyScores: KolmiDimensionScores = {
  attachment: 0,
  emotionalAvailability: 0,
  communication: 0,
  commitment: 0,
  independence: 0,
  conflict: 0,
  romanticIntensity: 0,
  lifestyle: 0,
  values: 0,
  socialEnergy: 0,
}

export function calculateKolmiDna(answers: KolmiAnswer[]): KolmiDnaResult {
  const scores: KolmiDimensionScores = { ...emptyScores }
  const allQuestions = [...kolmiQuestions, ...bonusDnaQuestions]

  for (const answer of answers) {
    const question = allQuestions.find((item) => item.id === answer.questionId)
    const option = question?.options.find((item) => item.id === answer.optionId)
    if (!option?.scores) continue
    for (const [dimension, value] of Object.entries(option.scores)) {
      scores[dimension as KolmiDimension] += value ?? 0
    }
  }

  const categoryId = mapScoresToCategory(scores)
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

/**
 * Map a score profile to one of the 16 Maisons by ranking dimensions
 * and matching the top two against an authored lookup table.
 *
 * Why top-2 instead of thresholds: with 16 questions × ~2 scoring dims
 * per option × scores 1-3, most users top out at ~3-6 on their main
 * axis. A `>= 4` threshold leaves many users off the map, and only
 * about 9 of the 16 Maisons reachable. Top-2 ranking is always defined
 * and every Maison has at least one entry below.
 */
export function mapScoresToCategory(s: KolmiDimensionScores): DnaCategoryId {
  const ranked = (Object.entries(s) as [KolmiDimension, number][])
    .sort((a, b) => b[1] - a[1])

  const primaryEntry = ranked[0]
  const secondaryEntry = ranked[1]
  if (!primaryEntry) return 'duras'

  const primary = primaryEntry[0]
  const primaryTable = TABLE[primary]
  if (!primaryTable) return 'duras'

  // Only treat the second-ranked dimension as "secondary" if it actually
  // scored. Otherwise the tie-break would pick a meaningless dimension
  // (object insertion order) and bias every degenerate profile toward
  // the same Maison.
  const secondary = secondaryEntry && secondaryEntry[1] > 0 ? secondaryEntry[0] : undefined
  if (!secondary) return primaryTable.default

  return primaryTable[secondary] ?? primaryTable.default
}

type SecondaryMap = { default: DnaCategoryId } & Partial<
  Record<KolmiDimension, DnaCategoryId>
>

// Each primary dimension defines a "house" of Maisons whose archetypes
// align with it. The secondary picks the specific Maison; `default` is
// a safe fallback when the secondary isn't covered.
const TABLE: Record<KolmiDimension, SecondaryMap> = {
  romanticIntensity: {
    default: 'gainsbourg',
    independence: 'gainsbourg',
    emotionalAvailability: 'piaf',
    values: 'kahlo',
    socialEnergy: 'cocteau',
    attachment: 'piaf',
    commitment: 'kahlo',
  },
  emotionalAvailability: {
    default: 'duras',
    communication: 'duras',
    commitment: 'simone',
    attachment: 'chagall',
    romanticIntensity: 'piaf',
    values: 'simone',
    conflict: 'duras',
  },
  commitment: {
    default: 'saint_laurent',
    values: 'saint_laurent',
    emotionalAvailability: 'simone',
    communication: 'baldwin',
    attachment: 'simone',
    romanticIntensity: 'kahlo',
    independence: 'saint_laurent',
  },
  values: {
    default: 'baldwin',
    commitment: 'baldwin',
    communication: 'borges',
    romanticIntensity: 'kahlo',
    emotionalAvailability: 'simone',
    attachment: 'baldwin',
  },
  independence: {
    default: 'sagan',
    romanticIntensity: 'gainsbourg',
    lifestyle: 'varda',
    socialEnergy: 'sagan',
    communication: 'sagan',
    commitment: 'saint_laurent',
  },
  lifestyle: {
    default: 'varda',
    independence: 'varda',
    socialEnergy: 'godard',
    communication: 'godard',
    romanticIntensity: 'cocteau',
    values: 'varda',
  },
  socialEnergy: {
    default: 'cocteau',
    communication: 'matisse',
    romanticIntensity: 'cocteau',
    lifestyle: 'godard',
    values: 'matisse',
    emotionalAvailability: 'cocteau',
  },
  communication: {
    default: 'camus',
    emotionalAvailability: 'duras',
    values: 'borges',
    socialEnergy: 'matisse',
    conflict: 'camus',
    commitment: 'baldwin',
    independence: 'camus',
  },
  attachment: {
    default: 'arda',
    emotionalAvailability: 'chagall',
    commitment: 'simone',
    romanticIntensity: 'piaf',
    values: 'arda',
    communication: 'chagall',
  },
  conflict: {
    default: 'camus',
    communication: 'camus',
    emotionalAvailability: 'duras',
    values: 'baldwin',
    independence: 'sagan',
  },
}
