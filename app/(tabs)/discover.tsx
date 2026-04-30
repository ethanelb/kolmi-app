import React, { useEffect, useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, Image } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  kolmiColors,
  kolmiSpace,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import ProfilePhotoPlaceholder from '@/components/kolmi/ProfilePhotoPlaceholder'
import SkeletonBlock from '@/components/kolmi/SkeletonBlock'
import { mockSelectedProfiles, type SelectedProfile } from '@/data/mockSelectedProfiles'
import { getPassedProfiles } from '@/lib/kolmi/storage'
import { kolmiMotion, staggerDelay } from '@/lib/kolmi/motion'
import { tapMedium } from '@/lib/kolmi/haptics'

type Section = {
  id: string
  title: string
  profiles: SelectedProfile[]
}

export default function DiscoverScreen() {
  const router = useRouter()
  const [passed, setPassed] = useState<string[]>([])
  const [analyzed, setAnalyzed] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refresh = React.useCallback(() => {
    getPassedProfiles().then((next) => {
      setPassed(next)
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useFocusEffect(
    React.useCallback(() => {
      refresh()
    }, [refresh])
  )

  // Sections mutuellement exclusives — un profil n'apparaît jamais
  // dans plus d'une section.
  const available = mockSelectedProfiles.filter((p) => !passed.includes(p.id))
  const featured = available.filter((p) => p.isFeatured)
  const compat = available.filter((p) => !p.isFeatured && p.compatibility >= 85)
  const placedIds = new Set([...featured, ...compat].map((p) => p.id))
  const week = available.filter((p) => !placedIds.has(p.id))

  const sections: Section[] = [
    { id: 'featured', title: 'Profils mis en avant', profiles: featured },
    { id: 'compat', title: 'Compatibles avec votre Maison', profiles: compat },
    { id: 'week', title: 'Disponibles cette semaine', profiles: week },
  ]

  const allEmpty = sections.every((s) => s.profiles.length === 0)

  function handleAnalyze(id: string) {
    tapMedium()
    setAnalyzed((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

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
              Découvrir
            </Text>
            <Text
              style={{
                fontFamily: kolmiFonts.serifItalic,
                fontSize: 16,
                color: kolmiColors.textBody,
                lineHeight: 22,
              }}
            >
              Des profils mis en avant que votre matchmaker peut analyser pour vous.
            </Text>
          </View>

          {isLoading && (
            <>
              <DiscoverSectionSkeleton title="Profils mis en avant" cardCount={2} index={0} />
              <DiscoverSectionSkeleton title="Compatibles avec votre Maison" cardCount={2} index={1} />
              <DiscoverSectionSkeleton title="Disponibles cette semaine" cardCount={1} index={2} />
            </>
          )}

          {!isLoading && allEmpty && (
            <View
              style={{
                marginTop: kolmiSpace.lg,
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
                Aucun profil mis en avant pour le moment.
              </Text>
              <Text
                style={{
                  fontFamily: kolmiFonts.serifItalic,
                  fontSize: 15,
                  color: kolmiColors.textBody,
                  lineHeight: 22,
                }}
              >
                Revenez plus tard — votre matchmaker prépare de nouvelles découvertes.
              </Text>
            </View>
          )}

          {!isLoading && !allEmpty && sections.map((section, sIdx) => (
            <Animated.View
              key={section.id}
              entering={FadeInDown.delay(staggerDelay(sIdx, 120))
                .duration(kolmiMotion.duration.lg)
                .easing(kolmiMotion.easing.soft)}
              style={{ gap: kolmiSpace.sm }}
            >
              <Text
                numberOfLines={2}
                style={{
                  fontFamily: kolmiFonts.uiSemiBold,
                  fontSize: 11,
                  color: kolmiColors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 1.6,
                  flexShrink: 1,
                }}
              >
                {section.title}
              </Text>
              {section.profiles.length === 0 ? (
                <Text
                  style={{
                    fontFamily: kolmiFonts.serifItalic,
                    fontSize: 14,
                    color: kolmiColors.textMuted,
                    paddingVertical: kolmiSpace.sm,
                  }}
                >
                  Aucun profil dans cette section pour l&apos;instant.
                </Text>
              ) : (
                <View style={{ gap: kolmiSpace.md }}>
                  {section.profiles.map((profile, i) => (
                    <Animated.View
                      key={`${section.id}-${profile.id}`}
                      entering={FadeInDown.delay(staggerDelay(i, 60))
                        .duration(kolmiMotion.duration.md)
                        .easing(kolmiMotion.easing.soft)}
                    >
                      <DiscoverCard
                        profile={profile}
                        analyzed={analyzed.has(profile.id)}
                        onAnalyze={() => handleAnalyze(profile.id)}
                        onView={() => router.push(`/matches/${profile.id}`)}
                      />
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function DiscoverCard({
  profile,
  analyzed,
  onAnalyze,
  onView,
}: {
  profile: SelectedProfile
  analyzed: boolean
  onAnalyze: () => void
  onView: () => void
}) {
  return (
    <View
      style={{
        borderRadius: kolmiRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(22,19,15,0.12)',
        backgroundColor: '#FAF8F5',
        overflow: 'hidden',
      }}
    >
      {profile.photoUrl ? (
        <Image
          source={{ uri: profile.photoUrl }}
          style={{ width: '100%', height: 220, backgroundColor: kolmiColors.surfaceSoft }}
        />
      ) : (
        <ProfilePhotoPlaceholder
          height={220}
          initial={profile.firstName}
          profileId={profile.id}
        />
      )}
      <View style={{ padding: kolmiSpace.md, gap: kolmiSpace.xs }}>
        <Text
          style={{
            fontFamily: kolmiFonts.serif,
            fontSize: 22,
            color: kolmiColors.text,
            letterSpacing: -0.3,
          }}
        >
          {profile.firstName}, {profile.age}
        </Text>
        <Text
          style={{
            fontFamily: kolmiFonts.uiMedium,
            fontSize: 12,
            color: kolmiColors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
          }}
        >
          {profile.dnaLabel} · {profile.city}
        </Text>
        <Text
          style={{
            fontFamily: kolmiFonts.serifItalic,
            fontSize: 14,
            color: kolmiColors.textBody,
            lineHeight: 20,
            marginTop: 4,
          }}
        >
          « {profile.reason} »
        </Text>

        {analyzed && (
          <Text
            style={{
              fontFamily: kolmiFonts.serifItalic,
              fontSize: 13,
              color: kolmiColors.accent,
              lineHeight: 19,
              marginTop: 6,
            }}
          >
            Votre matchmaker pense que ce profil mérite une rencontre.
          </Text>
        )}

        <View style={{ flexDirection: 'row', gap: kolmiSpace.xs, marginTop: kolmiSpace.sm }}>
          <TouchableOpacity
            onPress={analyzed ? onView : onAnalyze}
            activeOpacity={0.85}
            style={{
              flex: 1,
              height: 44,
              borderRadius: kolmiRadius.pill,
              backgroundColor: kolmiColors.text,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 14,
                color: '#FAF8F5',
              }}
            >
              {analyzed ? 'Voir le profil' : 'Demander l\'analyse'}
            </Text>
          </TouchableOpacity>
          {!analyzed && (
            <TouchableOpacity
              onPress={onView}
              activeOpacity={0.7}
              style={{
                flex: 1,
                height: 44,
                borderRadius: kolmiRadius.pill,
                borderWidth: 1,
                borderColor: kolmiColors.outline,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: kolmiFonts.uiMedium,
                  fontSize: 14,
                  color: kolmiColors.text,
                }}
              >
                Voir le profil
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

function DiscoverCardSkeleton() {
  return (
    <View
      style={{
        borderRadius: kolmiRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(22,19,15,0.12)',
        backgroundColor: '#FAF8F5',
        overflow: 'hidden',
      }}
    >
      <SkeletonBlock width="100%" height={220} radius={0} />
      <View style={{ padding: kolmiSpace.md, gap: kolmiSpace.xs }}>
        <SkeletonBlock width="55%" height={24} radius={6} />
        <SkeletonBlock width="75%" height={12} radius={4} />
        <SkeletonBlock width="100%" height={14} radius={4} />
        <SkeletonBlock width="85%" height={14} radius={4} />
        <View style={{ flexDirection: 'row', gap: kolmiSpace.xs, marginTop: kolmiSpace.sm }}>
          <SkeletonBlock width="48%" height={44} radius={kolmiRadius.pill} />
          <SkeletonBlock width="48%" height={44} radius={kolmiRadius.pill} />
        </View>
      </View>
    </View>
  )
}

function DiscoverSectionSkeleton({
  title,
  cardCount,
  index = 0,
}: {
  title: string
  cardCount: number
  index?: number
}) {
  return (
    <Animated.View
      entering={FadeIn.delay(staggerDelay(index, 80))
        .duration(kolmiMotion.duration.md)
        .easing(kolmiMotion.easing.soft)}
      style={{ gap: kolmiSpace.sm }}
    >
      <Text
        numberOfLines={2}
        style={{
          fontFamily: kolmiFonts.uiSemiBold,
          fontSize: 11,
          color: kolmiColors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1.6,
          flexShrink: 1,
        }}
      >
        {title}
      </Text>
      <View style={{ gap: kolmiSpace.md }}>
        {Array.from({ length: cardCount }).map((_, i) => (
          <DiscoverCardSkeleton key={`${title}-skel-${i}`} />
        ))}
      </View>
    </Animated.View>
  )
}
