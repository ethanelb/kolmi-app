// 8 Maisons Kolmi, dérivées des 3 axes binaires (Intensité × Rythme × Ouverture).

export type DnaCategoryId =
  | 'gigi'
  | 'amare'
  | 'solea'
  | 'terracotta'
  | 'fiora'
  | 'lumi'
  | 'calia'
  | 'vesna'

export type AxisProfile = {
  intensity: 'ardent' | 'calm'
  rhythm: 'fast' | 'slow'
  openness: 'open' | 'selective'
}

export type DnaCategory = {
  id: DnaCategoryId
  label: string // "Maison X"
  maison: string // juste "X" — utilisé par DnaReveal pour le grand titre
  title: string // une ligne courte, en bas de la Maison
  subtitle: string // tagline italique
  description: string // 1-2 paragraphes
  traits: string[] // 3 à 5 mots-clés
  axes: AxisProfile
  // 2 Maisons "amies" — proximité éditoriale, pas un score brut sur les
  // axes. Chaque paire est curée à la main pour suggérer des affinités
  // émotionnelles (chaleur partagée, complémentarité de rythme).
  compatible: DnaCategoryId[]
}

export const dnaCategories: Record<DnaCategoryId, DnaCategory> = {
  gigi: {
    id: 'gigi',
    label: 'Maison GIGI',
    maison: 'GIGI',
    title: "L'éclat ouvert",
    subtitle: 'Aimer vite, fort, et le montrer.',
    description:
      "La jeunesse en mouvement, les rires qui éclatent au coin d'une rue. Vous tombez vite, vous le dites, vous laissez les gens entrer. L'amour vous met en mouvement et ne supporte pas la tiédeur — beaucoup de visages possibles, jamais l'attente froide.",
    traits: ['Solaire', 'Spontané', 'Démonstratif', 'Curieux', 'Vivant'],
    axes: { intensity: 'ardent', rhythm: 'fast', openness: 'open' },
    compatible: ['solea', 'fiora'],
  },
  amare: {
    id: 'amare',
    label: 'Maison Amàre',
    maison: 'Amàre',
    title: 'La passion ciblée',
    subtitle: "Le coup de foudre qui dévore, l'exclusivité dès le départ.",
    description:
      "Vous savez tout de suite, et quand vous savez, c'est entier. Pas de demi-mesures, pas de plan B — un seul visage qui prend toute la place. Vous attendez la même flamme en face, et rien d'autre ne vous suffit.",
    traits: ['Passionné', 'Exclusif', 'Magnétique', 'Entier', 'Dramatique'],
    axes: { intensity: 'ardent', rhythm: 'fast', openness: 'selective' },
    compatible: ['terracotta', 'gigi'],
  },
  solea: {
    id: 'solea',
    label: 'Maison Soléa',
    maison: 'Soléa',
    title: 'La chaleur lente',
    subtitle: 'Tendresse longue, accueil large, désir qui mûrit.',
    description:
      "La chaleur d'une cuisine en hiver, les bras qui s'ouvrent grands. Vous aimez profond mais lentement — l'idée de l'autre vous habite avant le geste. Vous restez ouvert à beaucoup, parce que la rencontre est un chemin, pas un coup de filet.",
    traits: ['Sensible', 'Généreux', 'Profond', 'Tendre', 'Romanesque'],
    axes: { intensity: 'ardent', rhythm: 'slow', openness: 'open' },
    compatible: ['calia', 'gigi'],
  },
  terracotta: {
    id: 'terracotta',
    label: 'Maison Terracotta',
    maison: 'Terracotta',
    title: "L'intimité brûlée",
    subtitle: 'Argile chaude, deux corps, une chambre.',
    description:
      "Vous aimez en intérieur, en silence, en chair. Le feu existe, mais il prend le temps de monter. Quand vous choisissez quelqu'un, ce n'est pas léger : vous attendez, vous regardez, et puis vous vous donnez en entier. Peu de gens, beaucoup de profondeur.",
    traits: ['Intense', 'Discret', 'Charnel', 'Loyal', 'Profond'],
    axes: { intensity: 'ardent', rhythm: 'slow', openness: 'selective' },
    compatible: ['amare', 'vesna'],
  },
  fiora: {
    id: 'fiora',
    label: 'Maison Fiora',
    maison: 'Fiora',
    title: 'La clarté légère',
    subtitle: 'Léger, vif, social, fluide.',
    description:
      "Vous aimez sans drama, vite et bien : un mot juste, un rire partagé, on voit ce que ça donne. La vie amoureuse est une conversation continue, pas un grand œuvre — beaucoup d'ouverture, peu de gravité.",
    traits: ['Léger', 'Sociable', 'Vif', 'Curieux', 'Fluide'],
    axes: { intensity: 'calm', rhythm: 'fast', openness: 'open' },
    compatible: ['calia', 'gigi'],
  },
  lumi: {
    id: 'lumi',
    label: 'Maison Lùmi',
    maison: 'Lùmi',
    title: 'Les lignes nettes',
    subtitle: "Savoir ce qu'on veut, le dire, avancer.",
    description:
      "Pas de chichi, pas de mystère. Vous savez ce que vous cherchez, vous le formulez, et vous avancez sans détour. Calme à l'intérieur, rapide en décision, sélectif en cible — l'amour est un projet clair, pas une rêverie.",
    traits: ['Direct', 'Pragmatique', 'Décidé', 'Clair', 'Efficace'],
    axes: { intensity: 'calm', rhythm: 'fast', openness: 'selective' },
    compatible: ['vesna', 'amare'],
  },
  calia: {
    id: 'calia',
    label: 'Maison Càlia',
    maison: 'Càlia',
    title: 'La douceur tissée',
    subtitle: 'Amitié amoureuse, lien lent, longues conversations.',
    description:
      "Pour vous, l'amour passe par la durée — les livres, les idées, les nuits à refaire le monde. Vous prenez votre temps, vous restez ouvert à des profils variés, et vous vous laissez surprendre. Tendresse calme, complicité qui dure.",
    traits: ['Cérébral', 'Curieux', 'Doux', 'Discret', 'Patient'],
    axes: { intensity: 'calm', rhythm: 'slow', openness: 'open' },
    compatible: ['solea', 'fiora'],
  },
  vesna: {
    id: 'vesna',
    label: 'Maison Vesna',
    maison: 'Vesna',
    title: "L'or rare",
    subtitle: 'Complicité silencieuse, peu mais beaucoup, refuge.',
    description:
      "Vous aimez peu de gens et vous les aimez longtemps. Le calme à deux, le silence partagé, le geste sûr — vous choisissez avec soin, et l'amour devient un refuge où l'on respire enfin.",
    traits: ['Calme', 'Profond', 'Loyal', 'Discret', 'Refuge'],
    axes: { intensity: 'calm', rhythm: 'slow', openness: 'selective' },
    compatible: ['terracotta', 'lumi'],
  },
}
