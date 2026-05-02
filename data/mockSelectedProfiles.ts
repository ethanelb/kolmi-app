import type { DnaCategoryId } from './kolmiDna'

// Champs hérités (compatibility, reason, intentions...) gardés pour ne
// pas casser l'écran détail tant que l'enrichissement data n'est pas
// fini. Les champs nouveaux (occupation, teaser, photoUrls, maisonId,
// bio, prompts) sont optionnels et viennent recouvrir les anciens dès
// qu'ils sont fournis.
export type SelectedProfile = {
  id: string
  firstName: string
  age: number
  city: string
  dnaLabel: string
  // Id de la Maison cible (link vers data/kolmiDna.ts).
  maisonId?: DnaCategoryId
  // Profession affichée sous le prénom (« Architecte · Lyon »).
  occupation?: string
  // Phrase éditoriale courte du matchmaker (≤ 110 caractères).
  // Tant que vide, on retombe sur `reason` pour ne pas casser l'écran.
  teaser?: string
  /** @deprecated Match score numérique — banni par le brief. */
  compatibility: number
  reason: string
  photoUrl?: string
  // Galerie pour l'écran détail (3-6 photos). photoUrl reste utilisé
  // comme fallback principal de la carte.
  photoUrls?: string[]
  bio?: string
  prompts?: { question: string; answer: string }[]
  intentions: string
  interests: string[]
  compatibilityPoints: string[]
  cautionPoints: string[]
  availabilityHint: string
  isFeatured?: boolean
}

