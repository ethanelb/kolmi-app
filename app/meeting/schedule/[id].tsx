import React, { useEffect, useMemo, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { mockMeetings } from '@/data/mockMeetings'
import { getSelectedProfileById } from '@/data/mockSelectedProfiles'
import { getMeetingById, saveMeeting, updateMeeting } from '@/lib/kolmi/storage'
import { KOLMI_DEMO_MODE } from '@/constants/kolmiConfig'
import type { Meeting } from '@/lib/kolmi/types'

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
      const fallback = stored ?? seedFallback ?? null
      if (!cancelled) {
        setMeeting(fallback)
        setSelected(fallback?.selectedSlots ?? [])
        setLoaded(true)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const profile = useMemo(
    () => (meeting ? getSelectedProfileById(meeting.profileId) : null),
    [meeting],
  )

  const toggle = (slot: string) => {
    Haptics.selectionAsync().catch(() => {})
    setSelected((prev) => {
      if (prev.includes(slot)) return prev.filter((s) => s !== slot)
      if (prev.length >= MAX_SLOTS) return prev
      return [...prev, slot]
    })
  }

  const canSubmit = selected.length >= MIN_SLOTS

  const onSubmit = async () => {
    if (!meeting || submitting || !canSubmit) return
    setSubmitting(true)

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
      const stored = await getMeetingById(meeting.id)
      if (!stored) {
        // Promote a seed mock into local storage with the patched fields.
        await saveMeeting({ ...meeting, ...patch })
      } else {
        await updateMeeting(meeting.id, patch)
      }
      router.replace(`/meeting/confirm/${meeting.id}`)
    } catch (err) {
      console.warn('[kolmi] schedule submit failed', err)
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
              {SLOT_OPTIONS.map((slot) => {
                const isSelected = selected.includes(slot)
                return (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => toggle(slot)}
                    activeOpacity={0.85}
                    style={{
                      paddingVertical: kolmiSpace.md,
                      paddingHorizontal: kolmiSpace.md,
                      borderRadius: kolmiRadius.lg,
                      borderWidth: isSelected ? 1.5 : 1,
                      borderColor: isSelected ? kolmiColors.accent : kolmiColors.outline,
                      backgroundColor: isSelected ? '#FBEFEF' : '#FAF8F5',
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
                      {slot}
                    </Text>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 1.5,
                        borderColor: isSelected ? kolmiColors.accent : kolmiColors.outline,
                        backgroundColor: isSelected ? kolmiColors.accent : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && (
                        <Svg width={11} height={9} viewBox="0 0 11 9" fill="none">
                          <Path
                            d="M1 4.5L4 7.5L10 1.5"
                            stroke={kolmiColors.white}
                            strokeWidth={1.8}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Text
              style={{
                fontFamily: kolmiFonts.uiMedium,
                fontSize: 13,
                color: kolmiColors.textSecondary,
                textAlign: 'center',
              }}
            >
              {selected.length} / {MAX_SLOTS} sélectionnés
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
