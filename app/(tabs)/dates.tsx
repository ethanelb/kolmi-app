import React, { useEffect, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { mockMeetings } from '@/data/mockMeetings'
import { getMeetings } from '@/lib/kolmi/storage'
import { getSelectedProfileById } from '@/data/mockSelectedProfiles'
import { KOLMI_DEMO_MODE } from '@/constants/kolmiConfig'
import type { Meeting, MeetingStatus } from '@/lib/kolmi/types'

const SECTION_LABELS: Record<'todo' | 'waiting' | 'confirmed' | 'past', string> = {
  todo: 'À compléter',
  waiting: 'En attente',
  confirmed: 'Confirmés',
  past: 'Passés',
}

function bucketFor(status: MeetingStatus): keyof typeof SECTION_LABELS {
  switch (status) {
    case 'accepted_waiting_slots':
      return 'todo'
    case 'requested_by_me':
    case 'waiting_for_other':
    case 'slots_submitted':
      return 'waiting'
    case 'confirmed':
      return 'confirmed'
    case 'completed':
    case 'declined':
    case 'expired':
      return 'past'
  }
}

function statusLabel(status: MeetingStatus, slot?: string): string {
  switch (status) {
    case 'requested_by_me':
      return 'Demande envoyée'
    case 'waiting_for_other':
      return 'En attente de sa réponse'
    case 'accepted_waiting_slots':
      return 'Choisissez vos créneaux'
    case 'slots_submitted':
      return 'Créneaux envoyés — confirmation imminente'
    case 'confirmed':
      return slot ? `Confirmé ${slot}` : 'Confirmé'
    case 'completed':
      return 'Rencontre passée'
    case 'declined':
      return 'Rencontre non confirmée'
    case 'expired':
      return 'Demande expirée'
  }
}

// Merge user-saved meetings with seed mocks. User entries win on id collision.
// In demo mode the seed mocks pre-populate the dates tab so the UI is never
// empty during demos. Real beta users (KOLMI_DEMO_MODE=false) only see their
// own meetings.
function mergeMeetings(saved: Meeting[]): Meeting[] {
  const byId = new Map<string, Meeting>()
  if (KOLMI_DEMO_MODE) {
    for (const m of mockMeetings) byId.set(m.id, m)
  }
  for (const m of saved) byId.set(m.id, m)
  return Array.from(byId.values()).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  )
}

export default function DatesScreen() {
  const router = useRouter()
  const [meetings, setMeetings] = useState<Meeting[]>(() =>
    mergeMeetings([]),
  )

  const refresh = React.useCallback(() => {
    getMeetings().then((saved) => setMeetings(mergeMeetings(saved)))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useFocusEffect(
    React.useCallback(() => {
      refresh()
    }, [refresh])
  )

  const buckets: Record<keyof typeof SECTION_LABELS, Meeting[]> = {
    todo: [],
    waiting: [],
    confirmed: [],
    past: [],
  }
  for (const m of meetings) {
    buckets[bucketFor(m.status)].push(m)
  }

  const sectionOrder: (keyof typeof SECTION_LABELS)[] = [
    'todo',
    'waiting',
    'confirmed',
    'past',
  ]

  return (
    <View style={{ flex: 1, backgroundColor: kolmiColors.bg }}>
      <GrainOverlay />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: kolmiPaddingX,
            paddingTop: kolmiSpace.md,
            paddingBottom: kolmiSpace.xxxl,
            gap: kolmiSpace.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: kolmiSpace.xs }}>
            <Text
              style={{
                fontFamily: kolmiFonts.serif,
                fontSize: 36,
                color: kolmiColors.text,
                lineHeight: 42,
                letterSpacing: -0.4,
              }}
            >
              Rendez-vous
            </Text>
            <Text
              style={{
                fontFamily: kolmiFonts.serifItalic,
                fontSize: 16,
                color: kolmiColors.textBody,
                lineHeight: 22,
              }}
            >
              Vos rencontres en cours et à venir, organisées par votre matchmaker.
            </Text>
          </View>

          {meetings.length === 0 && (
            <View
              style={{
                padding: kolmiSpace.lg,
                borderRadius: kolmiRadius.lg,
                borderWidth: 1,
                borderColor: kolmiColors.outline,
                gap: kolmiSpace.sm,
              }}
            >
              <Text
                style={{
                  fontFamily: kolmiFonts.serif,
                  fontSize: 22,
                  color: kolmiColors.text,
                  lineHeight: 28,
                }}
              >
                Aucune rencontre en cours.
              </Text>
              <Text
                style={{
                  fontFamily: kolmiFonts.serifItalic,
                  fontSize: 15,
                  color: kolmiColors.textBody,
                  lineHeight: 22,
                }}
              >
                Les demandes apparaîtront ici. Commencez depuis un profil de votre Sélection.
              </Text>
            </View>
          )}

          {sectionOrder.map((key) => {
            const list = buckets[key]
            if (list.length === 0) return null
            return (
              <View key={key} style={{ gap: kolmiSpace.sm }}>
                <Text
                  style={{
                    fontFamily: kolmiFonts.uiSemiBold,
                    fontSize: 11,
                    color: kolmiColors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 1.6,
                  }}
                >
                  {SECTION_LABELS[key]}
                </Text>
                {list.map((m) => (
                  <MeetingRow
                    key={m.id}
                    meeting={m}
                    onSchedule={() => router.push(`/meeting/schedule/${m.id}`)}
                    onConfirm={() => router.push(`/meeting/confirm/${m.id}`)}
                  />
                ))}
              </View>
            )
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function MeetingRow({
  meeting,
  onSchedule,
  onConfirm,
}: {
  meeting: Meeting
  onSchedule: () => void
  onConfirm: () => void
}) {
  const profile = getSelectedProfileById(meeting.profileId)
  const name = profile ? `${profile.firstName}, ${profile.age}` : meeting.profileId
  const label = statusLabel(meeting.status, meeting.confirmedSlot)

  const cta =
    meeting.status === 'accepted_waiting_slots'
      ? { text: 'Choisir mes disponibilités', onPress: onSchedule, primary: true }
      : meeting.status === 'confirmed'
        ? { text: 'Voir le rendez-vous', onPress: onConfirm, primary: true }
        : null

  return (
    <View
      style={{
        padding: kolmiSpace.md,
        borderRadius: kolmiRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(22,19,15,0.12)',
        backgroundColor: '#FAF8F5',
        gap: kolmiSpace.xs,
      }}
    >
      <Text
        style={{
          fontFamily: kolmiFonts.serif,
          fontSize: 20,
          color: kolmiColors.text,
          letterSpacing: -0.2,
        }}
      >
        {name}
      </Text>
      <Text
        style={{
          fontFamily: kolmiFonts.serifItalic,
          fontSize: 14,
          color: kolmiColors.textBody,
        }}
      >
        {label}
      </Text>
      {cta && (
        <TouchableOpacity
          onPress={cta.onPress}
          activeOpacity={0.85}
          style={{
            marginTop: kolmiSpace.sm,
            height: 44,
            borderRadius: kolmiRadius.pill,
            backgroundColor: cta.primary ? kolmiColors.text : 'transparent',
            borderWidth: cta.primary ? 0 : 1,
            borderColor: kolmiColors.outline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: kolmiFonts.uiSemiBold,
              fontSize: 14,
              color: cta.primary ? '#FAF8F5' : kolmiColors.text,
              letterSpacing: 0.2,
            }}
          >
            {cta.text}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
