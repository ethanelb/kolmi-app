// 8 Maisons Kolmi, dérivées des 3 axes binaires (Intensité × Rythme × Ouverture).
// Noms inspirés de références culturelles ou de pigments — safe niveau droit
// d'auteur (mots étrangers, mouvements artistiques, couleurs anciennes).

export type DnaCategoryId =
  | 'cinabre'
  | 'carmen'
  | 'saudade'
  | 'terracotta'
  | 'montparnasse'
  | 'bauhaus'
  | 'bloomsbury'
  | 'indigo'

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
}

export const dnaCategories: Record<DnaCategoryId, DnaCategory> = {
  cinabre: {
    id: 'cinabre',
    label: 'Maison Cinabre',
    maison: 'Cinabre',
    title: "L'éclat ouvert",
    subtitle: 'Aimer vite, fort, et le montrer.',
    description:
      "Le rouge vif chinois, la fête, l'éclat. Vous tombez vite, vous le dites, et vous laissez les gens entrer. Vous aimez en couleur, en lumière, et l'idée même d'amour vous met en mouvement. Beaucoup de visages possibles, peu de tiédeur.",
    traits: ['Solaire', 'Spontané', 'Démonstratif', 'Curieux', 'Vivant'],
    axes: { intensity: 'ardent', rhythm: 'fast', openness: 'open' },
  },
  carmen: {
    id: 'carmen',
    label: 'Maison Carmen',
    maison: 'Carmen',
    title: 'La passion ciblée',
    subtitle: "Le coup de foudre qui dévore, l'exclusivité dès le départ.",
    description:
      "L'opéra de Bizet. Vous savez tout de suite, et quand vous savez, c'est entier. Pas de demi-mesures, pas de plan B — un seul visage qui prend toute la place. Vous attendez la même flamme en face, et rien d'autre ne vous suffit.",
    traits: ['Passionné', 'Exclusif', 'Magnétique', 'Entier', 'Dramatique'],
    axes: { intensity: 'ardent', rhythm: 'fast', openness: 'selective' },
  },
  saudade: {
    id: 'saudade',
    label: 'Maison Saudade',
    maison: 'Saudade',
    title: 'Le désir patient',
    subtitle: 'Mélancolie douce, sensibilité partagée, attente fertile.',
    description:
      "Le mot portugais qu'on ne traduit pas. Vous aimez profond mais lentement — l'idée de l'autre vous habite avant le geste. Vous restez ouvert à beaucoup, parce que la rencontre est un chemin, pas un coup de filet. Tendresse, durée, regard tourné vers ce qui pourrait être.",
    traits: ['Sensible', 'Mélancolique', 'Profond', 'Tendre', 'Romanesque'],
    axes: { intensity: 'ardent', rhythm: 'slow', openness: 'open' },
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
  },
  montparnasse: {
    id: 'montparnasse',
    label: 'Maison Montparnasse',
    maison: 'Montparnasse',
    title: 'Le café littéraire',
    subtitle: 'Léger, vif, social, fluide.',
    description:
      "Le quartier des années folles, les terrasses, les rencontres faciles. Vous aimez sans drama, vite et bien : un mot juste, un rire partagé, on voit ce que ça donne. La vie amoureuse est une conversation continue, pas un grand œuvre. Beaucoup d'ouverture, peu de gravité.",
    traits: ['Léger', 'Sociable', 'Vif', 'Curieux', 'Fluide'],
    axes: { intensity: 'calm', rhythm: 'fast', openness: 'open' },
  },
  bauhaus: {
    id: 'bauhaus',
    label: 'Maison Bauhaus',
    maison: 'Bauhaus',
    title: 'Les lignes nettes',
    subtitle: "Savoir ce qu'on veut, le dire, avancer.",
    description:
      "Pas de chichi, pas de mystère. Vous savez ce que vous cherchez, vous le formulez, et vous avancez sans détour. Calme à l'intérieur, rapide en décision, sélectif en cible. L'amour est un projet — pas une rêverie — et vous voulez bâtir avec quelqu'un qui parle la même langue.",
    traits: ['Direct', 'Pragmatique', 'Décidé', 'Clair', 'Efficace'],
    axes: { intensity: 'calm', rhythm: 'fast', openness: 'selective' },
  },
  bloomsbury: {
    id: 'bloomsbury',
    label: 'Maison Bloomsbury',
    maison: 'Bloomsbury',
    title: "Le cercle d'esprits",
    subtitle: 'Amitié amoureuse, lien intellectuel, longues conversations.',
    description:
      "Le cercle de Virginia Woolf. Pour vous, l'amour passe par l'esprit — les livres, les idées, les nuits à refaire le monde. Vous prenez votre temps, vous restez ouvert à des profils variés, et vous vous laissez surprendre. Tendresse calme, lien lent, complicité qui dure.",
    traits: ['Cérébral', 'Curieux', 'Doux', 'Discret', 'Patient'],
    axes: { intensity: 'calm', rhythm: 'slow', openness: 'open' },
  },
  indigo: {
    id: 'indigo',
    label: 'Maison Indigo',
    maison: 'Indigo',
    title: 'Le bleu profond',
    subtitle: 'Complicité silencieuse, peu mais beaucoup, refuge.',
    description:
      "Le bleu nuit, juste avant le noir. Vous aimez peu de gens et vous les aimez longtemps. Le calme à deux, le silence partagé, le geste sûr. Vous prenez votre temps, vous choisissez avec soin, et l'amour devient un refuge où l'on respire enfin.",
    traits: ['Calme', 'Profond', 'Loyal', 'Discret', 'Refuge'],
    axes: { intensity: 'calm', rhythm: 'slow', openness: 'selective' },
  },
}
