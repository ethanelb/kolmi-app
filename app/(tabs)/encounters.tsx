import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { RefreshControl, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
  fontScale,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import EncountersSegmentedControl, {
  type EncounterSegment,
} from '@/components/kolmi/EncountersSegmentedControl'
import { mockMeetings } from '@/data/mockMeetings'
import { mockSelectedProfiles, type SelectedProfile } from '@/data/mockSelectedProfiles'
import { getMeetings, getPassedProfiles } from '@/lib/kolmi/storage'
import { getProfileByIdSync as getSelectedProfileById } from '@/lib/kolmi/fetchProfiles'
import { KOLMI_DEMO_MODE } from '@/constants/kolmiConfig'
import { kolmiMotion, staggerDelay } from '@/lib/kolmi/motion'
import type { Meeting, MeetingStatus } from '@/lib/kolmi/types'

// Tab gauche unifié : 3 sub-segments (Actives / Passées / Archives).
// "Actives" = meetings en cours (requested → confirmed).
// "Passées" = meetings finis (completed / declined / expired).
// "Archives" = profils passés sans demande.

const ACTIVE_STATUSES: ReadonlyArray<MeetingStatus> = [
  'requested_by_me',
  'waiting_for_other',
  'accepted_waiting_slots',
  'slots_submitted',
  'confirmed',
]

const PAST_STATUSES: ReadonlyArray<MeetingStatus> = [
  'completed',
  'declined',
  'expired',
]

const SECTION_LABELS = {
  todo: 'À compléter',
  waiting: 'En attente',
  confirmed: 'Confirmés',
  past: 'Passés',
} as const

function bucketFor(status: MeetingStatus): keyof typeof SECTION_LABELS | null {
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
      return slot ? `Confirmé · ${slot}` : 'Confirmé'
    case 'completed':
      return 'Rencontre passée'
    case 'declined':
      return 'Rencontre non confirmée'
    case 'expired':
      return 'Demande expirée'
  }
}

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

