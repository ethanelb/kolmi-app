import {
  calculateKolmiDna,
  mapScoresToCategory,
} from '@/lib/kolmi/calculateDna'
import { dnaCategories, type DnaCategoryId } from '@/data/kolmiDna'
import type { KolmiAnswer, KolmiDimensionScores } from '@/lib/kolmi/types'
import type { KolmiDimension } from '@/data/kolmiQuestions'

const ZERO: KolmiDimensionScores = {
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

function profile(
  primary: KolmiDimension,
  secondary?: KolmiDimension,
): KolmiDimensionScores {
  const s = { ...ZERO }
  s[primary] = 6
  if (secondary) s[secondary] = 3
  return s
}

describe('mapScoresToCategory', () => {
  it.each<[DnaCategoryId, KolmiDimension, KolmiDimension | undefined]>([
    ['gainsbourg', 'romanticIntensity', 'independence'],
    ['piaf', 'romanticIntensity', 'emotionalAvailability'],
    ['kahlo', 'romanticIntensity', 'values'],
    ['cocteau', 'romanticIntensity', 'socialEnergy'],

    ['duras', 'emotionalAvailability', 'communication'],
    ['simone', 'emotionalAvailability', 'commitment'],
    ['chagall', 'emotionalAvailability', 'attachment'],

    ['saint_laurent', 'commitment', 'values'],
    ['baldwin', 'commitment', 'communication'],

    ['borges', 'values', 'communication'],

    ['sagan', 'independence', undefined],
    ['varda', 'independence', 'lifestyle'],

    ['godard', 'lifestyle', 'socialEnergy'],

    ['matisse', 'socialEnergy', 'communication'],

    ['camus', 'communication', undefined],

    ['arda', 'attachment', undefined],
  ])('%s reachable from primary=%s + secondary=%s', (expected, primary, secondary) => {
    expect(mapScoresToCategory(profile(primary, secondary))).toBe(expected)
  })

  it('returns a valid DnaCategoryId for an all-zero profile (degenerate input)', () => {
    const id = mapScoresToCategory(ZERO)
    expect(dnaCategories[id]).toBeDefined()
  })

  it('all 16 Maisons are reachable across the test matrix', () => {
    const reached = new Set<DnaCategoryId>()
    const probes: KolmiDimension[] = [
      'attachment',
      'emotionalAvailability',
      'communication',
      'commitment',
      'independence',
      'conflict',
      'romanticIntensity',
      'lifestyle',
      'values',
      'socialEnergy',
    ]
    for (const primary of probes) {
      for (const secondary of probes) {
        if (primary === secondary) continue
        reached.add(mapScoresToCategory(profile(primary, secondary)))
      }
      reached.add(mapScoresToCategory(profile(primary)))
    }
    const all = Object.keys(dnaCategories) as DnaCategoryId[]
    const missing = all.filter((id) => !reached.has(id))
    expect(missing).toEqual([])
  })
})

describe('calculateKolmiDna', () => {
  it('returns a result populated from category metadata', () => {
    const answer: KolmiAnswer = {
      questionId: 'q1',
      optionId: 'opt-1',
      value: 'opt-1',
      answeredAt: new Date().toISOString(),
    }
    const result = calculateKolmiDna([answer])
    expect(result.categoryId).toBeDefined()
    expect(result.categoryLabel).toContain('Maison')
    expect(result.primaryTraits.length).toBeGreaterThan(0)
    expect(result.summary.length).toBeGreaterThan(0)
    expect(result.scores.commitment).toBeGreaterThan(0)
  })

  it('handles empty answers gracefully', () => {
    const result = calculateKolmiDna([])
    expect(dnaCategories[result.categoryId]).toBeDefined()
  })

  it('ignores answers referencing unknown question/option ids', () => {
    const result = calculateKolmiDna([
      {
        questionId: 'unknown',
        optionId: 'unknown',
        value: 'x',
        answeredAt: new Date().toISOString(),
      },
    ])
    expect(dnaCategories[result.categoryId]).toBeDefined()
    for (const v of Object.values(result.scores)) {
      expect(v).toBe(0)
    }
  })
})
