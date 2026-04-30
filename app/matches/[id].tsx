import React, { useState } from 'react'
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated'
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
import ProfilePhotoPlaceholder from '@/components/kolmi/ProfilePhotoPlaceholder'
import { getSelectedProfileById } from '@/data/mockSelectedProfiles'
import { passProfile } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'
import { kolmiMotion, staggerDelay } from '@/lib/kolmi/motion'

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  // setReloadTick re-runs the lookup after a simulated network retry.
  const [, setReloadTick] = useState(0)
  const profile = getSelectedProfileById(id ?? '')

  if (!profile) {
    return (
      <ProfileUnavailable
        onRetry={() => setReloadTick(t => t + 1)}
        onBackToList={() => router.replace('/(tabs)')}
      />
    )
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

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: kolmiPaddingX,
            paddingBottom: kolmiSpace.xxxl,
            gap: kolmiSpace.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          {profile.photoUrl ? (
            <Animated.Image
              entering={FadeIn.delay(40)
                .duration(kolmiMotion.duration.xl)
                .easing(kolmiMotion.easing.expoOut)}
              source={{ uri: profile.photoUrl }}
              style={{
                width: '100%',
                height: 380,
                borderRadius: kolmiRadius.lg,
                backgroundColor: kolmiColors.surfaceSoft,
              }}
            />
          ) : (
            <Animated.View
              entering={FadeIn.delay(40)
                .duration(kolmiMotion.duration.xl)
                .easing(kolmiMotion.easing.expoOut)}
            >
              <ProfilePhotoPlaceholder
                height={380}
                initial={profile.firstName}
                borderRadius={kolmiRadius.lg}
              />
            </Animated.View>
          )}

          <Animated.View
            entering={FadeInUp.delay(staggerDelay(0, 120))
              .duration(kolmiMotion.duration.lg)
              .easing(kolmiMotion.easing.soft)}
            style={{ gap: kolmiSpace.xs }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.serif,
                fontSize: 36,
                color: kolmiColors.text,
                letterSpacing: -0.4,
              }}
            >
              {profile.firstName}, {profile.age}
            </Text>
            <Text
              style={{
                fontFamily: kolmiFonts.uiMedium,
                fontSize: 13,
                color: kolmiColors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
              }}
            >
              {profile.dnaLabel} · {profile.city}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(staggerDelay(1, 120))
              .duration(kolmiMotion.duration.lg)
              .easing(kolmiMotion.easing.soft)}
            style={{
              borderWidth: 1,
              borderColor: kolmiColors.accent + '40',
              backgroundColor: kolmiColors.bgDeep,
              borderRadius: kolmiRadius.lg,
              padding: kolmiSpace.md,
              gap: 6,
            }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 11,
                color: kolmiColors.accent,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
              }}
            >
              Compatibilité {profile.compatibility}% · Pourquoi ce profil
            </Text>
            <Text
              style={{
                fontFamily: kolmiFonts.serifItalic,
                fontSize: 16,
                color: kolmiColors.text,
                lineHeight: 23,
              }}
            >
              « {profile.reason} »
            </Text>
          </Animated.View>

          {profile.intentions && (
            <Animated.View
              entering={FadeInUp.delay(staggerDelay(2, 120))
                .duration(kolmiMotion.duration.lg)
                .easing(kolmiMotion.easing.soft)}
            >
              <DetailBlock label="Intentions" italic>
                {profile.intentions}
              </DetailBlock>
            </Animated.View>
          )}

          {profile.compatibilityPoints?.length > 0 && (
            <Animated.View
              entering={FadeInUp.delay(staggerDelay(3, 120))
                .duration(kolmiMotion.duration.lg)
                .easing(kolmiMotion.easing.soft)}
            >
              <BulletBlock label="Compatibilités" items={profile.compatibilityPoints} />
            </Animated.View>
          )}

          {profile.cautionPoints?.length > 0 && (
            <Animated.View
              entering={FadeInUp.delay(staggerDelay(4, 120))
                .duration(kolmiMotion.duration.lg)
                .easing(kolmiMotion.easing.soft)}
            >
              <BulletBlock
                label="Points d'attention"
                items={profile.cautionPoints}
                tone="muted"
              />
            </Animated.View>
          )}

          {profile.interests?.length > 0 && (
            <Animated.View
              entering={FadeInUp.delay(staggerDelay(5, 120))
                .duration(kolmiMotion.duration.lg)
                .easing(kolmiMotion.easing.soft)}
              style={{ gap: kolmiSpace.xs }}
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
                Centres d&apos;intérêt
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {profile.interests.map((interest, i) => (
                  <Animated.View
                    entering={ZoomIn.delay(staggerDelay(i, 700)).duration(kolmiMotion.duration.sm).easing(kolmiMotion.easing.soft)}
                    key={`${profile.id}-int-${i}`}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: kolmiColors.outline,
                      backgroundColor: '#FAF8F5',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: kolmiFonts.ui,
                        fontSize: 13,
                        color: kolmiColors.text,
                      }}
                    >
                      {interest}
                    </Text>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {profile.availabilityHint && (
            <Animated.View
              entering={FadeInUp.delay(staggerDelay(6, 120))
                .duration(kolmiMotion.duration.lg)
                .easing(kolmiMotion.easing.soft)}
            >
              <DetailBlock label="Disponibilité">
                {profile.availabilityHint}
              </DetailBlock>
            </Animated.View>
          )}

          <Animated.View
            entering={FadeInUp.delay(staggerDelay(7, 120))
              .duration(kolmiMotion.duration.lg)
              .easing(kolmiMotion.easing.soft)}
            style={{ gap: kolmiSpace.sm, marginTop: kolmiSpace.sm }}
          >
            <TouchableOpacity
              onPress={() => router.push(`/meeting/request/${profile.id}`)}
              activeOpacity={0.85}
              style={{
                height: 56,
                borderRadius: kolmiRadius.pill,
                backgroundColor: kolmiColors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#5A0A0A',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.18,
                shadowRadius: 14,
                elevation: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: kolmiFonts.uiSemiBold,
                  fontSize: 16,
                  color: kolmiColors.white,
                  letterSpacing: 0.2,
                }}
              >
                Demander une rencontre
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                const ok = await safePersist(() => passProfile(profile.id))
                if (!ok) return
                router.replace('/(tabs)')
              }}
              activeOpacity={0.7}
              style={{
                height: 56,
                borderRadius: kolmiRadius.pill,
                borderWidth: 1.5,
                borderColor: kolmiColors.outline,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: kolmiFonts.uiMedium,
                  fontSize: 16,
                  color: kolmiColors.text,
                }}
              >
                Pas pour moi
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function DetailBlock({
  label,
  children,
  italic,
}: {
  label: string
  children: string
  italic?: boolean
}) {
  return (
    <View style={{ gap: kolmiSpace.xs }}>
      <Text
        style={{
          fontFamily: kolmiFonts.uiSemiBold,
          fontSize: 11,
          color: kolmiColors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1.6,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: italic ? kolmiFonts.serifItalic : kolmiFonts.ui,
          fontSize: italic ? 16 : 14,
          color: kolmiColors.textBody,
          lineHeight: italic ? 23 : 21,
        }}
      >
        {children}
      </Text>
    </View>
  )
}

function ProfileUnavailable({
  onRetry,
  onBackToList,
}: {
  onRetry: () => void
  onBackToList: () => void
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'failed'>('idle')

  const handleRetry = () => {
    setStatus('loading')
    // Simulated network call — the underlying lookup is synchronous, but we
    // give the user real feedback that something is being attempted.
    setTimeout(() => {
      setStatus('failed')
      onRetry()
    }, 1200)
  }

  return (
    <View style={{ flex: 1, backgroundColor: kolmiColors.bg }}>
      <GrainOverlay />
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: kolmiPaddingX,
        }}
      >
        <Animated.View
          entering={FadeIn.duration(kolmiMotion.duration.lg).easing(kolmiMotion.easing.soft)}
          style={{ alignItems: 'center', gap: kolmiSpace.md, maxWidth: 320 }}
        >
          <Text
            style={{
              fontFamily: kolmiFonts.serif,
              fontSize: 28,
              color: kolmiColors.text,
              textAlign: 'center',
              letterSpacing: -0.4,
            }}
          >
            Profil indisponible
          </Text>
          <Text
            style={{
              fontFamily: kolmiFonts.serifItalic,
              fontSize: 16,
              color: kolmiColors.textSecondary,
              textAlign: 'center',
              lineHeight: 23,
            }}
          >
            Ce profil n&apos;a pas pu être chargé. Il est peut-être temporairement
            indisponible.
          </Text>

          <View style={{ width: '100%', gap: kolmiSpace.sm, marginTop: kolmiSpace.sm }}>
            <TouchableOpacity
              onPress={handleRetry}
              activeOpacity={0.85}
              disabled={status === 'loading'}
              style={{
                height: 56,
                borderRadius: kolmiRadius.pill,
                backgroundColor:
                  status === 'loading' ? kolmiColors.surfaceSoft : kolmiColors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: kolmiSpace.xs,
              }}
            >
              {status === 'loading' ? (
                <ActivityIndicator color={kolmiColors.textMuted} />
              ) : (
                <Text
                  style={{
                    fontFamily: kolmiFonts.uiSemiBold,
                    fontSize: 16,
                    color: kolmiColors.white,
                    letterSpacing: 0.2,
                  }}
                >
                  Rafraîchir
                </Text>
              )}
            </TouchableOpacity>

            {status === 'failed' && (
              <Animated.View
                entering={FadeInUp.duration(kolmiMotion.duration.md).easing(kolmiMotion.easing.soft)}
                style={{ gap: kolmiSpace.sm }}
              >
                <Text
                  style={{
                    fontFamily: kolmiFonts.serifItalic,
                    fontSize: 14,
                    color: kolmiColors.textMuted,
                    textAlign: 'center',
                  }}
                >
                  Le rechargement n&apos;a rien donné.
                </Text>
                <TouchableOpacity
                  onPress={onBackToList}
                  activeOpacity={0.7}
                  style={{
                    height: 56,
                    borderRadius: kolmiRadius.pill,
                    borderWidth: 1.5,
                    borderColor: kolmiColors.outline,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: kolmiFonts.uiMedium,
                      fontSize: 16,
                      color: kolmiColors.text,
                    }}
                  >
                    Retour à mes profils
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  )
}

function BulletBlock({
  label,
  items,
  tone,
}: {
  label: string
  items: string[]
  tone?: 'muted'
}) {
  return (
    <View style={{ gap: kolmiSpace.xs }}>
      <Text
        style={{
          fontFamily: kolmiFonts.uiSemiBold,
          fontSize: 11,
          color: tone === 'muted' ? kolmiColors.textMuted : kolmiColors.accent,
          textTransform: 'uppercase',
          letterSpacing: 1.6,
        }}
      >
        {label}
      </Text>
      <View style={{ gap: 4 }}>
        {items.map((item, i) => (
          <View
            key={`${label}-${i}`}
            style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 14,
                lineHeight: 21,
                color:
                  tone === 'muted' ? kolmiColors.textMuted : kolmiColors.accent,
              }}
            >
              ·
            </Text>
            <Text
              style={{
                flex: 1,
                fontFamily: kolmiFonts.ui,
                fontSize: 14,
                color: kolmiColors.textBody,
                lineHeight: 21,
              }}
            >
              {item}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
