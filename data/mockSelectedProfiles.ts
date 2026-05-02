import type { DnaCategoryId } from './kolmiDna'

// Champs hérités (compatibility, reason, intentions...) gardés pour ne
// pas casser l'écran détail tant que l'enrichissement data n'est pas
// fini. Les champs nouveaux (occupation, teaser, photoUrls, maisonId,
// bio, prompts) sont optionnels et viennent recouvrir les anciens dès
// qu'ils sont fournis. Cf. tâche "Acte I — mockSelectedProfiles
// enrichir" pour la migration complète.
export type SelectedProfile = {
  id: string
  firstName: string
  age: number
  city: string
  dnaLabel: string
  // Nouveau : id de la Maison cible (link vers data/kolmiDna.ts).
  maisonId?: DnaCategoryId
  // Nouveau : profession affichée sous le prénom (« Architecte · Lyon »).
  occupation?: string
  // Nouveau : phrase éditoriale courte du matchmaker (≤ 110 caractères).
  // Tant que vide, on retombe sur `reason` pour ne pas casser l'écran.
  teaser?: string
  /** @deprecated Match score numérique — banni par le brief. */
  compatibility: number
  reason: string
  photoUrl?: string
  // Nouveau : galerie pour l'écran détail (3-6 photos). photoUrl reste
  // utilisé comme fallback principal de la carte.
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

export const mockSelectedProfiles: SelectedProfile[] = [
  {
    id: 'sarah-24-paris',
    firstName: 'Sarah',
    age: 24,
    city: 'Paris',
    dnaLabel: 'Maison Indigo',
    compatibility: 91,
    reason:
      'Même rythme émotionnel, communication directe, forte compatibilité de valeurs.',
    photoUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
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
    compatibility: 87,
    reason:
      'Profil stable, esthétique relationnelle proche, vision sérieuse de la rencontre.',
    photoUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
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
    compatibility: 84,
    reason:
      'Connexion probable sur l\'intensité, la curiosité et le goût du non-conventionnel.',
    photoUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600',
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
    id: 'lou-26-paris',
    firstName: 'Lou',
    age: 26,
    city: 'Paris',
    dnaLabel: 'Maison Bloomsbury',
    compatibility: 89,
    reason:
      'Regard tendre, attention aux détails, lecture juste des situations.',
    photoUrl:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600',
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
    compatibility: 86,
    reason:
      'Indépendance assumée, exigence intellectuelle, vision claire du couple.',
    photoUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600',
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
    compatibility: 82,
    reason:
      'Imagination quotidienne, sens du détail poétique, énergie créative.',
    photoUrl:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600',
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
]

// Note: photoUrls volontairement uniques. Si tu en ajoutes, vérifie la
// non-duplication avant de commit (un homme et une femme avec la même
// photo a déjà fuité une fois — Léo/Anna).

export function getSelectedProfileById(id: string): SelectedProfile | undefined {
  return mockSelectedProfiles.find((p) => p.id === id)
}
