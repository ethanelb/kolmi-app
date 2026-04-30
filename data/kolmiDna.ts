export type DnaCategoryId =
  | 'gainsbourg'
  | 'duras'
  | 'saint_laurent'
  | 'arda'
  | 'simone'
  | 'cocteau'
  | 'varda'
  | 'camus'
  | 'sagan'
  | 'piaf'
  | 'godard'
  | 'chagall'
  | 'baldwin'
  | 'kahlo'
  | 'matisse'
  | 'borges';

export type DnaCategory = {
  id: DnaCategoryId;
  label: string;       // "Maison Gainsbourg" etc.
  title: string;       // short headline
  subtitle: string;    // tagline
  description: string; // 1-2 paragraphs
  traits: string[];    // 3-5 traits
  maison: string;      // = label without "Maison " prefix
};

// NOTE: The source HTML uses a different DNA system (16 trait keywords like
// `stable`, `passionne`, `independant`, `fusionnel`, `rayonnant`, `selectif`,
// `calme`, `connecteur`, `traditionnel`, `familial`, `ambitieux`, `moderne`,
// `direct`, `emotionnel`, `strategique`, `flexible`).
// The 16 cultural "Maisons" below are NOT present in the source HTML and are
// inferred to match each cultural reference. All entries are marked
// `// inferred — not in HTML`.

