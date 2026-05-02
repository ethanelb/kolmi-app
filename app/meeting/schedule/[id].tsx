import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import SwipeToConfirm from '@/components/kolmi/SwipeToConfirm'
import { mockMeetings } from '@/data/mockMeetings'
import { getSelectedProfileById } from '@/data/mockSelectedProfiles'
import { venuesByCity } from '@/data/mockVenues'
import type { Venue } from '@/lib/kolmi/types'
import { getMeetingById, saveMeeting, updateMeeting } from '@/lib/kolmi/storage'
import { simulateOtherSlotChoice } from '@/lib/kolmi/mockBackend'
import { KOLMI_DEMO_MODE } from '@/constants/kolmiConfig'
import type { Meeting } from '@/lib/kolmi/types'
import { select } from '@/lib/kolmi/haptics'

const TIMES = ['19h00', '19h30', '20h00', '20h30', '21h00'] as const

const FRENCH_DAYS = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
] as const

const FRENCH_MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
] as const

// 7 prochains jours à partir de demain.
function nextDays(): { iso: string; short: string; long: string }[] {
  const days: { iso: string; short: string; long: string }[] = []
  for (let i = 1; i <= 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const day = FRENCH_DAYS[d.getDay()]
    const dateNum = d.getDate()
    const month = FRENCH_MONTHS[d.getMonth()]
    days.push({
      iso: d.toISOString().slice(0, 10),
      short: `${day.charAt(0).toUpperCase()}${day.slice(1, 3)} ${dateNum}`,
      long: `${day.charAt(0).toUpperCase()}${day.slice(1)} ${dateNum} ${month}`,
    })
  }
  return days
}

type SlotDraft = {
  dayIso?: string
  dayLong?: string
  time?: string
  venueId?: string
  venueName?: string
}

const EMPTY_SLOT: SlotDraft = {}

function formatSlot(s: SlotDraft): string | null {
  if (!s.dayLong || !s.time || !s.venueName) return null
  return `${s.dayLong} · ${s.time} · ${s.venueName}`
}

const ROMAN = ['I.', 'II.', 'III.'] as const
const SLOT_LABELS = ['Premier choix', 'Deuxième', 'Troisième'] as const

