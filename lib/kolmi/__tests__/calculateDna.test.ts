import {
  calculateKolmiDna,
  computeAxisScores,
  mapAxisProfileToCategory,
  resolveAxisProfile,
  type AxisProfile,
} from '@/lib/kolmi/calculateDna'
import { dnaCategories, type DnaCategoryId } from '@/data/kolmiDna'
import { kolmiQuestions } from '@/data/kolmiQuestions'
import type { KolmiAnswer } from '@/lib/kolmi/types'

// Helper : construit une réponse pour la question d'index `qIdx` en
// choisissant l'option de label voulu (Oui / Plutôt / Pas vraiment / Je ne
// sais pas).
function answerByLabel(qIdx: number, label: string): KolmiAnswer {
  const q = kolmiQuestions[qIdx]
  const option = q.options.find((o) => o.label === label)
  if (!option) throw new Error(`option "${label}" not found on ${q.id}`)
  return {
    questionId: q.id,
    optionId: option.id,
    value: option.value,
    answeredAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('mapAxisProfileToCategory', () => {
  // Les 8 combinaisons mappent une à une vers les 8 Maisons.
  it.each<[AxisProfile, DnaCategoryId]>([
    [{ intensity: 'ardent', rhythm: 'fast', openness: 'open' }, 'cinabre'],
    [{ intensity: 'ardent', rhythm: 'fast', openness: 'selective' }, 'carmen'],
    [{ intensity: 'ardent', rhythm: 'slow', openness: 'open' }, 'saudade'],
    [{ intensity: 'ardent', rhythm: 'slow', openness: 'selective' }, 'terracotta'],
    [{ intensity: 'calm', rhythm: 'fast', openness: 'open' }, 'montparnasse'],
    [{ intensity: 'calm', rhythm: 'fast', openness: 'selective' }, 'bauhaus'],
    [{ intensity: 'calm', rhythm: 'slow', openness: 'open' }, 'bloomsbury'],
    [{ intensity: 'calm', rhythm: 'slow', openness: 'selective' }, 'indigo'],
  ])('%j → %s', (profile, expected) => {
    expect(mapAxisProfileToCategory(profile)).toBe(expected)
  })
})

describe('resolveAxisProfile (tie-break vers le pôle doux)', () => {
  it('score 0 → calm / slow / selective', () => {
    expect(resolveAxisProfile({ intensity: 0, rhythm: 0, openness: 0 })).toEqual({
      intensity: 'calm',
      rhythm: 'slow',
      openness: 'selective',
    })
  })

  it('score positif → pôle primaire', () => {
    expect(resolveAxisProfile({ intensity: 1, rhythm: 5, openness: 2 })).toEqual({
      intensity: 'ardent',
      rhythm: 'fast',
      openness: 'open',
    })
  })

  it('score négatif → pôle doux', () => {
    expect(resolveAxisProfile({ intensity: -3, rhythm: -1, openness: -7 })).toEqual({
      intensity: 'calm',
      rhythm: 'slow',
      openness: 'selective',
    })
  })
})

describe('computeAxisScores', () => {
  it('"Oui" sur question avec targetPole primaire ajoute +2 sur l’axe', () => {
    const scores = computeAxisScores([answerByLabel(0, 'Oui')], kolmiQuestions)
    // intensity_1.targetPole = ardent (primaire) → +2
    expect(scores.intensity).toBe(2)
    expect(scores.rhythm).toBe(0)
    expect(scores.openness).toBe(0)
  })

  it('"Oui" sur question inversée (targetPole = doux) retire 2 du score', () => {
    // intensity_2 a targetPole = calm. Score doit être -2 (côté calme).
    const scores = computeAxisScores([answerByLabel(1, 'Oui')], kolmiQuestions)
    expect(scores.intensity).toBe(-2)
  })

  it('"Pas vraiment" sur question primaire pousse vers le pôle doux', () => {
    const scores = computeAxisScores(
      [answerByLabel(0, 'Pas vraiment')],
      kolmiQuestions,
    )
    expect(scores.intensity).toBe(-1)
  })

  it('"Je ne sais pas" est neutre (0)', () => {
    const scores = computeAxisScores(
      [answerByLabel(0, 'Je ne sais pas')],
      kolmiQuestions,
    )
    expect(scores.intensity).toBe(0)
  })

  it('ignore les réponses dont le questionId est inconnu', () => {
    const scores = computeAxisScores(
      [
        {
          questionId: 'unknown_question',
          optionId: 'x',
          value: 'x',
          answeredAt: '',
        },
      ],
      kolmiQuestions,
    )
    expect(scores).toEqual({ intensity: 0, rhythm: 0, openness: 0 })
  })
})

describe('calculateKolmiDna — exemple du spec', () => {
  // Cas du spec : Q1 Plutôt, Q2 Pas vraiment, Q3 Oui → Ardent
  //               Q4 Pas vraiment, Q5 Oui, Q6 Plutôt → Lent
  //               Q7 Pas vraiment, Q8 Oui → Sélectif
  //               → Maison Terracotta
  it('produit Maison Terracotta sur le scénario fourni dans le spec', () => {
    const answers: KolmiAnswer[] = [
      answerByLabel(0, 'Plutôt'),
      answerByLabel(1, 'Pas vraiment'),
      answerByLabel(2, 'Oui'),
      answerByLabel(3, 'Pas vraiment'),
      answerByLabel(4, 'Oui'),
      answerByLabel(5, 'Plutôt'),
      answerByLabel(6, 'Pas vraiment'),
      answerByLabel(7, 'Oui'),
    ]
    const result = calculateKolmiDna(answers)
    expect(result.categoryId).toBe('terracotta')
    expect(result.categoryLabel).toBe('Maison Terracotta')
    expect(result.scores.intensity).toBeGreaterThan(0)
    expect(result.scores.rhythm).toBeLessThan(0)
    expect(result.scores.openness).toBeLessThan(0)
  })

  it('toutes "Je ne sais pas" → fallback vers Indigo (3 pôles doux)', () => {
    const answers = kolmiQuestions.map((_, i) =>
      answerByLabel(i, 'Je ne sais pas'),
    )
    const result = calculateKolmiDna(answers)
    expect(result.categoryId).toBe('indigo')
  })

  it('toutes "Oui" sur questions ardent/fast/open + sélectif → cohérence', () => {
    // Ardent (Q1, Q3 = ardent ; Q2 = calm)
    // Fast   (Q4, Q6 = fast ; Q5 = slow)
    // Selective (Q7 = open ; Q8 = selective)
    const answers: KolmiAnswer[] = [
      answerByLabel(0, 'Oui'),       // ardent +2
      answerByLabel(1, 'Pas vraiment'), // calm targetPole, "Pas vraiment" → ardent +1
      answerByLabel(2, 'Oui'),       // ardent +2
      answerByLabel(3, 'Oui'),       // fast +2
      answerByLabel(4, 'Pas vraiment'), // slow targetPole, → fast +1
      answerByLabel(5, 'Oui'),       // fast +2
      answerByLabel(6, 'Pas vraiment'), // open targetPole, → selective +1
      answerByLabel(7, 'Oui'),       // selective +2
    ]
    const result = calculateKolmiDna(answers)
    expect(result.categoryId).toBe('carmen')
  })

  it('toutes les 8 Maisons sont catégorisables et listées dans dnaCategories', () => {
    const ids: DnaCategoryId[] = [
      'cinabre',
      'carmen',
      'saudade',
      'terracotta',
      'montparnasse',
      'bauhaus',
      'bloomsbury',
      'indigo',
    ]
    for (const id of ids) {
      expect(dnaCategories[id]).toBeDefined()
    }
  })

  it('réponses vides → résultat valide (toutes-zero → indigo)', () => {
    const result = calculateKolmiDna([])
    expect(dnaCategories[result.categoryId]).toBeDefined()
    expect(result.categoryId).toBe('indigo')
  })
})