export default function EncountersScreen() {
  const router = useRouter()
  const [segment, setSegment] = useState<EncounterSegment>('active')
  const [meetings, setMeetings] = useState<Meeting[]>(() => mergeMeetings([]))
  const [passed, setPassed] = useState<string[]>([])

  const [isRefreshing, setIsRefreshing] = useState(false)
  const refresh = useCallback(() => {
    return Promise.all([getMeetings(), getPassedProfiles()]).then(([m, p]) => {
      setMeetings(mergeMeetings(m))
      setPassed(p)
    })
  }, [])

  const onPullRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }, [refresh])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Le mock backend (simulateOtherDecision/SlotChoice/Feedback) patche
  // AsyncStorage de façon asynchrone via setTimeout. Quand le tab est
  // visible, on poll toutes les 12 s pour refléter ces changements sans
  // forcer l'utilisateur à quitter/revenir.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useFocusEffect(
    useCallback(() => {
      refresh()
      pollRef.current = setInterval(refresh, 12000)
      return () => {
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = null
      }
    }, [refresh]),
  )

  const activeMeetings = useMemo(
    () => meetings.filter((m) => ACTIVE_STATUSES.includes(m.status)),
    [meetings],
  )
  const pastMeetings = useMemo(
    () => meetings.filter((m) => PAST_STATUSES.includes(m.status)),
    [meetings],
  )
  const passedProfiles: SelectedProfile[] = useMemo(() => {
    const map = new Map(mockSelectedProfiles.map((p) => [p.id, p]))
    return [...passed]
      .reverse()
      .map((id) => map.get(id))
      .filter((p): p is SelectedProfile => p !== undefined)
  }, [passed])

  const counts = {
    active: activeMeetings.length,
    past: pastMeetings.length,
    archive: passedProfiles.length,
  }

  const activeBuckets = useMemo(() => {
    const out: Record<keyof typeof SECTION_LABELS, Meeting[]> = {
      todo: [],
      waiting: [],
      confirmed: [],
      past: [],
    }
    for (const m of activeMeetings) {
      const b = bucketFor(m.status)
      if (b) out[b].push(m)
    }
    return out
  }, [activeMeetings])

  const handleSchedule = useCallback(
    (id: string) => router.push(`/meeting/schedule/${id}`),
    [router],
  )
  const handleConfirm = useCallback(
    (id: string) => router.push(`/meeting/confirm/${id}`),
    [router],
  )
  const handleViewProfile = useCallback(
    (id: string) => router.push(`/matches/${id}`),
    [router],
  )

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Bouton retour en flow (pas absolu) pour ne pas chevaucher la
            status bar. Routé explicitement vers /conversation. */}
        <View style={styles.backRow}>
          <TouchableOpacity
            onPress={() => router.navigate('/(tabs)/conversation')}
            activeOpacity={0.7}
            style={styles.backButton}
            hitSlop={10}
            accessibilityLabel="Retour à l'accueil"
            accessibilityRole="button"
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M14.5 5.5L7.5 12l7 6.5"
                stroke={kolmiColors.text}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.kicker}>Vos</Text>
          <Text style={styles.title}>Rencontres.</Text>
          <Text style={styles.subtitle}>
            Tout ce qui se passe avec d'autres — demandes, rendez-vous, archives.
          </Text>
        </View>

        <View style={styles.segmentWrap}>
          <EncountersSegmentedControl
            value={segment}
            onChange={setSegment}
            counts={counts}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onPullRefresh}
              tintColor={kolmiColors.accent}
              colors={[kolmiColors.accent]}
            />
          }
        >
          {segment === 'active' && (
            <ActiveView
              buckets={activeBuckets}
              onSchedule={handleSchedule}
              onConfirm={handleConfirm}
            />
          )}
          {segment === 'past' && (
            <PastView meetings={pastMeetings} onConfirm={handleConfirm} />
          )}
          {segment === 'archive' && (
            <ArchiveView profiles={passedProfiles} onTap={handleViewProfile} />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

// ─── Sub-views ──────────────────────────────────────────────────────

function ActiveView({
  buckets,
  onSchedule,
  onConfirm,
}: {
  buckets: Record<keyof typeof SECTION_LABELS, Meeting[]>
  onSchedule: (id: string) => void
  onConfirm: (id: string) => void
}) {
  const sectionOrder: (keyof typeof SECTION_LABELS)[] = ['todo', 'waiting', 'confirmed']
  const total = sectionOrder.reduce((acc, k) => acc + buckets[k].length, 0)

  if (total === 0) {
    return (
      <EmptySlate
        title="Rien d'actif pour l'instant."
        body="Vos demandes en cours apparaîtront ici."
      />
    )
  }

  return (
    <View style={{ gap: kolmiSpace.xl }}>
      {sectionOrder.map((key, sIdx) => {
        const list = buckets[key]
        if (list.length === 0) return null
        return (
          <Animated.View
            key={key}
            entering={FadeIn.delay(staggerDelay(sIdx, 100))
              .duration(kolmiMotion.duration.lg)
              .easing(kolmiMotion.easing.soft)}
            style={{ gap: kolmiSpace.sm }}
          >
            <View style={sectionStyles.head}>
              <View style={sectionStyles.rule} />
              <Text style={sectionStyles.label}>{SECTION_LABELS[key]}</Text>
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
                  onSchedule={onSchedule}
                  onConfirm={onConfirm}
                />
              </Animated.View>
            ))}
          </Animated.View>
        )
      })}
    </View>
  )
}

function PastView({
  meetings,
  onConfirm,
}: {
  meetings: Meeting[]
  onConfirm: (id: string) => void
}) {
  if (meetings.length === 0) {
    return (
      <EmptySlate
        title="Aucune rencontre passée."
        body="Vos rendez-vous terminés s'archiveront ici."
      />
    )
  }
  return (
    <View style={{ gap: kolmiSpace.sm }}>
      {meetings.map((m, i) => (
        <Animated.View
          key={m.id}
          entering={FadeInDown.delay(staggerDelay(i, 60))
            .duration(kolmiMotion.duration.md)
            .easing(kolmiMotion.easing.soft)}
        >
          <MeetingRow meeting={m} onConfirm={onConfirm} muted />
        </Animated.View>
      ))}
    </View>
  )
}

function ArchiveView({
  profiles,
  onTap,
}: {
  profiles: SelectedProfile[]
  onTap: (id: string) => void
}) {
  if (profiles.length === 0) {
    return (
      <EmptySlate
        title="Aucun envoi passé."
        body="Quand vous écartez un profil, il s'archive ici."
      />
    )
  }
  return (
    <View style={{ gap: kolmiSpace.sm }}>
      {profiles.map((p, i) => (
        <Animated.View
          key={p.id}
          entering={FadeInDown.delay(staggerDelay(i, 60))
            .duration(kolmiMotion.duration.md)
            .easing(kolmiMotion.easing.soft)}
        >
          <ArchiveRow profile={p} onPress={onTap} />
        </Animated.View>
      ))}
    </View>
  )
}

