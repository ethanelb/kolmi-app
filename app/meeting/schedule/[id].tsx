import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import { kolmiMotion } from '@/lib/kolmi/motion'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { mockMeetings } from '@/data/mockMeetings'
import { getSelectedProfileById } from '@/data/mockSelectedProfiles'
import { getMeetingById, saveMeeting, updateMeeting } from '@/lib/kolmi/storage'
import { KOLMI_DEMO_MODE } from '@/constants/kolmiConfig'
import type { Meeting } from '@/lib/kolmi/types'

const SLOT_BG_OFF = '#FAF8F5'
const SLOT_BG_ON = '#FBEFEF'

const AnimatedSvg = Animated.createAnimatedComponent(Svg)

const SLOT_OPTIONS = [
  'Mardi 19h00',
  'Mercredi 19h30',
  'Jeudi 20h30',
  'Samedi 18h00',
  'Dimanche 16h00',
  'Dimanche 19h00',
]

const MIN_SLOTS = 2
const MAX_SLOTS = 3

export default function MeetingScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const stored = id ? await getMeetingById(id) : null
      const seedFallback = KOLMI_DEMO_MODE
        ? mockMeetings.find((m) => m.id === id)
        : undefined
      const found = stored ?? seedFallback ?? null
      if (cancelled) return

      // Guard d'état : on ne peut planifier que si le matchmaker attend
      // les disponibilités. Sinon on redirige vers l'écran cohérent.
      if (found) {
        if (found.status === 'confirmed') {
          router.replace(`/meeting/confirm/${found.id}`)
          return
        }
        if (found.status !== 'accepted_waiting_slots') {
          // requested_by_me / waiting_for_other / slots_submitted /
          // completed / declined / expired → pas planifiable ici.
          router.replace('/(tabs)/dates')
          return
        }
      }

      setMeeting(found)
      setSelected(found?.selectedSlots ?? [])
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, router])

  const profile = useMemo(
    () => (meeting ? getSelectedProfileById(meeting.profileId) : null),
    [meeting],
  )

  const toggle = (slot: string) => {
    setSelected((prev) => {
      if (prev.includes(slot)) {
        Haptics.selectionAsync().catch(() => {})
        return prev.filter((s) => s !== slot)
      }
      if (prev.length >= MAX_SLOTS) {
        // Dépassement du plafond : feedback warning au lieu d'un no-op muet.
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
        return prev
      }
      Haptics.selectionAsync().catch(() => {})
      return [...prev, slot]
    })
  }

  const canSubmit = selected.length >= MIN_SLOTS
  const remainingToMin = Math.max(0, MIN_SLOTS - selected.length)

  const onSubmit = async () => {
    if (!meeting || submitting || !canSubmit) return
    setSubmitting(true)

    // Re-check status au moment du submit pour éviter qu'un meeting
    // déjà confirmé sur un autre device ou refresh ne soit re-confirmé.
    let stored: Meeting | null
    try {
      stored = await getMeetingById(meeting.id)
    } catch (err) {
      console.warn('[kolmi] schedule re-read failed', err)
      Alert.alert(
        'Action impossible',
        'Une erreur est survenue. Réessayez dans un instant.',
      )
      setSubmitting(false)
      return
    }
    const current = stored ?? meeting
    if (current.status !== 'accepted_waiting_slots') {
      // Quelqu'un (ou un autre onglet) a fait avancer le meeting entre
      // l'ouverture de l'écran et le submit.
      Alert.alert(
        'Cette demande a évolué',
        "Le statut de la rencontre a changé. Retrouvez-la dans Rendez-vous.",
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace(
                current.status === 'confirmed'
                  ? `/meeting/confirm/${current.id}`
                  : '/(tabs)/dates',
              ),
          },
        ],
      )
      setSubmitting(false)
      return
    }

    // V1 locale : pas d'aller-retour serveur. On simule l'acceptation
    // immédiate du matchmaker en passant le meeting en `confirmed`,
    // verrouillé sur le 1er créneau choisi et un lieu mock.
    const confirmedSlot = selected[0]
    const venueId = 'cafe-nuances'
    const patch = {
      status: 'confirmed' as const,
      selectedSlots: selected,
      confirmedSlot,
      venueId,
    }

    try {
      if (!stored) {
        // Promote a seed mock into local storage with the patched fields.
        await saveMeeting({ ...meeting, ...patch })
      } else {
        await updateMeeting(meeting.id, patch)
      }
      router.replace(`/meeting/confirm/${meeting.id}`)
    } catch (err) {
      console.warn('[kolmi] schedule submit failed', err)
      Alert.alert(
        'Confirmation impossible',
        'Une erreur est survenue. Vos disponibilités n\'ont pas été enregistrées. Réessayez dans un instant.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: kolmiColors.bg }}>
      <GrainOverlay />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View
          style={{
            paddingHorizontal: kolmiPaddingX,
            paddingTop: kolmiSpace.xs,
            paddingBottom: kolmiSpace.sm,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ paddingVertical: 4 }}
          >
            <Svg width={10} height={18} viewBox="0 0 10 18" fill="none">
              <Path
                d="M9 1L1 9L9 17"
                stroke={kolmiColors.text}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {!loaded && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                fontFamily: kolmiFonts.serifItalic,
                fontSize: 16,
                color: kolmiColors.textMuted,
              }}
            >
              Chargement…
            </Text>
          </View>
        )}

        {loaded && !meeting && (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: kolmiPaddingX,
            }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.serifItalic,
                fontSize: 16,
                color: kolmiColors.textMuted,
              }}
            >
              Rendez-vous introuvable.
            </Text>
          </View>
        )}

        {loaded && meeting && (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: kolmiPaddingX,
              paddingBottom: kolmiSpace.xxxl,
              gap: kolmiSpace.lg,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: kolmiSpace.xs }}>
              <Text
                style={{
                  fontFamily: kolmiFonts.uiSemiBold,
                  fontSize: 11,
                  color: kolmiColors.accent,
                  textTransform: 'uppercase',
                  letterSpacing: 1.6,
                }}
              >
                Vos disponibilités
              </Text>
              <Text
                style={{
                  fontFamily: kolmiFonts.serif,
                  fontSize: 32,
                  color: kolmiColors.text,
                  lineHeight: 38,
                  letterSpacing: -0.4,
                }}
              >
                {profile
                  ? `Quand voulez-vous voir ${profile.firstName} ?`
                  : 'Choisissez vos créneaux'}
              </Text>
              <Text
                style={{
                  fontFamily: kolmiFonts.serifItalic,
                  fontSize: 16,
                  color: kolmiColors.textBody,
                  lineHeight: 22,
                }}
              >
                Choisissez {MIN_SLOTS} à {MAX_SLOTS} créneaux. Le matchmaker confirmera celui qui marche pour vous deux.
              </Text>
            </View>

            <View style={{ gap: kolmiSpace.sm }}>
              {SLOT_OPTIONS.map((slot) => (
                <SlotButton
                  key={slot}
                  label={slot}
                  isSelected={selected.includes(slot)}
                  onPress={() => toggle(slot)}
                />
              ))}
            </View>

            <Text
              style={{
                fontFamily: kolmiFonts.uiMedium,
                fontSize: 13,
                color: canSubmit ? kolmiColors.accent : kolmiColors.textSecondary,
                textAlign: 'center',
              }}
            >
              {canSubmit
                ? `${selected.length} / ${MAX_SLOTS} sélectionnés`
                : `Encore ${remainingToMin} créneau${remainingToMin > 1 ? 'x' : ''} à choisir`}
            </Text>

            <TouchableOpacity
              onPress={onSubmit}
              activeOpacity={0.85}
              disabled={!canSubmit || submitting}
              style={{
                marginTop: kolmiSpace.sm,
                height: 56,
                borderRadius: kolmiRadius.pill,
                backgroundColor: canSubmit ? kolmiColors.accent : kolmiColors.surfaceSoft,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  fontFamily: kolmiFonts.uiSemiBold,
                  fontSize: 16,
                  color: canSubmit ? kolmiColors.white : kolmiColors.textMuted,
                  letterSpacing: 0.2,
                }}
              >
                {submitting ? 'Envoi…' : 'Envoyer mes disponibilités'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  )
}

