import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import AnimatedCounter from '@/components/kolmi/AnimatedCounter'
import BreathingText from '@/components/kolmi/BreathingText'
import {
  getKolmiDnaResult,
  getKolmiPreferences,
  getKolmiProfile,
  getTokens,
  resetKolmiState,
  type KolmiPreferences,
  type KolmiProfile,
} from '@/lib/kolmi/storage'
import { kolmiMotion, staggerDelay } from '@/lib/kolmi/motion'
import type { KolmiDnaResult } from '@/lib/kolmi/types'

export default function ProfileTabScreen() {
  const router = useRouter()
  const [profile, setProfile] = useState<KolmiProfile>({})
  const [dna, setDna] = useState<KolmiDnaResult | null>(null)
  const [prefs, setPrefs] = useState<KolmiPreferences | null>(null)
  const [tokens, setTokensState] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refresh = React.useCallback(async () => {
    const [nextProfile, nextDna, nextPrefs, nextTokens] = await Promise.all([
      getKolmiProfile(),
      getKolmiDnaResult(),
      getKolmiPreferences(),
      getTokens(),
    ])
    setProfile(nextProfile)
    setDna(nextDna)
    setPrefs(nextPrefs)
    setTokensState(nextTokens)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useFocusEffect(
    React.useCallback(() => {
      refresh()
    }, [refresh])
  )

  function handleSignOut() {
    Alert.alert(
      'Se déconnecter',
      'Toutes vos données locales seront effacées sur cet appareil.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await resetKolmiState()
            router.replace('/')
          },
        },
      ]
    )
  }

  function handleDevRestart() {
    Alert.alert(
      "Recommencer l'onboarding",
      'Vos réponses, votre profil et votre Maison seront effacés pour pouvoir refaire le flow.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Recommencer',
          style: 'destructive',
          onPress: async () => {
            await resetKolmiState()
            router.replace('/onboarding/welcome')
          },
        },
      ]
    )
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
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 11,
                letterSpacing: 1.6,
                color: kolmiColors.textSecondary,
                textTransform: 'uppercase',
              }}
            >
              {profile.firstName ? 'Bonjour' : 'Profil'}
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
              {profile.firstName ?? 'Mon profil'}
            </Text>
          </View>

          {isLoading ? (
            <>
              <SectionSkeleton title="Ma Maison" index={0} variant="dna" />
              <SectionSkeleton
                title="Tokens de rencontre"
                index={1}
                variant="tokens"
              />
              <SectionSkeleton title="Mon profil" index={2} variant="profile" />
              <SectionSkeleton
                title="Mes préférences"
                index={3}
                variant="prefs"
              />
            </>
          ) : (
            <>
          {/* Maison ADN */}
          {dna && (
            <Section title="Ma Maison" index={0}>
              <View style={{ gap: kolmiSpace.xs }}>
                <BreathingText
                  style={{
                    fontFamily: kolmiFonts.serif,
                    fontSize: 28,
                    color: kolmiColors.text,
                    letterSpacing: -0.3,
                  }}
                >
                  {dna.categoryLabel}
                </BreathingText>
                <Text
                  style={{
                    fontFamily: kolmiFonts.serifItalic,
                    fontSize: 14,
                    color: kolmiColors.textBody,
                    lineHeight: 20,
                  }}
                >
                  {dna.summary}
                </Text>
              </View>
              <ActionRow
                label="Voir mon ADN"
                onPress={() =>
                  router.push({
                    pathname: '/matchmaker/result',
                    params: { instant: '1' },
                  })
                }
              />
              <ActionRow
                label="Refaire le test"
                onPress={() => router.replace('/matchmaker')}
              />
            </Section>
          )}

          {/* Tokens */}
          <Section title="Tokens de rencontre" index={1}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <AnimatedCounter
                value={tokens}
                style={{
                  fontFamily: kolmiFonts.serif,
                  fontSize: 40,
                  color: kolmiColors.accent,
                  letterSpacing: -0.5,
                }}
              />
              <Text
                style={{
                  fontFamily: kolmiFonts.serifItalic,
                  fontSize: 14,
                  color: kolmiColors.textBody,
                }}
              >
                {tokens > 1 ? 'tokens disponibles' : tokens === 1 ? 'token disponible' : 'aucun token'}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: kolmiFonts.ui,
                fontSize: 13,
                color: kolmiColors.textMuted,
                lineHeight: 19,
              }}
            >
              Un token est utilisé pour demander une rencontre.
            </Text>
            <ActionRow
              label="Acheter des tokens"
              onPress={() => router.push('/premium')}
            />
          </Section>

          {/* Profil — édition */}
          <Section title="Mon profil" index={2}>
            <Text
              style={{
                fontFamily: kolmiFonts.ui,
                fontSize: 14,
                color: kolmiColors.textBody,
                lineHeight: 21,
              }}
            >
              {(profile.photoUrls?.length ?? 0)} photo
              {(profile.photoUrls?.length ?? 0) > 1 ? 's' : ''}
              {profile.heightCm ? ` · ${profile.heightCm} cm` : ''}
              {profile.gender ? ` · ${profile.gender}` : ''}
            </Text>
            <ActionRow
              label="Modifier mon profil"
              onPress={() => router.push('/profile')}
            />
          </Section>

          {/* Préférences */}
          <Section title="Mes préférences" index={3}>
            {prefs ? (
              <Text
                style={{
                  fontFamily: kolmiFonts.ui,
                  fontSize: 14,
                  color: kolmiColors.textBody,
                  lineHeight: 21,
                }}
              >
                {prefs.minAge}–{prefs.maxAge} ans · {prefs.distance}
              </Text>
            ) : (
              <Text
                style={{
                  fontFamily: kolmiFonts.serifItalic,
                  fontSize: 14,
                  color: kolmiColors.textMuted,
                }}
              >
                Aucune préférence renseignée.
              </Text>
            )}
            <ActionRow label="Modifier mes préférences (bientôt)" onPress={() => {}} disabled />
          </Section>
            </>
          )}

          {/* Compte */}
          <Section title="Compte" index={4}>
            <ActionRow
              label="Confidentialité (bientôt)"
              onPress={() => {}}
              disabled
            />
            {__DEV__ && (
              <ActionRow
                label="Recommencer l'onboarding (dev)"
                onPress={handleDevRestart}
                tone="danger"
              />
            )}
            <ActionRow
              label="Se déconnecter"
              onPress={handleSignOut}
              tone="danger"
            />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function Section({
  title,
  children,
  index = 0,
}: {
  title: string
  children: React.ReactNode
  index?: number
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(staggerDelay(index, 80))
        .duration(kolmiMotion.duration.lg)
        .easing(kolmiMotion.easing.soft)}
      style={{ gap: kolmiSpace.sm }}
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
        {title}
      </Text>
      <View
        style={{
          padding: kolmiSpace.md,
          borderRadius: kolmiRadius.lg,
          borderWidth: 1,
          borderColor: 'rgba(22,19,15,0.12)',
          backgroundColor: '#FAF8F5',
          gap: kolmiSpace.sm,
        }}
      >
        {children}
      </View>
    </Animated.View>
  )
}