export default function MeetingScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [drafts, setDrafts] = useState<SlotDraft[]>([
    EMPTY_SLOT,
    EMPTY_SLOT,
    EMPTY_SLOT,
  ])
  const [activeSlot, setActiveSlot] = useState<number>(0)

  const days = useMemo(() => nextDays(), [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const stored = id ? await getMeetingById(id) : null
      const seedFallback = KOLMI_DEMO_MODE
        ? mockMeetings.find((m) => m.id === id)
        : undefined
      const found = stored ?? seedFallback ?? null
      if (cancelled) return

      if (found) {
        if (found.status === 'confirmed') {
          router.replace(`/meeting/confirm/${found.id}`)
          return
        }
        if (found.status !== 'accepted_waiting_slots') {
          router.replace('/(tabs)/dates')
          return
        }
      }

      setMeeting(found)
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

  const venues: Venue[] = useMemo(
    () => (profile ? venuesByCity(profile.city) : []),
    [profile],
  )

  const updateSlot = useCallback(
    (idx: number, patch: Partial<SlotDraft>) => {
      select()
      setDrafts((prev) => {
        const next = [...prev]
        next[idx] = { ...next[idx], ...patch }
        return next
      })
    },
    [],
  )

  const allSlotsValid = drafts.every((d) => formatSlot(d) !== null)
  const filledCount = drafts.filter((d) => formatSlot(d) !== null).length

  const onSubmit = useCallback(async () => {
    if (!meeting || submitting || !allSlotsValid) return
    setSubmitting(true)

    let stored: Meeting | null
    try {
      stored = await getMeetingById(meeting.id)
    } catch (err) {
      console.warn('[kolmi] schedule re-read failed', err)
      Alert.alert('Action impossible', 'Une erreur est survenue. Réessayez dans un instant.')
      setSubmitting(false)
      return
    }
    const current = stored ?? meeting
    if (current.status !== 'accepted_waiting_slots') {
      Alert.alert(
        'Cette demande a évolué',
        'Le statut de la rencontre a changé. Retrouvez-la dans Rendez-vous.',
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

    // Sérialise les slots en strings éditoriales pour selectedSlots.
    const slotStrings = drafts
      .map((d) => formatSlot(d))
      .filter((s): s is string => s !== null)

    const patch = {
      status: 'slots_submitted' as const,
      selectedSlots: slotStrings,
    }

    try {
      if (!stored) {
        await saveMeeting({ ...meeting, ...patch })
      } else {
        await updateMeeting(meeting.id, patch)
      }
      // Mock backend : l'autre choisit un slot après 30 s à 3 min.
      simulateOtherSlotChoice(meeting.id)
      router.replace('/(tabs)/dates')
    } catch (err) {
      console.warn('[kolmi] schedule submit failed', err)
      Alert.alert(
        'Envoi impossible',
        "Une erreur est survenue. Vos disponibilités n'ont pas été enregistrées. Réessayez dans un instant.",
      )
      setSubmitting(false)
    }
  }, [meeting, submitting, allSlotsValid, drafts, router])

  if (!loaded) {
    return (
      <View style={styles.root}>
        <GrainOverlay />
        <SafeAreaView style={styles.centered}>
          <Text style={styles.placeholderText}>Chargement…</Text>
        </SafeAreaView>
      </View>
    )
  }

  if (!meeting || !profile) {
    return (
      <View style={styles.root}>
        <GrainOverlay />
        <SafeAreaView style={styles.centered}>
          <Text style={styles.placeholderText}>Rendez-vous introuvable.</Text>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
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
          <View style={styles.headerCenter}>
            <Text style={styles.headerKicker}>Proposer vos créneaux</Text>
            <Text style={styles.headerName}>{profile.firstName}</Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.Text
            entering={FadeIn.duration(420)}
            style={styles.preface}
          >
            {profile.firstName} accepte. Choisissez trois moments — {profile.firstName === 'Léa' || profile.firstName.endsWith('e') ? 'elle' : 'iel'} en validera un.
          </Animated.Text>

          {drafts.map((draft, idx) => {
            const isActive = activeSlot === idx
            const slotString = formatSlot(draft)
            return (
              <Animated.View
                key={idx}
                entering={FadeInDown.delay(280 + idx * 130).duration(500)}
                style={[
                  styles.slotBlock,
                  isActive && styles.slotBlockActive,
                ]}
              >
                <TouchableOpacity
                  onPress={() => setActiveSlot(idx)}
                  activeOpacity={0.85}
                  style={styles.slotHeader}
                >
                  <Text style={styles.slotRoman}>{ROMAN[idx]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.slotLabel}>{SLOT_LABELS[idx]}</Text>
                    {slotString ? (
                      <Text style={styles.slotSummary}>{slotString}</Text>
                    ) : (
                      <Text style={styles.slotSummaryEmpty}>
                        Choisissez un jour, une heure, un lieu.
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                {isActive && (
                  <View style={styles.editorWrap}>
                    {/* Sélecteur de jour */}
                    <Text style={styles.editorLabel}>Jour</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipsRow}
                    >
                      {days.map((d) => {
                        const on = draft.dayIso === d.iso
                        return (
                          <TouchableOpacity
                            key={d.iso}
                            onPress={() =>
                              updateSlot(idx, { dayIso: d.iso, dayLong: d.long })
                            }
                            activeOpacity={0.85}
                            style={[styles.chip, on && styles.chipOn]}
                          >
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>
                              {d.short}
                            </Text>
                          </TouchableOpacity>
                        )
                      })}
                    </ScrollView>

                    {/* Sélecteur d'heure */}
                    <Text style={[styles.editorLabel, { marginTop: kolmiSpace.md }]}>
                      Heure
                    </Text>
                    <View style={styles.chipsWrap}>
                      {TIMES.map((t) => {
                        const on = draft.time === t
                        return (
                          <TouchableOpacity
                            key={t}
                            onPress={() => updateSlot(idx, { time: t })}
                            activeOpacity={0.85}
                            style={[styles.chip, on && styles.chipOn]}
                          >
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>{t}</Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>

                    {/* Sélecteur de lieu */}
                    <Text style={[styles.editorLabel, { marginTop: kolmiSpace.md }]}>
                      Lieu
                    </Text>
                    <View style={styles.venuesList}>
                      {venues.map((v) => {
                        const on = draft.venueId === v.id
                        return (
                          <TouchableOpacity
                            key={v.id}
                            onPress={() =>
                              updateSlot(idx, { venueId: v.id, venueName: v.name })
                            }
                            activeOpacity={0.85}
                            style={[styles.venueRow, on && styles.venueRowOn]}
                          >
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.venueName,
                                  on && styles.venueNameOn,
                                ]}
                              >
                                {v.name}
                              </Text>
                              <Text style={styles.venueSub}>
                                {v.neighborhood ?? v.city}
                                {v.type ? ` · ${v.type}` : ''}
                              </Text>
                            </View>
                            {on && <View style={styles.venueDot} />}
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  </View>
                )}
              </Animated.View>
            )
          })}

          <Text style={styles.helper}>
            {filledCount === 3
              ? 'Vos trois créneaux sont prêts.'
              : `${filledCount}/3 créneaux complétés`}
          </Text>
        </ScrollView>

        <Animated.View
          entering={FadeInDown.delay(900).duration(500)}
          style={styles.footer}
        >
          <SwipeToConfirm
            label={submitting ? 'Envoi…' : 'Glisser pour envoyer'}
            confirmedLabel="Envoyé."
            onConfirm={onSubmit}
            disabled={submitting || !allSlotsValid}
          />
        </Animated.View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: kolmiPaddingX,
  },
  placeholderText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    color: kolmiColors.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.xs,
    paddingBottom: kolmiSpace.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerKicker: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textMuted,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
  headerName: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 14,
    color: kolmiColors.accent,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.md,
    paddingBottom: kolmiSpace.xxl,
    gap: kolmiSpace.md,
  },
  preface: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 17,
    color: kolmiColors.textBody,
    lineHeight: 25,
    marginBottom: kolmiSpace.sm,
  },
  slotBlock: {
    backgroundColor: '#FAF8F5',
    borderRadius: kolmiRadius.lg,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    overflow: 'hidden',
  },
  slotBlockActive: {
    borderColor: 'rgba(139,26,26,0.5)',
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: kolmiSpace.md,
    padding: kolmiSpace.md,
  },
  slotRoman: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    color: kolmiColors.accent,
    width: 30,
    letterSpacing: 0.4,
    paddingTop: 2,
  },
  slotLabel: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textMuted,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  slotSummary: {
    fontFamily: kolmiFonts.serif,
    fontSize: 17,
    lineHeight: 22,
    color: kolmiColors.text,
    letterSpacing: -0.2,
  },
  slotSummaryEmpty: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 15,
    lineHeight: 22,
    color: kolmiColors.textMuted,
  },
  editorWrap: {
    paddingHorizontal: kolmiSpace.md,
    paddingBottom: kolmiSpace.md,
    paddingTop: 0,
    borderTopWidth: 0.6,
    borderColor: 'rgba(26,26,26,0.12)',
    marginTop: 0,
  },
  editorLabel: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textMuted,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    marginTop: kolmiSpace.md,
    marginBottom: kolmiSpace.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: kolmiSpace.xs,
    paddingVertical: 4,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: kolmiSpace.xs,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: kolmiSpace.md,
    paddingVertical: 8,
    borderRadius: kolmiRadius.pill,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    backgroundColor: '#FFFDFA',
  },
  chipOn: {
    backgroundColor: kolmiColors.accent,
    borderColor: kolmiColors.accent,
  },
  chipText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 13,
    color: kolmiColors.text,
    letterSpacing: 0.2,
  },
  chipTextOn: {
    color: kolmiColors.white,
    fontFamily: kolmiFonts.uiSemiBold,
  },
  venuesList: {
    gap: kolmiSpace.xs,
    marginTop: kolmiSpace.xs,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: kolmiSpace.sm,
    paddingHorizontal: kolmiSpace.sm,
    borderRadius: kolmiRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  venueRowOn: {
    borderColor: 'rgba(139,26,26,0.4)',
    backgroundColor: 'rgba(139,26,26,0.05)',
  },
  venueName: {
    fontFamily: kolmiFonts.serif,
    fontSize: 16,
    color: kolmiColors.text,
    letterSpacing: -0.2,
  },
  venueNameOn: {
    color: kolmiColors.accent,
  },
  venueSub: {
    fontFamily: kolmiFonts.ui,
    fontSize: 12,
    color: kolmiColors.textBody,
    marginTop: 2,
  },
  venueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: kolmiColors.accent,
    marginLeft: kolmiSpace.sm,
  },
  helper: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 14,
    color: kolmiColors.textMuted,
    textAlign: 'center',
    marginTop: kolmiSpace.sm,
  },
  footer: {
    paddingHorizontal: kolmiPaddingX,
    paddingBottom: kolmiSpace.lg,
    paddingTop: kolmiSpace.sm,
  },
})
