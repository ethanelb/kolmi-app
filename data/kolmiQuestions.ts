// 8 questions répartis sur 3 axes binaires :
// - Intensité (Ardent · Calme)
// - Rythme (Rapide · Lent)
// - Ouverture (Ouvert · Sélectif)
//
// 2 × 2 × 2 = 8 combinaisons → 8 Maisons. Voir `data/kolmiDna.ts`.

export type KolmiAxis = 'intensity' | 'rhythm' | 'openness'

// Pôle "primaire" de chaque axe (côté positif dans le scoring signé) :
// intensity → 'ardent', rhythm → 'fast', openness → 'open'.
// Les pôles "doux" (calm / slow / selective) servent de fallback en
// cas d'égalité (score = 0) — c'est la convention voulue par le spec
// pour ne pas sur-promettre des Maisons intenses.
export type AxisPole =
  | 'ardent'
  | 'calm'
  | 'fast'
  | 'slow'
  | 'open'
  | 'selective'

export type QuestionSection = KolmiAxis

export type QuestionOption = {
  id: string
  label: string
  value: string
  // Poids signé vers le pôle cible (`targetPole`) de la question.
  // - "Oui"            : +2 vers le pôle cible
  // - "Plutôt"         : +1
  // - "Pas vraiment"   : -1 (équivaut à +1 vers le pôle opposé)
  // - "Je ne sais pas" :  0 (neutre)
  weight: -1 | 0 | 1 | 2
}

export type KolmiQuestion = {
  id: string
  text: string
  axis: KolmiAxis
  targetPole: AxisPole
  section: QuestionSection
  phaseTitle: string
  preface?: string
  outro?: string
  options: QuestionOption[]
}

const PHASE_TITLES: Record<KolmiAxis, string> = {
  intensity: 'Phase 1 — Intensité',
  rhythm: 'Phase 2 — Rythme',
  openness: 'Phase 3 — Ouverture',
}

// 4 options identiques pour les 8 questions. La fonction prend un id
// préfixe propre à chaque question pour garder des option ids uniques.
function standardOptions(prefix: string): QuestionOption[] {
  return [
    { id: `${prefix}-yes`, label: 'Oui', value: 'yes', weight: 2 },
    { id: `${prefix}-rather`, label: 'Plutôt', value: 'rather', weight: 1 },
    { id: `${prefix}-not-really`, label: 'Pas vraiment', value: 'not-really', weight: -1 },
    { id: `${prefix}-unsure`, label: 'Je ne sais pas', value: 'unsure', weight: 0 },
  ]
}

export const kolmiQuestions: KolmiQuestion[] = [
  // ─── Axe Intensité (3 questions) ─────────────────────────────────
  {
    id: 'intensity_1',
    axis: 'intensity',
    targetPole: 'ardent',
    section: 'intensity',
    phaseTitle: PHASE_TITLES.intensity,
    preface:
      "Bonjour. Je suis votre matchmaker personnel chez KOLMI. Je vais vous poser huit questions pour lire votre Maison — répondez d'instinct.",
    text:
      "Quand quelqu'un vous plaît vraiment, vous le ressentez fort, presque physiquement ?",
    options: standardOptions('intensity_1'),
  },
  {
    id: 'intensity_2',
    axis: 'intensity',
    // Question inversée : "Oui" indique un goût pour le calme.
    targetPole: 'calm',
    section: 'intensity',
    phaseTitle: PHASE_TITLES.intensity,
    text:
      "Vous préférez une histoire calme et stable, sans grandes vagues émotionnelles ?",
    options: standardOptions('intensity_2'),
  },
  {
    id: 'intensity_3',
    axis: 'intensity',
    targetPole: 'ardent',
    section: 'intensity',
    phaseTitle: PHASE_TITLES.intensity,
    text:
      "Si l'autre tarde à répondre un soir, ça vous traverse l'esprit plusieurs fois ?",
    options: standardOptions('intensity_3'),
  },

  // ─── Axe Rythme (3 questions) ────────────────────────────────────
  {
    id: 'rhythm_1',
    axis: 'rhythm',
    targetPole: 'fast',
    section: 'rhythm',
    phaseTitle: PHASE_TITLES.rhythm,
    text:
      "Vous savez assez vite, dès les premières heures, si une personne pourrait compter ?",
    options: standardOptions('rhythm_1'),
  },
  {
    id: 'rhythm_2',
    axis: 'rhythm',
    // Question inversée : "Oui" = besoin de temps, donc rythme lent.
    targetPole: 'slow',
    section: 'rhythm',
    phaseTitle: PHASE_TITLES.rhythm,
    text:
      "Vous avez besoin de plusieurs rendez-vous avant de vraiment vous laisser aller ?",
    options: standardOptions('rhythm_2'),
  },
  {
    id: 'rhythm_3',
    axis: 'rhythm',
    targetPole: 'fast',
    section: 'rhythm',
    phaseTitle: PHASE_TITLES.rhythm,
    text:
      "Vous aimez quand les choses se précipitent — un baiser tôt, un voyage improvisé, une décision rapide ?",
    options: standardOptions('rhythm_3'),
  },

  // ─── Axe Ouverture (2 questions) ────────────────────────────────
  {
    id: 'openness_1',
    axis: 'openness',
    targetPole: 'open',
    section: 'openness',
    phaseTitle: PHASE_TITLES.openness,
    text:
      "Vous pourriez tomber amoureux·se d'à peu près n'importe quel profil, si l'alchimie est là ?",
    options: standardOptions('openness_1'),
  },
  {
    id: 'openness_2',
    axis: 'openness',
    // Question inversée : "Oui" = critères précis, donc sélectif.
    targetPole: 'selective',
    section: 'openness',
    phaseTitle: PHASE_TITLES.openness,
    outro:
      "Merci. J'ai maintenant une lecture précise de votre Maison. Je vais analyser tout ça et vous proposer dans quelques instants vos premières compatibilités.",
    text:
      "Vous avez une idée assez précise du type de personne qu'il vous faut, et vous y tenez ?",
    options: standardOptions('openness_2'),
  },
]
