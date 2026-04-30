import type { Meeting } from '@/lib/kolmi/types'

// Seed meetings shown on /(tabs)/dates before the user has requested any.
// These are merged with locally stored meetings (kolmi.meetings) at read
// time — so a user-created meeting never overrides a mock with the same
// id, but mocks fill in until the user has activity of their own.
export const mockMeetings: Meeting[] = [
  {
    id: 'meeting-sarah-seed',
    profileId: 'sarah-24-paris',
    status: 'waiting_for_other',
    createdAt: '2026-04-28T10:00:00.000Z',
  },
  {
    id: 'meeting-noa-seed',
    profileId: 'noa-23-paris',
    status: 'accepted_waiting_slots',
    createdAt: '2026-04-26T18:30:00.000Z',
  },
  {
    id: 'meeting-anna-seed',
    profileId: 'anna-25-paris',
    status: 'confirmed',
    selectedSlots: ['Jeudi 20h30', 'Dimanche 16h00'],
    confirmedSlot: 'Jeudi 20h30',
    venueId: 'cafe-nuances',
    createdAt: '2026-04-22T12:00:00.000Z',
  },
]
