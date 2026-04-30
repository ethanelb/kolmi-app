export type QuestionSection =
  | 'warmup'
  | 'emotional_core'
  | 'lucidity'
  | 'depth'
  | 'bonus_dna';

export type KolmiDimension =
  | 'attachment'
  | 'emotionalAvailability'
  | 'communication'
  | 'commitment'
  | 'independence'
  | 'conflict'
  | 'romanticIntensity'
  | 'lifestyle'
  | 'values'
  | 'socialEnergy';

export type QuestionOption = {
  id: string;
  label: string;
  value: string;
  scores?: Partial<Record<KolmiDimension, number>>;
};

export type KolmiQuestion = {
  id: string;
  text: string;
  section: QuestionSection;
  phaseTitle: string;
  preface?: string;
  outro?: string;
  options: QuestionOption[];
  isBonus?: boolean;
};

const PHASE_TITLES = {
  warmup: 'Phase 1 — Échauffement',
  emotional_core: 'Phase 2 — Cœur émotionnel',
  lucidity: 'Phase 3 — Lucidité',
  depth: 'Phase 4 — Profondeur',
  bonus_dna: 'Lecture approfondie',
} as const;

export const kolmiQuestions: KolmiQuestion[] = [
  // ─── PHASE 1 — Échauffement (4 questions) ─────────────────────
  {
    id: 'q1',
    section: 'warmup',
    phaseTitle: PHASE_TITLES.warmup,
    text: 'Bonjour. Je suis votre matchmaker personnel chez KOLMI. Pour commencer, quel type de relation recherchez-vous ?',
    options: [
      {
        id: 'opt-1',
        label: 'Relation sérieuse',
        value: 'opt-1',
        scores: { commitment: 3, values: 1 },
      },
      {
        id: 'opt-2',
        label: 'Mariage à terme',
        value: 'opt-2',
        scores: { commitment: 3, values: 2 },
      },
      {
        id: 'opt-3',
        label: 'Je veux voir ce qui se passe',
        value: 'opt-3',
        scores: { commitment: 1, lifestyle: 2 },
      },
      {
        id: 'opt-4',
        label: 'Relation exclusive, sans précipitation',
        value: 'opt-4',
        scores: { commitment: 2, independence: 2 },
      },
    ],
  },
  {
    id: 'dna_q11',
    section: 'warmup',
    phaseTitle: PHASE_TITLES.warmup,
    text: 'Votre rythme amoureux naturel :',
    options: [
      {
        id: 'opt-1',
        label: 'Je prends mon temps',
        value: 'opt-1',
        scores: { commitment: 1, lifestyle: 2 },
      },
      {
        id: 'opt-2',
        label: 'Je peux aller vite si je suis sûr(e)',
        value: 'opt-2',
        scores: { commitment: 2, romanticIntensity: 2 },
      },
      {
        id: 'opt-3',
        label: 'Je reste indépendant(e) au début',
        value: 'opt-3',
        scores: { independence: 3, attachment: 1 },
      },
      {
        id: 'opt-4',
        label: 'Je m\'attache vite quand je sens quelque chose',
        value: 'opt-4',
        scores: { romanticIntensity: 3, attachment: 2 },
      },
    ],
  },
  {
    id: 'dna_q1',
    section: 'warmup',
    phaseTitle: PHASE_TITLES.warmup,
    text: 'Quand vous rencontrez quelqu\'un qui vous plaît, vous êtes plutôt :',
    options: [
      {
        id: 'opt-1',
        label: 'Direct : j\'aime savoir rapidement où ça va',
        value: 'opt-1',
        scores: { communication: 3, commitment: 1 },
      },
      {
        id: 'opt-2',
        label: 'Naturel : je laisse le feeling avancer',
        value: 'opt-2',
        scores: { lifestyle: 2, emotionalAvailability: 1 },
      },
      {
        id: 'opt-3',
        label: 'Prudent : j\'observe avant de m\'attacher',
        value: 'opt-3',
        scores: { attachment: 2, independence: 1 },
      },
      {
        id: 'opt-4',
        label: 'Intense : si je sens une connexion, je m\'investis vite',
        value: 'opt-4',
        scores: { romanticIntensity: 3, attachment: 1 },
      },
    ],
  },
  {
    id: 'dna_q8',
    section: 'warmup',
    phaseTitle: PHASE_TITLES.warmup,
    text: 'Quand vous imaginez votre futur couple, vous voyez plutôt :',
    options: [
      {
        id: 'opt-1',
        label: 'Une famille stable et construite',
        value: 'opt-1',
        scores: { values: 3, commitment: 2 },
      },
      {
        id: 'opt-2',
        label: 'Une relation passionnée et vivante',
        value: 'opt-2',
        scores: { romanticIntensity: 3, values: 1 },
      },
      {
        id: 'opt-3',
        label: 'Deux personnes ambitieuses qui avancent ensemble',
        value: 'opt-3',
        scores: { values: 2, lifestyle: 2 },
      },
      {
        id: 'opt-4',
        label: 'Une relation simple, saine et équilibrée',
        value: 'opt-4',
        scores: { lifestyle: 3, values: 1 },
      },
    ],
  },

  // ─── PHASE 2 — Cœur émotionnel (5 questions) ──────────────────
  {
    id: 'psy_q1',
    section: 'emotional_core',
    phaseTitle: PHASE_TITLES.emotional_core,
    preface:
      'Merci. J\'ai une première idée de votre style amoureux.\n\nMaintenant, j\'aimerais comprendre comment vous vivez les choses émotionnellement. Cinq questions plus personnelles — répondez spontanément.',
    text: 'Quand vous êtes en couple, vous vous sentez plutôt :',
    options: [
      {
        id: 'opt-1',
        label: 'Serein(e), confiant(e) en l\'autre et en moi',
        value: 'opt-1',
        scores: { attachment: 3, emotionalAvailability: 2 },
      },
      {
        id: 'opt-2',
        label: 'Bien, mais j\'ai parfois besoin d\'être rassuré(e)',
        value: 'opt-2',
        scores: { attachment: 2, emotionalAvailability: 1 },
      },
      {
        id: 'opt-3',
        label: 'Indépendant(e), j\'ai besoin de mon espace',
        value: 'opt-3',
        scores: { independence: 3, attachment: 1 },
      },
      {
        id: 'opt-4',
        label: 'En attente de signes — j\'ai peur que l\'autre s\'éloigne',
        value: 'opt-4',
        scores: { attachment: 1, romanticIntensity: 2 },
      },
    ],
  },
  {
    id: 'psy_q2',
    section: 'emotional_core',
    phaseTitle: PHASE_TITLES.emotional_core,
    text: 'Si l\'autre met du temps à répondre à un message :',
    options: [
      {
        id: 'opt-1',
        label: 'Aucun souci, je sais qu\'il/elle est occupé(e)',
        value: 'opt-1',
        scores: { attachment: 3, independence: 1 },
      },
      {
        id: 'opt-2',
        label: 'Ça me fait douter un peu',
        value: 'opt-2',
        scores: { attachment: 2, emotionalAvailability: 1 },
      },
      {
        id: 'opt-3',
        label: 'Je me pose des questions, j\'imagine le pire',
        value: 'opt-3',
        scores: { attachment: 1, romanticIntensity: 2 },
      },
      {
        id: 'opt-4',
        label: 'Je préfère ne pas être collé(e), donc ça me va',
        value: 'opt-4',
        scores: { independence: 3, attachment: 1 },
      },
    ],
  },
  {
    id: 'psy_q4',
    section: 'emotional_core',
    phaseTitle: PHASE_TITLES.emotional_core,
    text: 'Quand vous êtes amoureux(se), votre intensité émotionnelle est :',
    options: [
      {
        id: 'opt-1',
        label: 'Mesurée, je reste posé(e)',
        value: 'opt-1',
        scores: { romanticIntensity: 1, emotionalAvailability: 2 },
      },
      {
        id: 'opt-2',
        label: 'Plutôt douce, mais profonde',
        value: 'opt-2',
        scores: { emotionalAvailability: 3, romanticIntensity: 1 },
      },
      {
        id: 'opt-3',
        label: 'Vivante, ça se voit',
        value: 'opt-3',
        scores: { romanticIntensity: 2, socialEnergy: 1 },
      },
      {
        id: 'opt-4',
        label: 'Très forte, je vis ça intensément',
        value: 'opt-4',
        scores: { romanticIntensity: 3, emotionalAvailability: 2 },
      },
    ],
  },
  {
    id: 'psy_q5',
    section: 'emotional_core',
    phaseTitle: PHASE_TITLES.emotional_core,
    text: 'Dans une relation, vous avez besoin de :',
    options: [
      {
        id: 'opt-1',
        label: 'Beaucoup de moments ensemble — j\'aime la fusion',
        value: 'opt-1',
        scores: { attachment: 3, independence: 1 },
      },
      {
        id: 'opt-2',
        label: 'Une vraie complicité, mais avec des respirations',
        value: 'opt-2',
        scores: { attachment: 2, independence: 2 },
      },
      {
        id: 'opt-3',
        label: 'Garder mon espace personnel important',
        value: 'opt-3',
        scores: { independence: 3, attachment: 1 },
      },
      {
        id: 'opt-4',
        label: 'Une grande indépendance, on se retrouve quand on a envie',
        value: 'opt-4',
        scores: { independence: 3, lifestyle: 1 },
      },
    ],
  },
  {
    id: 'psy_q6',
    section: 'emotional_core',
    phaseTitle: PHASE_TITLES.emotional_core,
    text: 'En soirée ou en groupe, vous êtes plutôt :',
    options: [
      {
        id: 'opt-1',
        label: 'Au centre, j\'aime l\'énergie des gens',
        value: 'opt-1',
        scores: { socialEnergy: 3, romanticIntensity: 1 },
      },
      {
        id: 'opt-2',
        label: 'Sociable, mais j\'apprécie aussi de me poser',
        value: 'opt-2',
        scores: { socialEnergy: 2, lifestyle: 1 },
      },
      {
        id: 'opt-3',
        label: 'Présent(e) mais discret/discrète',
        value: 'opt-3',
        scores: { socialEnergy: 1, independence: 1 },
      },
      {
        id: 'opt-4',
        label: 'Je préfère les petits comités intimes',
        value: 'opt-4',
        scores: { socialEnergy: 1, emotionalAvailability: 2 },
      },
    ],
  },

  // ─── PHASE 3 — Lucidité (4 questions) ─────────────────────────
  {
    id: 'q7',
    section: 'lucidity',
    phaseTitle: PHASE_TITLES.lucidity,
    preface:
      'J\'ai une bonne lecture de votre profil émotionnel.\n\nPour bien vous matcher, j\'ai besoin de comprendre ce qui n\'a pas marché jusqu\'ici.',
    text: 'Qu\'est-ce qui n\'a pas fonctionné dans vos relations passées ?',
    options: [
      {
        id: 'opt-1',
        label: 'Manque de communication',
        value: 'opt-1',
        scores: { communication: 3, conflict: 1 },
      },
      {
        id: 'opt-2',
        label: 'Projets de vie différents',
        value: 'opt-2',
        scores: { values: 3, commitment: 1 },
      },
      {
        id: 'opt-3',
        label: 'Rythmes incompatibles',
        value: 'opt-3',
        scores: { lifestyle: 3, values: 1 },
      },
      {
        id: 'opt-4',
        label: 'Manque d\'investissement',
        value: 'opt-4',
        scores: { commitment: 3, emotionalAvailability: 2 },
      },
    ],
  },
  {
    id: 'dna_q12',
    section: 'lucidity',
    phaseTitle: PHASE_TITLES.lucidity,
    text: 'Votre plus gros red flag chez quelqu\'un :',
    options: [
      {
        id: 'opt-1',
        label: 'Le manque d\'écoute',
        value: 'opt-1',
        scores: { communication: 2, emotionalAvailability: 2 },
      },
      {
        id: 'opt-2',
        label: 'Le manque d\'ambition',
        value: 'opt-2',
        scores: { values: 3, lifestyle: 1 },
      },
      {
        id: 'opt-3',
        label: 'Un comportement fermé ou méprisant',
        value: 'opt-3',
        scores: { communication: 2, conflict: 2 },
      },
      {
        id: 'opt-4',
        label: 'L\'inconstance ou les jeux',
        value: 'opt-4',
        scores: { commitment: 3, attachment: 1 },
      },
    ],
  },
  {
    id: 'dna_q10',
    section: 'lucidity',
    phaseTitle: PHASE_TITLES.lucidity,
    text: 'Vous préférez quelqu\'un qui communique :',
    options: [
      {
        id: 'opt-1',
        label: 'De manière directe',
        value: 'opt-1',
        scores: { communication: 3, conflict: 1 },
      },
      {
        id: 'opt-2',
        label: 'Avec douceur',
        value: 'opt-2',
        scores: { communication: 2, emotionalAvailability: 2 },
      },
      {
        id: 'opt-3',
        label: 'Avec humour',
        value: 'opt-3',
        scores: { socialEnergy: 2, communication: 1 },
      },
      {
        id: 'opt-4',
        label: 'Avec profondeur',
        value: 'opt-4',
        scores: { emotionalAvailability: 3, communication: 1 },
      },
    ],
  },
  {
    id: 'psy_q7',
    section: 'lucidity',
    phaseTitle: PHASE_TITLES.lucidity,
    text: 'Quand un conflit éclate avec votre partenaire, vous :',
    options: [
      {
        id: 'opt-1',
        label: 'En parlez tout de suite, frontalement',
        value: 'opt-1',
        scores: { conflict: 3, communication: 2 },
      },
      {
        id: 'opt-2',
        label: 'Cherchez à apaiser avant tout',
        value: 'opt-2',
        scores: { conflict: 1, emotionalAvailability: 2 },
      },
      {
        id: 'opt-3',
        label: 'Prenez du recul, puis revenez en parler calmement',
        value: 'opt-3',
        scores: { conflict: 2, communication: 2 },
      },
      {
        id: 'opt-4',
        label: 'Évitez le sujet si vous le pouvez',
        value: 'opt-4',
        scores: { conflict: 1, independence: 1 },
      },
    ],
  },

  // ─── PHASE 4 — Profondeur (3 questions) ───────────────────────
  {
    id: 'q4',
    section: 'depth',
    phaseTitle: PHASE_TITLES.depth,
    preface:
      'Vous m\'avez confié beaucoup, merci pour votre franchise.\n\nPour finir, trois questions sur ce qui est non-négociable pour vous. Ces réponses orientent fortement vos compatibilités.',
    text: 'Quelle est votre position sur la vie de famille à long terme ?',
    options: [
      {
        id: 'opt-1',
        label: 'Je veux des enfants',
        value: 'opt-1',
        scores: { values: 3, commitment: 2 },
      },
      {
        id: 'opt-2',
        label: 'Ouvert(e) à l\'idée',
        value: 'opt-2',
        scores: { values: 1, commitment: 1 },
      },
      {
        id: 'opt-3',
        label: 'Je n\'en veux pas',
        value: 'opt-3',
        scores: { independence: 2, lifestyle: 2 },
      },
      {
        id: 'opt-4',
        label: 'J\'en ai déjà',
        value: 'opt-4',
        scores: { values: 2, lifestyle: 1 },
      },
    ],
  },
  {
    id: 'q5',
    section: 'depth',
    phaseTitle: PHASE_TITLES.depth,
    text: 'Y a-t-il des valeurs culturelles ou spirituelles importantes pour vous dans une relation ?',
    options: [
      {
        id: 'opt-1',
        label: 'Oui, essentielles',
        value: 'opt-1',
        scores: { values: 3, commitment: 1 },
      },
      {
        id: 'opt-2',
        label: 'Importantes mais ouvert(e)',
        value: 'opt-2',
        scores: { values: 2, lifestyle: 1 },
      },
      {
        id: 'opt-3',
        label: 'Peu importantes',
        value: 'opt-3',
        scores: { lifestyle: 2, independence: 1 },
      },
      {
        id: 'opt-4',
        label: 'Préfère ne pas répondre',
        value: 'opt-4',
        scores: { independence: 1 },
      },
    ],
  },
  {
    id: 'dna_q2',
    section: 'depth',
    phaseTitle: PHASE_TITLES.depth,
    outro:
      'Merci infiniment pour vos réponses. J\'ai maintenant une lecture précise de votre Maison. Je vais analyser tout ça et vous proposer dans quelques instants vos premières compatibilités.',
    text: 'Pour terminer — en couple, vous avez surtout besoin de :',
    options: [
      {
        id: 'opt-1',
        label: 'Sécurité et stabilité',
        value: 'opt-1',
        scores: { commitment: 2, values: 2 },
      },
      {
        id: 'opt-2',
        label: 'Passion et émotions fortes',
        value: 'opt-2',
        scores: { romanticIntensity: 3, emotionalAvailability: 1 },
      },
      {
        id: 'opt-3',
        label: 'Liberté et confiance',
        value: 'opt-3',
        scores: { independence: 3, lifestyle: 1 },
      },
      {
        id: 'opt-4',
        label: 'Complicité et douceur',
        value: 'opt-4',
        scores: { attachment: 2, emotionalAvailability: 2 },
      },
    ],
  },
];