export const dnaCategories: Record<DnaCategoryId, DnaCategory> = {
  // inferred — not in HTML
  gainsbourg: {
    id: 'gainsbourg',
    label: 'Maison Gainsbourg',
    title: 'L\'Insolent Romantique',
    subtitle: 'Provocation tendre, nuit longue, beauté du désordre.',
    description:
      'Vous aimez l\'ambiguïté élégante : la cigarette à 3h du matin, les phrases qui restent. Votre amour est un poème un peu cabossé, jamais sage, toujours sincère. Vous préférez la vraie nuance à la perfection lisse.',
    traits: ['Provocateur', 'Sensuel', 'Romantique cassé', 'Nocturne', 'Libre'],
    maison: 'Gainsbourg',
  },
  // inferred — not in HTML
  duras: {
    id: 'duras',
    label: 'Maison Duras',
    title: 'L\'Amante Lucide',
    subtitle: 'Désir lent, regard clair, mots rares.',
    description:
      'Vous aimez profondément, mais sans illusion. Vos sentiments sont denses, presque écrits. Vous savez que la passion finit, et c\'est ce qui la rend précieuse. Vous donnez peu, mais ce que vous donnez compte.',
    traits: ['Intense', 'Mélancolique', 'Lucide', 'Silencieuse', 'Profonde'],
    maison: 'Duras',
  },
  // inferred — not in HTML
  saint_laurent: {
    id: 'saint_laurent',
    label: 'Maison Saint Laurent',
    title: 'L\'Élégant Exigeant',
    subtitle: 'Allure, rigueur, silence habité.',
    description:
      'Vous tenez à la forme parce qu\'elle protège le fond. Votre amour passe par les détails : un mot juste, un geste retenu, un parfum qui reste. Vous attendez la même tenue chez l\'autre — la beauté est une discipline.',
    traits: ['Élégant', 'Exigeant', 'Esthète', 'Réservé', 'Construit'],
    maison: 'Saint Laurent',
  },
  // inferred — not in HTML
  arda: {
    id: 'arda',
    label: 'Maison Arda',
    title: 'Le Gardien du Foyer',
    subtitle: 'Famille, racines, repas qui durent.',
    description:
      'Pour vous, l\'amour est un toit. Vous construisez un lieu où l\'autre peut se reposer, et vous avancez avec la patience de ceux qui savent qu\'on bâtit dans la durée. Vos valeurs sont solides, transmises, vivantes.',
    traits: ['Familial', 'Loyal', 'Chaleureux', 'Enraciné', 'Protecteur'],
    maison: 'Arda',
  },
  // inferred — not in HTML
  simone: {
    id: 'simone',
    label: 'Maison Simone',
    title: 'La Compagne Libre',
    subtitle: 'Indépendance, conscience, égalité.',
    description:
      'Vous voulez aimer sans vous perdre. Vous êtes lucide sur le couple, exigeante sur la liberté, et vous cherchez quelqu\'un qui marche à côté de vous, jamais devant. L\'engagement est un choix renouvelé, pas une cage.',
    traits: ['Indépendante', 'Engagée', 'Réflexive', 'Égalitaire', 'Libre'],
    maison: 'Simone',
  },
  // inferred — not in HTML
  cocteau: {
    id: 'cocteau',
    label: 'Maison Cocteau',
    title: 'Le Rêveur Lumineux',
    subtitle: 'Magie quotidienne, art partagé, regard d\'enfant.',
    description:
      'Vous aimez transformer le réel : un trajet de métro devient un poème, un dimanche devient une fête. Votre amour est une création commune, faite de surprises, d\'images, de détails qui réenchantent.',
    traits: ['Créatif', 'Imaginatif', 'Tendre', 'Joueur', 'Inspiré'],
    maison: 'Cocteau',
  },
  // inferred — not in HTML
  varda: {
    id: 'varda',
    label: 'Maison Varda',
    title: 'La Curieuse Bienveillante',
    subtitle: 'Regard tendre, glanage des âmes, douceur du quotidien.',
    description:
      'Vous aimez ce que les autres ne regardent plus : un visage à la fenêtre, un mot oublié, une lumière de fin de journée. Votre amour est attentionné, peu spectaculaire, mais d\'une justesse rare.',
    traits: ['Curieuse', 'Bienveillante', 'Observatrice', 'Douce', 'Authentique'],
    maison: 'Varda',
  },
  // inferred — not in HTML
  camus: {
    id: 'camus',
    label: 'Maison Camus',
    title: 'Le Lucide Solaire',
    subtitle: 'Existence, mer, vérité simple.',
    description:
      'Vous aimez sans grands discours, mais avec une honnêteté qui désarme. Vous savez que rien n\'est garanti, et c\'est pour cela que vous choisissez chaque jour. La lucidité est votre forme de tendresse.',
    traits: ['Lucide', 'Honnête', 'Solaire', 'Existentiel', 'Engagé'],
    maison: 'Camus',
  },
  // inferred — not in HTML
  sagan: {
    id: 'sagan',
    label: 'Maison Sagan',
    title: 'L\'Insouciante Mélancolique',
    subtitle: 'Été, vitesse, cœur qui tangue.',
    description:
      'Vous vivez l\'amour comme une saison qu\'on n\'oubliera pas. Vous aimez vite, fort, parfois mal, mais toujours en sachant que l\'instant vaut mieux que la promesse. Une joie tendue, un peu triste, très vivante.',
    traits: ['Spontanée', 'Mélancolique', 'Élégante', 'Passionnée', 'Insaisissable'],
    maison: 'Sagan',
  },
  // inferred — not in HTML
  piaf: {
    id: 'piaf',
    label: 'Maison Piaf',
    title: 'La Flamme Absolue',
    subtitle: 'Tout donner, tout vivre, ne rien regretter.',
    description:
      'Vous aimez en grand. Pas de demi-mesure : vos sentiments traversent comme des chansons. Vous cherchez quelqu\'un qui sache recevoir cette intensité et la rendre, sans peur, sans calcul.',
    traits: ['Passionnée', 'Entière', 'Vibrante', 'Loyale', 'Dramatique'],
    maison: 'Piaf',
  },
  // inferred — not in HTML
  godard: {
    id: 'godard',
    label: 'Maison Godard',
    title: 'L\'Esprit Anguleux',
    subtitle: 'Idées, rupture, dialogue serré.',
    description:
      'Vous aimez l\'amour qui pense. Les conversations longues, les désaccords féconds, les nuits où l\'on refait le monde. Vous fuyez la mollesse — chez vous, le sentiment passe par l\'intelligence.',
    traits: ['Intellectuel', 'Cinglant', 'Curieux', 'Anticonformiste', 'Direct'],
    maison: 'Godard',
  },
  // inferred — not in HTML
  chagall: {
    id: 'chagall',
    label: 'Maison Chagall',
    title: 'L\'Amoureux Onirique',
    subtitle: 'Tendresse, couleurs, amants qui flottent.',
    description:
      'Vous croyez à l\'amour comme à un miracle quotidien. Vos sentiments ont la couleur de l\'enfance et la légèreté du rêve. Vous portez l\'autre, littéralement, et vous attendez d\'être porté en retour.',
    traits: ['Tendre', 'Onirique', 'Loyal', 'Doux', 'Spirituel'],
    maison: 'Chagall',
  },
  // inferred — not in HTML
  baldwin: {
    id: 'baldwin',
    label: 'Maison Baldwin',
    title: 'Le Cœur Engagé',
    subtitle: 'Vérité, justice, parole qui répare.',
    description:
      'Vous aimez avec conscience. Vos relations sont des espaces où l\'on se dit les choses, où l\'on se bat ensemble, où l\'on grandit. Vous refusez le confort des silences — votre amour est une parole qui sauve.',
    traits: ['Engagé', 'Lucide', 'Sensible', 'Profond', 'Courageux'],
    maison: 'Baldwin',
  },
  // inferred — not in HTML
  kahlo: {
    id: 'kahlo',
    label: 'Maison Kahlo',
    title: 'L\'Âme Vive',
    subtitle: 'Douleur, couleurs, amour insurmontable.',
    description:
      'Vous aimez avec tout — le corps, la mémoire, les blessures. Vous transformez ce que la vie casse en beauté, et vous attendez quelqu\'un d\'aussi entier. Une intensité rare, magnétique, qu\'il faut savoir tenir.',
    traits: ['Intense', 'Authentique', 'Créative', 'Magnétique', 'Résiliente'],
    maison: 'Kahlo',
  },
  // inferred — not in HTML
  matisse: {
    id: 'matisse',
    label: 'Maison Matisse',
    title: 'Le Cœur Lumineux',
    subtitle: 'Couleur, équilibre, joie tranquille.',
    description:
      'Vous aimez comme on peint un dimanche : avec calme, lumière, douceur. Vos sentiments sont harmonieux, votre quotidien soigné, vos liens longs. Vous cherchez la beauté simple, partagée, durable.',
    traits: ['Harmonieux', 'Lumineux', 'Calme', 'Esthète', 'Ancré'],
    maison: 'Matisse',
  },
  // inferred — not in HTML
  borges: {
    id: 'borges',
    label: 'Maison Borges',
    title: 'L\'Esprit Labyrinthe',
    subtitle: 'Livres, énigmes, infini intérieur.',
    description:
      'Votre amour est une bibliothèque secrète. Vous aimez les esprits complexes, les références, les conversations qui durent des nuits. Discret, profond, vous offrez à l\'autre un monde entier — il faut savoir y entrer.',
    traits: ['Cérébral', 'Mystérieux', 'Cultivé', 'Profond', 'Discret'],
    maison: 'Borges',
  },
};