type SlotButtonProps = {
  label: string
  isSelected: boolean
  onPress: () => void
}

function SlotButton({ label, isSelected, onPress }: SlotButtonProps) {
  const progress = useSharedValue(isSelected ? 1 : 0)
  const scale = useSharedValue(1)
  const isFirstRender = useRef(true)

  useEffect(() => {
    progress.value = withTiming(isSelected ? 1 : 0, {
      duration: 220,
      easing: kolmiMotion.easing.soft,
    })
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    scale.value = withSequence(
      withTiming(0.97, { duration: 90, easing: kolmiMotion.easing.snappy }),
      withTiming(1, { duration: 220, easing: kolmiMotion.easing.soft }),
    )
  }, [isSelected, progress, scale])

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [kolmiColors.outline, kolmiColors.accent],
    ),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [SLOT_BG_OFF, SLOT_BG_ON],
    ),
    borderWidth: 1 + progress.value * 0.5,
    transform: [{ scale: scale.value }],
  }))

  const checkboxStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [kolmiColors.outline, kolmiColors.accent],
    ),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(139,26,26,0)', kolmiColors.accent],
    ),
  }))

  const checkmarkStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }))

  return (
    <Animated.View
      style={[
        {
          borderRadius: kolmiRadius.lg,
        },
        containerStyle,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{
          paddingVertical: kolmiSpace.md,
          paddingHorizontal: kolmiSpace.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontFamily: kolmiFonts.uiMedium,
            fontSize: 16,
            color: kolmiColors.text,
          }}
        >
          {label}
        </Text>
        <Animated.View
          style={[
            {
              width: 22,
              height: 22,
              borderRadius: 11,
              borderWidth: 1.5,
              alignItems: 'center',
              justifyContent: 'center',
            },
            checkboxStyle,
          ]}
        >
          <AnimatedSvg
            width={11}
            height={9}
            viewBox="0 0 11 9"
            fill="none"
            style={checkmarkStyle}
          >
            <Path
              d="M1 4.5L4 7.5L10 1.5"
              stroke={kolmiColors.white}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </AnimatedSvg>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  )
}