function SkeletonBlock({
  width,
  height,
  radius = 6,
}: {
  width: number | `${number}%`
  height: number
  radius?: number
}) {
  const [layoutWidth, setLayoutWidth] = useState(0)
  const progress = useSharedValue(-1)

  useEffect(() => {
    if (layoutWidth === 0) return
    progress.value = -1
    progress.value = withRepeat(
      withTiming(1, {
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false,
    )
  }, [layoutWidth, progress])

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * layoutWidth }],
  }))

  return (
    <View
      onLayout={(e) => {
        const next = e.nativeEvent.layout.width
        if (next !== layoutWidth) setLayoutWidth(next)
      }}
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: 'rgba(22,19,15,0.07)',
      }}
    >
      {layoutWidth > 0 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: layoutWidth,
            },
            shimmerStyle,
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(250,248,245,0)',
              'rgba(250,248,245,0.55)',
              'rgba(250,248,245,0)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  )
}

function SectionSkeleton({
  title,
  index = 0,
  variant,
}: {
  title: string
  index?: number
  variant: 'dna' | 'tokens' | 'profile' | 'prefs'
}) {
  return (
    <Animated.View
      entering={FadeIn.delay(staggerDelay(index, 60))
        .duration(kolmiMotion.duration.md)
        .easing(kolmiMotion.easing.soft)}
      style={{ gap: kolmiSpace.sm }}
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
        {title}
      </Text>
      <View
        style={{
          padding: kolmiSpace.md,
          borderRadius: kolmiRadius.lg,
          borderWidth: 1,
          borderColor: 'rgba(22,19,15,0.12)',
          backgroundColor: '#FAF8F5',
          gap: kolmiSpace.sm,
        }}
      >
        {variant === 'dna' && (
          <>
            <SkeletonBlock width="60%" height={26} radius={6} />
            <SkeletonBlock width="100%" height={14} radius={4} />
            <SkeletonBlock width="85%" height={14} radius={4} />
            <SkeletonBlock width="100%" height={44} radius={kolmiRadius.pill} />
            <SkeletonBlock width="100%" height={44} radius={kolmiRadius.pill} />
          </>
        )}
        {variant === 'tokens' && (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <SkeletonBlock width={56} height={36} radius={6} />
              <SkeletonBlock width={140} height={14} radius={4} />
            </View>
            <SkeletonBlock width="90%" height={13} radius={4} />
            <SkeletonBlock width="100%" height={44} radius={kolmiRadius.pill} />
          </>
        )}
        {variant === 'profile' && (
          <>
            <SkeletonBlock width="75%" height={14} radius={4} />
            <SkeletonBlock width="100%" height={44} radius={kolmiRadius.pill} />
          </>
        )}
        {variant === 'prefs' && (
          <>
            <SkeletonBlock width="55%" height={14} radius={4} />
            <SkeletonBlock width="100%" height={44} radius={kolmiRadius.pill} />
          </>
        )}
      </View>
    </Animated.View>
  )
}

function ActionRow({
  label,
  onPress,
  disabled,
  tone,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  tone?: 'danger'
}) {
  const color = disabled
    ? kolmiColors.textMuted
    : tone === 'danger'
      ? kolmiColors.accent
      : kolmiColors.text
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
      style={{
        height: 44,
        borderRadius: kolmiRadius.pill,
        borderWidth: 1,
        borderColor:
          tone === 'danger' ? kolmiColors.accent : kolmiColors.outline,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: kolmiFonts.uiSemiBold,
          fontSize: 14,
          color,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}