// Display labels — sourced from HTML's `dnaLabels` (the original DNA trait
// system, not the Maisons). Kept as-is for use elsewhere in the app.
export const dnaLabels: Record<string, string> = {
  stable: 'Stable',
  passionne: 'Passionné',
  independant: 'Indépendant',
  fusionnel: 'Fusionnel',
  rayonnant: 'Rayonnant',
  selectif: 'Sélectif',
  calme: 'Calme',
  connecteur: 'Connecteur',
  traditionnel: 'Traditionnel',
  familial: 'Familial',
  ambitieux: 'Ambitieux',
  moderne: 'Moderne',
  direct: 'Direct',
  emotionnel: 'Émotionnel',
  strategique: 'Stratégique',
  flexible: 'Flexible',
};

// Descriptions — sourced from HTML's `dnaDescriptions` (only 4 dominant
// relational sub-types are described in the HTML: stable, passionne,
// independant, fusionnel). Each describes the dominant relational profile.
export const dnaDescriptions: Record<string, string> = {
  stable:
    "Vous recherchez une relation claire, construite et cohérente. Vous avancez avec sérieux et vous avez besoin d'un cadre rassurant.",
  passionne:
    "Vous vivez la relation avec intensité. Vous cherchez une vraie alchimie et des émotions fortes au quotidien.",
  independant:
    "Vous valorisez la liberté autant que la complicité. Vous voulez avancer en couple sans renoncer à votre équilibre personnel.",
  fusionnel:
    "Vous aimez la proximité, la complicité et les liens profonds. Vous cherchez quelqu'un avec qui tout partager.",
};