// Note : photos Unsplash volontairement uniques. Si tu en ajoutes,
// vérifie la non-duplication avant de commit (un homme et une femme
// avec la même photo a déjà fuité une fois — Léo/Anna).
export const mockSelectedProfiles: SelectedProfile[] = [
  {
    id: 'sarah-24-paris',
    firstName: 'Sarah',
    age: 24,
    city: 'Paris',
    dnaLabel: 'Maison Indigo',
    maisonId: 'indigo',
    occupation: 'Designer UX',
    teaser: 'Calme à l\'intérieur, discrète à l\'extérieur. Choisit peu, garde longtemps.',
    compatibility: 91,
    reason:
      'Même rythme émotionnel, communication directe, forte compatibilité de valeurs.',
    photoUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
    photoUrls: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900',
      'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=900',
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900',
    ],
    bio: 'Travaille dans une agence de Belleville. Court le matin, lit le soir. Cherche quelqu\'un qui parle peu mais qui dit ce qu\'il pense.',
    prompts: [
      { question: 'Une chose qui me tient en place', answer: 'Mes carnets — j\'en ai un par année.' },
      { question: 'Le luxe pour moi', answer: 'Un dimanche sans rien à faire.' },
      { question: 'Je ne supporte pas', answer: 'Les gens qui parlent fort dans le métro.' },
    ],
    intentions: 'Relation sérieuse, sans précipitation.',
    interests: ['Cinéma d\'auteur', 'Voyages slow', 'Cuisine', 'Lecture'],
    compatibilityPoints: [
      'Lucidité émotionnelle proche',
      'Goût pour les conversations longues',
      'Vision construite du couple',
    ],
    cautionPoints: [
      'Tempo intérieur lent — laisser le temps au temps',
      'Sensibilité aux mots non choisis',
    ],
    availabilityHint: 'Plutôt soirs en semaine',
  },
  {
    id: 'noa-23-paris',
    firstName: 'Noa',
    age: 23,
    city: 'Paris',
    dnaLabel: 'Maison Bauhaus',
    maisonId: 'bauhaus',
    occupation: 'Architecte junior',
    teaser: 'Sait ce qu\'il veut, le dit, avance. Pas de mystère, pas de chichi.',
    compatibility: 87,
    reason:
      'Profil stable, esthétique relationnelle proche, vision sérieuse de la rencontre.',
    photoUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
    photoUrls: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=900',
    ],
    bio: 'Bosse pour un cabinet du Marais. Aime les lignes nettes, les cafés du matin, le silence en début de journée.',
    prompts: [
      { question: 'Mon credo', answer: 'Less is more — mais pas en amour.' },
      { question: 'Premier rendez-vous idéal', answer: 'Un café, pas un dîner. Voir si la conversation tient.' },
    ],
    intentions: 'Construire à deux, sans pression de timing.',
    interests: ['Mode', 'Architecture', 'Théâtre', 'Cyclisme urbain'],
    compatibilityPoints: [
      'Discipline esthétique commune',
      'Engagement réfléchi',
      'Calme partagé',
    ],
    cautionPoints: [
      'Réservé en début de relation',
      'Attend de la précision sur les promesses',
    ],
    availabilityHint: 'Mercredi et week-end',
  },
  {
    id: 'anna-25-paris',
    firstName: 'Anna',
    age: 25,
    city: 'Paris',
    dnaLabel: 'Maison Carmen',
    maisonId: 'carmen',
    occupation: 'Photographe',
    teaser: 'L\'opéra de Bizet. Sait tout de suite — et quand elle sait, c\'est entier.',
    compatibility: 84,
    reason:
      'Connexion probable sur l\'intensité, la curiosité et le goût du non-conventionnel.',
    photoUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600',
    photoUrls: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900',
      'https://images.unsplash.com/photo-1521146764736-56c929d59c83?w=900',
    ],
    bio: 'Argentique uniquement. Travaille la nuit, dort le matin. Cherche quelqu\'un capable de tenir la pose — au sens propre.',
    prompts: [
      { question: 'Une obsession récente', answer: 'Le grain Tri-X 400 poussé à 1600.' },
      { question: 'Je ne fais jamais', answer: 'Les choses à moitié.' },
    ],
    intentions: 'Voir où ça mène, sans se priver d\'intensité.',
    interests: ['Musique', 'Nuits parisiennes', 'Photo argentique', 'Vinyle'],
    compatibilityPoints: [
      'Goût partagé pour la nuance',
      'Curiosité intellectuelle',
      'Indépendance équilibrée',
    ],
    cautionPoints: [
      'Sensible aux conventions trop rigides',
      'Aime le doux désordre',
    ],
    availabilityHint: 'Plutôt jeudi-vendredi en soirée',
  },
  {
    id: 'lou-26-lyon',
    firstName: 'Lou',
    age: 26,
    city: 'Lyon',
    dnaLabel: 'Maison Bloomsbury',
    maisonId: 'bloomsbury',
    occupation: 'Documentariste',
    teaser: 'Lectrice patiente. Travaille la pierre. Écoute mieux qu\'elle ne parle.',
    compatibility: 89,
    reason:
      'Regard tendre, attention aux détails, lecture juste des situations.',
    photoUrl:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600',
    photoUrls: [
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=900',
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=900',
    ],
    bio: 'Long-format. Une seule envie : raconter ce que personne ne regarde. Vit entre la Croix-Rousse et un Airbnb à Marseille.',
    prompts: [
      { question: 'Je crois encore en', answer: 'Les longues conversations qui tournent autour de rien.' },
      { question: 'Le pire défaut', answer: 'Je commence trop de livres en même temps.' },
    ],
    intentions: 'Une vraie rencontre, sans étiquette préfaite.',
    interests: ['Documentaires', 'Marche en ville', 'Brocantes', 'Café'],
    compatibilityPoints: [
      'Bienveillance lucide',
      'Goût pour les choses simples',
      'Curiosité humaine',
    ],
    cautionPoints: [
      'Peut sembler discrète au premier abord',
      'N\'aime pas les démonstrations',
    ],
    availabilityHint: 'Dimanches après-midi',
    isFeatured: true,
  },
  {
    id: 'camille-27-paris',
    firstName: 'Camille',
    age: 27,
    city: 'Paris',
    dnaLabel: 'Maison Saudade',
    maisonId: 'saudade',
    occupation: 'Journaliste',
    teaser: 'Indépendance assumée, exigence discrète. Aime profond mais à son rythme.',
    compatibility: 86,
    reason:
      'Indépendance assumée, exigence intellectuelle, vision claire du couple.',
    photoUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600',
    photoUrls: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=900',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900',
    ],
    intentions: 'Engagement à deux, libertés préservées.',
    interests: ['Philosophie', 'Course à pied', 'Écriture', 'Politique'],
    compatibilityPoints: [
      'Égalité comme socle',
      'Communication directe',
      'Même sens de la liberté',
    ],
    cautionPoints: [
      'N\'aime pas les rôles attendus',
      'Demande de la cohérence dans les actes',
    ],
    availabilityHint: 'Mardi soir, dimanche matin',
    isFeatured: true,
  },
  {
    id: 'leo-28-paris',
    firstName: 'Léo',
    age: 28,
    city: 'Paris',
    dnaLabel: 'Maison Cinabre',
    maisonId: 'cinabre',
    occupation: 'Scénariste',
    teaser: 'Solaire, démonstratif, présent. Aime en couleur, sans demi-mesure.',
    compatibility: 82,
    reason:
      'Imagination quotidienne, sens du détail poétique, énergie créative.',
    photoUrl:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600',
    photoUrls: [
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=900',
    ],
    intentions: 'Construire un univers commun, à deux mains.',
    interests: ['Théâtre', 'Cinéma', 'Dessin', 'Vinyles rares'],
    compatibilityPoints: [
      'Goût du jeu créatif',
      'Présence chaleureuse',
      'Capacité à enchanter le quotidien',
    ],
    cautionPoints: [
      'Peut s\'éparpiller',
      'Besoin d\'espace pour créer',
    ],
    availabilityHint: 'Vendredi soir, samedi',
    isFeatured: true,
  },
  // ─── Profils ajoutés pour diversité (Maisons manquantes) ──────────
  {
    id: 'mathilde-29-bordeaux',
    firstName: 'Mathilde',
    age: 29,
    city: 'Bordeaux',
    dnaLabel: 'Maison Terracotta',
    maisonId: 'terracotta',
    occupation: 'Céramiste',
    teaser: 'Travaille la matière. Choisit lentement, donne entièrement.',
    compatibility: 85,
    reason:
      'Profondeur calme, choix sélectifs, présence physique attentive.',
    photoUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
    photoUrls: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900',
    ],
    bio: 'Atelier près des Chartrons. Cuit ses pièces au gaz, deux fois par mois. Dîne tard, parle peu, aime profondément.',
    prompts: [
      { question: 'Mon vice', answer: 'Acheter trop de terre quand je voyage.' },
      { question: 'L\'heure dorée', answer: '21h, après l\'atelier, avec une bière.' },
    ],
    intentions: 'Trouver quelqu\'un avec qui durer.',
    interests: ['Céramique', 'Vins nature', 'Marchés', 'Randonnée'],
    compatibilityPoints: [
      'Patience tactile',
      'Loyauté sans dramatisation',
      'Goût pour l\'artisanat',
    ],
    cautionPoints: [
      'Peu démonstrative',
      'Demande de la régularité',
    ],
    availabilityHint: 'Week-end, fin de journée en semaine',
  },
  {
    id: 'hugo-31-marseille',
    firstName: 'Hugo',
    age: 31,
    city: 'Marseille',
    dnaLabel: 'Maison Montparnasse',
    maisonId: 'montparnasse',
    occupation: 'Avocat',
    teaser: 'Léger, sociable, vif. La conversation comme sport préféré.',
    compatibility: 80,
    reason:
      'Énergie sociale partagée, goût pour les rencontres faciles, humour fin.',
    photoUrl:
      'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=600',
    photoUrls: [
      'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=900',
    ],
    bio: 'Ancien Parisien revenu au sud. Bosse en droit du travail. Joue au tennis trois fois par semaine, ne refuse jamais une terrasse.',
    prompts: [
      { question: 'Si je devais déménager', answer: 'Naples — pour la même densité humaine.' },
      { question: 'Une habitude', answer: 'Le café au comptoir, jamais en terrasse, le matin.' },
    ],
    intentions: 'Voir où ça mène. Pas pressé, pas fermé.',
    interests: ['Tennis', 'Pétanque', 'Dîners entre amis', 'Politique'],
    compatibilityPoints: [
      'Curiosité ouverte',
      'Rythme rapide partagé',
      'Aisance sociale',
    ],
    cautionPoints: [
      'Peut sembler distant entre les rendez-vous',
      'A besoin d\'une vie dehors',
    ],
    availabilityHint: 'Soirées en semaine',
  },
  {
    id: 'ines-26-lyon',
    firstName: 'Inès',
    age: 26,
    city: 'Lyon',
    dnaLabel: 'Maison Saudade',
    maisonId: 'saudade',
    occupation: 'Médecin généraliste',
    teaser: 'Tendre, mélancolique, ouverte à la surprise. Aime lentement.',
    compatibility: 88,
    reason:
      'Profondeur émotionnelle, ouverture aux profils variés, goût pour la durée.',
    photoUrl:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600',
    photoUrls: [
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=900',
    ],
    bio: 'Internat fini il y a deux ans. Cherche quelqu\'un avec qui partager les silences. Aime le portugais, qu\'elle apprend depuis trois ans.',
    prompts: [
      { question: 'Une chose qui me console', answer: 'La pluie sur la verrière de l\'hôpital, à 3h du matin.' },
      { question: 'Mon héritage', answer: 'Mon grand-père lisait Pessoa à voix haute. C\'est resté.' },
    ],
    intentions: 'Une histoire qui prend son temps.',
    interests: ['Littérature lusophone', 'Marche', 'Botanique', 'Piano'],
    compatibilityPoints: [
      'Sensibilité partagée',
      'Patience émotionnelle',
      'Curiosité culturelle',
    ],
    cautionPoints: [
      'Évite les déclarations trop rapides',
      'Demande de l\'espace après les gardes',
    ],
    availabilityHint: 'Selon planning hospitalier',
  },
  {
    id: 'tom-33-paris',
    firstName: 'Tom',
    age: 33,
    city: 'Paris',
    dnaLabel: 'Maison Bauhaus',
    maisonId: 'bauhaus',
    occupation: 'Ingénieur logiciel',
    teaser: 'Calme, décidé, sans flou. Sait formuler ce qu\'il veut.',
    compatibility: 83,
    reason:
      'Vision construite, communication claire, goût pour le pragmatisme.',
    photoUrl:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600',
    photoUrls: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=900',
    ],
    bio: 'Bosse en remote pour une boîte berlinoise. Vit dans le 11e. Cuisine japonaise, court le long de la Bastille, lit Atul Gawande.',
    prompts: [
      { question: 'Une chose à savoir', answer: 'Je ne ghoste pas. Si je disparais, j\'envoie un mot.' },
      { question: 'Ma définition du couple', answer: 'Deux solitudes qui se respectent.' },
    ],
    intentions: 'Construire avec quelqu\'un qui parle la même langue.',
    interests: ['Cuisine', 'Course à pied', 'Stoïcisme', 'Jazz'],
    compatibilityPoints: [
      'Clarté dans la communication',
      'Indépendance respectée',
      'Engagement long-terme',
    ],
    cautionPoints: [
      'Peu enclin aux jeux relationnels',
      'Demande des actes plus que des mots',
    ],
    availabilityHint: 'Soirées en semaine, week-end ouvert',
  },
]

export function getSelectedProfileById(id: string): SelectedProfile | undefined {
  return mockSelectedProfiles.find((p) => p.id === id)
}
