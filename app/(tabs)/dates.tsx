import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
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
import { kolmiMotion, staggerDelay } from '@/lib/kolmi/motion'
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

  const buckets = useMemo(() => {
    const out: Record<keyof typeof SECTION_LABELS, Meeting[]> = {
      todo: [],
      waiting: [],
      confirmed: [],
      past: [],
    }
    for (const m of meetings) {
      out[bucketFor(m.status)].push(m)
    }
    return out
  }, [meetings])

  const sectionOrder: (keyof typeof SECTION_LABELS)[] = [
    'todo',
    'waiting',
    'confirmed',
    'past',
  ]

  const handleSchedule = useCallback(
    (id: string) => router.push(`/meeting/schedule/${id}`),
    [router],
  )
  const handleConfirm = useCallback(
    (id: string) => router.push(`/meeting/confirm/${id}`),
    [router],
  )

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header éditorial */}
          <View style={styles.header}>
            <Text style={styles.kicker}>Rendez-vous</Text>
            <Text style={styles.title}>Vos rencontres.</Text>
            <Text style={styles.subtitle}>
              En cours et à venir, organisées par votre matchmaker.
            </Text>
          </View>

          {meetings.length === 0 && (
            <View style={styles.emptyBlock}>
              <View style={styles.emptyOrnament} />
              <Text style={styles.emptyTitle}>Aucune rencontre en cours.</Text>
              <Text style={styles.emptyBody}>
                Vos demandes apparaîtront ici. Commencez depuis un profil de votre courrier du jour.
              </Text>
            </View>
          )}

          {sectionOrder.map((key, sIdx) => {
            const list = buckets[key]
            if (list.length === 0) return null
            return (
              <Animated.View
                key={key}
                entering={FadeIn.delay(staggerDelay(sIdx, 100))
                  .duration(kolmiMotion.duration.lg)
                  .easing(kolmiMotion.easing.soft)}
                style={styles.section}
              >
                <View style={styles.sectionHead}>
                  <View style={styles.sectionRule} />
                  <Text style={styles.sectionLabel}>{SECTION_LABELS[key]}</Text>
                </View>
                {list.map((m, i) => (
                  <Animated.View
                    key={m.id}
                    entering={FadeInDown.delay(staggerDelay(i, 50))
                      .duration(kolmiMotion.duration.md)
                      .easing(kolmiMotion.easing.soft)}
                  >
                    <MeetingRow
                      meeting={m}
                      onSchedule={handleSchedule}
                      onConfirm={handleConfirm}
                    />
                  </Animated.View>
                ))}
              </Animated.View>
            )
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  scrollContent: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.md,
    paddingBottom: kolmiSpace.xxxl,
    gap: kolmiSpace.xl,
  },
  header: {
    gap: 4,
  },
  kicker: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textMuted,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: kolmiFonts.serif,
    fontSize: 34,
    color: kolmiColors.text,
    lineHeight: 40,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    color: kolmiColors.textBody,
    lineHeight: 22,
    marginTop: 4,
  },

  // Empty state
  emptyBlock: {
    marginTop: kolmiSpace.xl,
    alignItems: 'center',
    gap: kolmiSpace.sm,
    paddingHorizontal: kolmiSpace.lg,
  },
  emptyOrnament: {
    width: 48,
    height: 0.8,
    backgroundColor: kolmiColors.accent,
    marginBottom: kolmiSpace.sm,
  },
  emptyTitle: {
    fontFamily: kolmiFonts.serif,
    fontSize: 22,
    color: kolmiColors.text,
    lineHeight: 28,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 15,
    color: kolmiColors.textBody,
    lineHeight: 22,
    textAlign: 'center',
  },

  // Section
  section: {
    gap: kolmiSpace.sm,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: kolmiSpace.sm,
  },
  sectionRule: {
    width: 24,
    height: 0.6,
    backgroundColor: kolmiColors.accent,
  },
  sectionLabel: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textBody,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
})

const MeetingRow = React.memo(function MeetingRow({
  meeting,
  onSchedule,
  onConfirm,
}: {
  meeting: Meeting
  onSchedule: (id: string) => void
  onConfirm: (id: string) => void
}) {
  const profile = getSelectedProfileById(meeting.profileId)
  const name = profile ? `${profile.firstName}, ${profile.age}` : meeting.profileId
  const label = statusLabel(meeting.status, meeting.confirmedSlot)

  const schedulePress = useCallback(() => onSchedule(meeting.id), [onSchedule, meeting.id])
  const confirmPress = useCallback(() => onConfirm(meeting.id), [onConfirm, meeting.id])

  const cta =
    meeting.status === 'accepted_waiting_slots'
      ? { text: 'Choisir mes créneaux', onPress: schedulePress }
      : meeting.status === 'confirmed'
        ? { text: 'Voir le rendez-vous', onPress: confirmPress }
        : null

  return (
    <View style={rowStyles.card}>
      <View style={rowStyles.head}>
        <View style={rowStyles.avatarWrap}>
          {profile?.photoUrl ? (
            <Image
              source={{ uri: profile.photoUrl }}
              style={rowStyles.avatar}
              contentFit="cover"
              transition={120}
            />
          ) : (
            <View style={rowStyles.avatarPlaceholder}>
              <Text style={rowStyles.avatarLetter}>
                {profile?.firstName.charAt(0).toUpperCase() ?? '·'}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rowStyles.name}>{name}</Text>
          <Text style={rowStyles.status}>{label}</Text>
          {profile?.dnaLabel ? (
            <Text style={rowStyles.maison}>{profile.dnaLabel}</Text>
          ) : null}
        </View>
      </View>
      {cta && (
        <TouchableOpacity
          onPress={cta.onPress}
          activeOpacity={0.85}
          style={rowStyles.cta}
        >
          <Text style={rowStyles.ctaText}>{cta.text}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
})

const rowStyles = StyleSheet.create({
  card: {
    padding: kolmiSpace.md,
    borderRadius: kolmiRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(22,19,15,0.12)',
    backgroundColor: '#FAF8F5',
    gap: kolmiSpace.sm,
  },
  head: {
    flexDirection: 'row',
    gap: kolmiSpace.md,
    alignItems: 'flex-start',
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: kolmiColors.surfaceSoft,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#EFE7DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: kolmiFonts.serif,
    fontSize: 22,
    color: kolmiColors.accent,
  },
  name: {
    fontFamily: kolmiFonts.serif,
    fontSize: 20,
    color: kolmiColors.text,
    letterSpacing: -0.2,
  },
  status: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 14,
    color: kolmiColors.textBody,
    marginTop: 2,
  },
  maison: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 11,
    color: kolmiColors.textMuted,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  cta: {
    height: 44,
    borderRadius: kolmiRadius.pill,
    backgroundColor: kolmiColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 14,
    color: kolmiColors.white,
    letterSpacing: 0.2,
  },
})