function EmptySlate({ title, body }: { title: string; body: string }) {
  return (
    <View style={emptyStyles.wrap}>
      <View style={emptyStyles.ornament} />
      <Text style={emptyStyles.title}>{title}</Text>
      <Text style={emptyStyles.body}>{body}</Text>
    </View>
  )
}

// ─── Rows ───────────────────────────────────────────────────────────

const MeetingRow = React.memo(function MeetingRow({
  meeting,
  onSchedule,
  onConfirm,
  muted,
}: {
  meeting: Meeting
  onSchedule?: (id: string) => void
  onConfirm: (id: string) => void
  muted?: boolean
}) {
  const profile = getSelectedProfileById(meeting.profileId)
  const name = profile ? `${profile.firstName}, ${profile.age}` : meeting.profileId
  const label = statusLabel(meeting.status, meeting.confirmedSlot)

  const handleSchedule = useCallback(
    () => onSchedule?.(meeting.id),
    [onSchedule, meeting.id],
  )
  const handleConfirm = useCallback(
    () => onConfirm(meeting.id),
    [onConfirm, meeting.id],
  )

  const cta =
    meeting.status === 'accepted_waiting_slots' && onSchedule
      ? { text: 'Choisir mes créneaux', onPress: handleSchedule }
      : meeting.status === 'confirmed'
        ? { text: 'Voir le rendez-vous', onPress: handleConfirm }
        : null

  return (
    <View style={[rowStyles.card, muted && rowStyles.cardMuted]}>
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

const ArchiveRow = React.memo(function ArchiveRow({
  profile,
  onPress,
}: {
  profile: SelectedProfile
  onPress: (id: string) => void
}) {
  const handlePress = useCallback(
    () => onPress(profile.id),
    [onPress, profile.id],
  )
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={rowStyles.archiveRow}
    >
      <View style={rowStyles.archiveThumb}>
        {profile.photoUrl ? (
          <Image
            source={{ uri: profile.photoUrl }}
            style={rowStyles.avatar}
            contentFit="cover"
            transition={120}
          />
        ) : (
          <View style={rowStyles.avatarPlaceholder}>
            <Text style={rowStyles.avatarLetter}>
              {profile.firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={rowStyles.name}>
          {profile.firstName}, {profile.age}
        </Text>
        <Text style={rowStyles.archiveMaison}>{profile.dnaLabel}</Text>
      </View>
    </TouchableOpacity>
  )
})

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  backRow: {
    flexDirection: 'row',
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.sm,
    paddingBottom: kolmiSpace.xs,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  header: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.xs,
    paddingBottom: kolmiSpace.sm,
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
    fontSize: fontScale(34),
    color: kolmiColors.text,
    lineHeight: 40,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 15,
    color: kolmiColors.textBody,
    lineHeight: 22,
    marginTop: 4,
  },
  segmentWrap: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.sm,
    paddingBottom: kolmiSpace.sm,
  },
  scrollContent: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.lg,
    paddingBottom: kolmiSpace.xxxl,
  },
})

const sectionStyles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: kolmiSpace.sm,
  },
  rule: {
    width: 24,
    height: 0.6,
    backgroundColor: kolmiColors.accent,
  },
  label: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textBody,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
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
  cardMuted: {
    opacity: 0.7,
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
  archiveRow: {
    flexDirection: 'row',
    gap: kolmiSpace.md,
    padding: kolmiSpace.md,
    backgroundColor: '#FAF8F5',
    borderRadius: kolmiRadius.lg,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    alignItems: 'center',
  },
  archiveThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: kolmiColors.surfaceSoft,
  },
  archiveMaison: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 13,
    color: kolmiColors.accent,
    marginTop: 2,
  },
})

const emptyStyles = StyleSheet.create({
  wrap: {
    marginTop: kolmiSpace.xxl,
    alignItems: 'center',
    gap: kolmiSpace.sm,
    paddingHorizontal: kolmiSpace.lg,
  },
  ornament: {
    width: 48,
    height: 0.8,
    backgroundColor: kolmiColors.accent,
    marginBottom: kolmiSpace.sm,
  },
  title: {
    fontFamily: kolmiFonts.serif,
    fontSize: 22,
    color: kolmiColors.text,
    lineHeight: 28,
    textAlign: 'center',
  },
  body: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 15,
    color: kolmiColors.textBody,
    lineHeight: 22,
    textAlign: 'center',
  },
})