/**
 * Bonus DNA — 8 additional questions, NOT exposed in v1.
 * The spec calls these "débloquables plus tard" — meant to be unlocked
 * post-/home (e.g. behind a premium tier or after first match) to refine
 * compatibility further. They are imported by `calculateDna` so any
 * answers stored against these IDs are still folded into the score, but
 * `MatchmakerChat` only iterates `kolmiQuestions` (the 16 main ones).
 */
export const bonusDnaQuestions: KolmiQuestion[] = [
  {
    id: 'dna_q13',
    section: 'bonus_dna',
    phaseTitle: PHASE_TITLES.bonus_dna,
    isBonus: true,
    text: 'Ce que vous admirez le plus chez quelqu\'un :',
    options: [
      {
        id: 'opt-1',
        label: 'La loyauté',
        value: 'opt-1',
        scores: { values: 3, commitment: 2 },
      },
      {
        id: 'opt-2',
        label: 'L\'intelligence',
        value: 'opt-2',
        scores: { values: 2, communication: 1 },
      },
      {
        id: 'opt-3',
        label: 'L\'énergie',
        value: 'opt-3',
        scores: { socialEnergy: 3, romanticIntensity: 1 },
      },
      {
        id: 'opt-4',
        label: 'La sensibilité',
        value: 'opt-4',
        scores: { emotionalAvailability: 3, romanticIntensity: 1 },
      },
    ],
  },
  {
    id: 'dna_q14',
    section: 'bonus_dna',
    phaseTitle: PHASE_TITLES.bonus_dna,
    isBonus: true,
    text: 'Pour vous, un bon premier date doit surtout permettre de :',
    options: [
      {
        id: 'opt-1',
        label: 'Savoir si on partage les mêmes valeurs',
        value: 'opt-1',
        scores: { values: 3, commitment: 1 },
      },
      {
        id: 'opt-2',
        label: 'Voir s\'il y a une vraie alchimie',
        value: 'opt-2',
        scores: { romanticIntensity: 3, emotionalAvailability: 1 },
      },
      {
        id: 'opt-3',
        label: 'Comprendre les ambitions de l\'autre',
        value: 'opt-3',
        scores: { values: 2, lifestyle: 2 },
      },
      {
        id: 'opt-4',
        label: 'Se sentir à l\'aise sans pression',
        value: 'opt-4',
        scores: { lifestyle: 2, emotionalAvailability: 1 },
      },
    ],
  },
  {
    id: 'dna_q15',
    section: 'bonus_dna',
    phaseTitle: PHASE_TITLES.bonus_dna,
    isBonus: true,
    text: 'Quand vous prenez une décision importante, vous vous basez surtout sur :',
    options: [
      {
        id: 'opt-1',
        label: 'Ce qui est logique et cohérent',
        value: 'opt-1',
        scores: { values: 2, communication: 1 },
      },
      {
        id: 'opt-2',
        label: 'Ce que je ressens',
        value: 'opt-2',
        scores: { emotionalAvailability: 3, romanticIntensity: 1 },
      },
      {
        id: 'opt-3',
        label: 'Les conséquences à long terme',
        value: 'opt-3',
        scores: { commitment: 2, values: 2 },
      },
      {
        id: 'opt-4',
        label: 'Le conseil des gens proches',
        value: 'opt-4',
        scores: { values: 2, attachment: 2 },
      },
    ],
  },
  {
    id: 'dna_q16',
    section: 'bonus_dna',
    phaseTitle: PHASE_TITLES.bonus_dna,
    isBonus: true,
    text: 'Dans votre quotidien, vous êtes plutôt :',
    options: [
      {
        id: 'opt-1',
        label: 'Organisé(e) et structuré(e)',
        value: 'opt-1',
        scores: { lifestyle: 2, values: 1 },
      },
      {
        id: 'opt-2',
        label: 'Flexible et spontané(e)',
        value: 'opt-2',
        scores: { lifestyle: 3, independence: 1 },
      },
      {
        id: 'opt-3',
        label: 'Très actif/active, toujours en mouvement',
        value: 'opt-3',
        scores: { lifestyle: 2, socialEnergy: 2 },
      },
      {
        id: 'opt-4',
        label: 'Calme, posé(e), régulier/régulière',
        value: 'opt-4',
        scores: { lifestyle: 2, emotionalAvailability: 1 },
      },
    ],
  },
  {
    id: 'dna_q17',
    section: 'bonus_dna',
    phaseTitle: PHASE_TITLES.bonus_dna,
    isBonus: true,
    text: 'Ce qui vous donne envie de revoir quelqu\'un :',
    options: [
      {
        id: 'opt-1',
        label: 'J\'ai senti une vraie stabilité',
        value: 'opt-1',
        scores: { commitment: 2, values: 2 },
      },
      {
        id: 'opt-2',
        label: 'J\'ai ressenti une forte connexion',
        value: 'opt-2',
        scores: { romanticIntensity: 3, attachment: 1 },
      },
      {
        id: 'opt-3',
        label: 'La discussion était stimulante',
        value: 'opt-3',
        scores: { communication: 2, values: 1 },
      },
      {
        id: 'opt-4',
        label: 'Je me suis senti(e) naturellement bien',
        value: 'opt-4',
        scores: { lifestyle: 2, emotionalAvailability: 2 },
      },
    ],
  },
  {
    id: 'dna_q18',
    section: 'bonus_dna',
    phaseTitle: PHASE_TITLES.bonus_dna,
    isBonus: true,
    text: 'Votre plus gros red flag :',
    options: [
      {
        id: 'opt-1',
        label: 'Quelqu\'un d\'instable',
        value: 'opt-1',
        scores: { commitment: 2, attachment: 1 },
      },
      {
        id: 'opt-2',
        label: 'Quelqu\'un de froid',
        value: 'opt-2',
        scores: { emotionalAvailability: 3, romanticIntensity: 1 },
      },
      {
        id: 'opt-3',
        label: 'Quelqu\'un sans ambition',
        value: 'opt-3',
        scores: { values: 3, lifestyle: 1 },
      },
      {
        id: 'opt-4',
        label: 'Quelqu\'un de trop contrôlant',
        value: 'opt-4',
        scores: { independence: 3, conflict: 1 },
      },
    ],
  },
  {
    id: 'dna_q19',
    section: 'bonus_dna',
    phaseTitle: PHASE_TITLES.bonus_dna,
    isBonus: true,
    text: 'Dans une relation, vous voulez surtout construire :',
    options: [
      {
        id: 'opt-1',
        label: 'Un foyer',
        value: 'opt-1',
        scores: { values: 3, commitment: 2 },
      },
      {
        id: 'opt-2',
        label: 'Une aventure à deux',
        value: 'opt-2',
        scores: { romanticIntensity: 3, lifestyle: 1 },
      },
      {
        id: 'opt-3',
        label: 'Une réussite commune',
        value: 'opt-3',
        scores: { values: 2, lifestyle: 2 },
      },
      {
        id: 'opt-4',
        label: 'Un équilibre de vie sain',
        value: 'opt-4',
        scores: { lifestyle: 3, emotionalAvailability: 1 },
      },
    ],
  },
  {
    id: 'dna_q20',
    section: 'bonus_dna',
    phaseTitle: PHASE_TITLES.bonus_dna,
    isBonus: true,
    outro:
      'Merci. Vos compatibilités sont maintenant encore plus précises.',
    text: 'Si KOLMI devait choisir pour vous le bon profil, il devrait prioriser :',
    options: [
      {
        id: 'opt-1',
        label: 'Les valeurs communes',
        value: 'opt-1',
        scores: { values: 3, commitment: 1 },
      },
      {
        id: 'opt-2',
        label: 'La compatibilité émotionnelle',
        value: 'opt-2',
        scores: { emotionalAvailability: 3, attachment: 1 },
      },
      {
        id: 'opt-3',
        label: 'Le niveau d\'ambition',
        value: 'opt-3',
        scores: { values: 2, lifestyle: 2 },
      },
      {
        id: 'opt-4',
        label: 'Le style de vie / rythme quotidien',
        value: 'opt-4',
        scores: { lifestyle: 3, independence: 1 },
      },
    ],
  },
];
