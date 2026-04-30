import type { DnaCategoryId } from '@/data/kolmiDna'
import type { KolmiDimension } from '@/data/kolmiQuestions'

export type KolmiAnswer = {
  questionId: string
  optionId: string
  value: string
  answeredAt: string
}

export type KolmiDimensionScores = Record<KolmiDimension, number>

export type KolmiDnaResult = {
  categoryId: DnaCategoryId
  categoryLabel: string
  scores: KolmiDimensionScores
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
}

export type Venue = {
  id: string
  name: string
  address: string
  city: string
  ambiance: string
  matchmakerNote: string
}
