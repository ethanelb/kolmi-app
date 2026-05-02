import type { DnaCategoryId } from '@/data/kolmiDna'
import type { KolmiAxis } from '@/data/kolmiQuestions'

export type KolmiAnswer = {
  questionId: string
  optionId: string
  value: string
  answeredAt: string
}

// Score signé par axe. Convention :
//   intensity > 0 → ardent  ; <= 0 → calm
//   rhythm    > 0 → fast    ; <= 0 → slow
//   openness  > 0 → open    ; <= 0 → selective
// Le pôle "doux" (calm / slow / selective) gagne en cas d'égalité (0).
export type KolmiAxisScores = Record<KolmiAxis, number>

export type KolmiDnaResult = {
  categoryId: DnaCategoryId
  categoryLabel: string
  scores: KolmiAxisScores
  primaryTraits: string[]
  summary: string
  createdAt: string
}

export type MeetingStatus =
  | 'requested_by_me'
  | 'waiting_for_other'
  | 'accepted_waiting_slots'
  | 'slots_submitted'
  | 'confirmed'
  | 'completed'
  | 'declined'
  | 'expired'

export type Meeting = {
  id: string
  profileId: string
  status: MeetingStatus
  selectedSlots?: string[]
  confirmedSlot?: string
  venueId?: string
  createdAt: string
  // Petit mot optionnel attaché à la demande initiale (≤ 80 caractères).
  note?: string
  // Décision finale post-rdv : true = "on se revoit", false = "on en
  // reste là". Sert à marquer un match mutuel quand les 2 disent oui.
  feedbackByMe?: boolean
  feedbackByOther?: boolean
}

export type VenueType = 'café' | 'restaurant' | 'bar à vin' | 'salon de thé'

export type Venue = {
  id: string
  name: string
  address: string
  city: string
  ambiance: string
  matchmakerNote: string
  // Champ ajouté pour le sélecteur de créneaux : permet de filtrer les
  // lieux par quartier dans la sélection.
  neighborhood?: string
  type?: VenueType
}
