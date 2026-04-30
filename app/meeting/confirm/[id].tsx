import React, { useEffect, useMemo, useState } from 'react'
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { mockMeetings } from '@/data/mockMeetings'
import { mockVenues, getVenueById } from '@/data/mockVenues'
import { getSelectedProfileById } from '@/data/mockSelectedProfiles'
import { getMeetingById } from '@/lib/kolmi/storage'
import { KOLMI_DEMO_MODE } from '@/constants/kolmiConfig'
import type { Meeting } from '@/lib/kolmi/types'

export default function MeetingConfirmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loaded, setLoaded] = useState(false)

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

  const venue = useMemo(() => {
    if (!meeting?.venueId) return mockVenues[0] ?? null
    return getVenueById(meeting.venueId) ?? mockVenues[0] ?? null
  }, [meeting])

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

        {loaded && (!meeting || !profile) && (
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

        {loaded && meeting && profile && (
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
                Rendez-vous confirmé
              </Text>
              <Text
                style={{
                  fontFamily: kolmiFonts.serif,
                  fontSize: 36,
                  color: kolmiColors.text,
                  lineHeight: 42,
                  letterSpacing: -0.4,
                }}
              >
                {profile.firstName}, {profile.age}
              </Text>
              {meeting.confirmedSlot && (
                <Text
                  style={{
                    fontFamily: kolmiFonts.serifItalic,
                    fontSize: 18,
                    color: kolmiColors.text,
                    lineHeight: 24,
                  }}
                >
                  {meeting.confirmedSlot}
                </Text>
              )}
            </View>

            {profile.photoUrl && (
              <Image
                source={{ uri: profile.photoUrl }}
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: kolmiRadius.lg,
                  backgroundColor: kolmiColors.surfaceSoft,
                }}
              />
            )}

            {venue && (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(22,19,15,0.12)',
                  backgroundColor: '#FAF8F5',
                  borderRadius: kolmiRadius.lg,
                  padding: kolmiSpace.md,
                  gap: kolmiSpace.xs,
                }}
              >
                <Text
                  style={{
                    fontFamily: kolmiFonts.uiSemiBold,
                    fontSize: 11,
                    color: kolmiColors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 1.6,
                  }}
                >
                  Lieu choisi
                </Text>
                <Text
                  style={{
                    fontFamily: kolmiFonts.serif,
                    fontSize: 24,
                    color: kolmiColors.text,
                    lineHeight: 30,
                    letterSpacing: -0.2,
                  }}
                >
                  {venue.name}
                </Text>
                <Text
                  style={{
                    fontFamily: kolmiFonts.uiMedium,
                    fontSize: 13,
                    color: kolmiColors.textSecondary,
                  }}
                >
                  {venue.address} · {venue.city}
                </Text>
                <Text
                  style={{
                    marginTop: kolmiSpace.xs,
                    fontFamily: kolmiFonts.serifItalic,
                    fontSize: 15,
                    color: kolmiColors.text,
                    lineHeight: 22,
                  }}
                >
                  {venue.ambiance}
                </Text>
              </View>
            )}

            {venue && (
              <View
                style={{
                  borderLeftWidth: 2,
                  borderLeftColor: kolmiColors.accent,
                  paddingLeft: kolmiSpace.md,
                  paddingVertical: kolmiSpace.xs,
                  gap: kolmiSpace.xs,
                }}
              >
                <Text
                  style={{
                    fontFamily: kolmiFonts.uiSemiBold,
                    fontSize: 11,
                    color: kolmiColors.accent,
                    textTransform: 'uppercase',
                    letterSpacing: 1.6,
                  }}
                >
                  Mot du matchmaker
                </Text>
                <Text
                  style={{
                    fontFamily: kolmiFonts.serifItalic,
                    fontSize: 15,
                    color: kolmiColors.text,
                    lineHeight: 22,
                  }}
                >
                  « {venue.matchmakerNote} »
                </Text>
              </View>
            )}

            <View
              style={{
                borderTopWidth: 1,
                borderColor: kolmiColors.outline,
                paddingTop: kolmiSpace.md,
                gap: kolmiSpace.xs,
              }}
            >
              <Text
                style={{
                  fontFamily: kolmiFonts.uiSemiBold,
                  fontSize: 11,
                  color: kolmiColors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 1.6,
                }}
              >
                À savoir
              </Text>
              <Text
                style={{
                  fontFamily: kolmiFonts.serifItalic,
                  fontSize: 15,
                  color: kolmiColors.textBody,
                  lineHeight: 22,
                }}
              >
                Présentez-vous 5 minutes avant. En cas d&apos;empêchement, prévenez-nous au moins 24h à l&apos;avance.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.85}
              style={{
                marginTop: kolmiSpace.sm,
                height: 56,
                borderRadius: kolmiRadius.pill,
                backgroundColor: kolmiColors.text,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: kolmiFonts.uiSemiBold,
                  fontSize: 16,
                  color: '#FAF8F5',
                  letterSpacing: 0.2,
                }}
              >
                Retour
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  )
}
