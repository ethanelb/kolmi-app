import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Image } from 'expo-image'
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated'
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
import AnimatedCounter from '@/components/kolmi/AnimatedCounter'
import BreathingText from '@/components/kolmi/BreathingText'
import SkeletonBlock from '@/components/kolmi/SkeletonBlock'
import {
  clearKolmiAnswers,
  getKolmiDnaResult,
  getKolmiPreferences,
  getKolmiProfile,
  getTokens,
  resetKolmiState,
  isSubscribed,
  getHasPurchased,
  type KolmiPreferences,
  type KolmiProfile,
} from '@/lib/kolmi/storage'
import { kolmiMotion, staggerDelay } from '@/lib/kolmi/motion'
import type { KolmiDnaResult } from '@/lib/kolmi/types'
import { useSession } from '@/lib/kolmi/session'
import { supabase } from '@/lib/supabase'

export default function ProfileTabScreen() {
  const router = useRouter()
  const [profile, setProfile] = useState<KolmiProfile>({})
  const [dna, setDna] = useState<KolmiDnaResult | null>(null)
  const [prefs, setPrefs] = useState<KolmiPreferences | null>(null)
  const [tokens, setTokensState] = useState<number>(0)
  const [subscribed, setSubscribed] = useState<boolean>(false)
  const [purchased, setPurchased] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { user } = useSession()
  // is_anonymous est défini quand le user vient d'un signInAnonymously.
  // Une fois lié à un email, ce flag bascule à false (ou disparaît).
  const isAnonymous = user?.is_anonymous ?? true

  const refresh = React.useCallback(async () => {
    const [
      nextProfile,
      nextDna,
      nextPrefs,
      nextTokens,
      nextSub,
      nextPurchased,
    ] = await Promise.all([
      getKolmiProfile(),
      getKolmiDnaResult(),
      getKolmiPreferences(),
      getTokens(),
      isSubscribed(),
      getHasPurchased(),
    ])
    setProfile(nextProfile)
    setDna(nextDna)
    setPrefs(nextPrefs)
    setTokensState(nextTokens)
    setSubscribed(nextSub)
    setPurchased(nextPurchased)
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
            await supabase.auth.signOut()
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
        {/* Header — flèche retour à gauche, pill tokens au centre
            (déplacée depuis la home), spacer à droite pour équilibrer. */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: kolmiPaddingX,
            paddingTop: kolmiSpace.sm,
            paddingBottom: kolmiSpace.xs,
          }}
        >
          <TouchableOpacity
            onPress={() => router.navigate('/(tabs)/conversation')}
            activeOpacity={0.7}
            style={{
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: -6,
            }}
            hitSlop={10}
            accessibilityLabel="Retour à l'accueil"
            accessibilityRole="button"
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M14.5 5.5L7.5 12l7 6.5"
                stroke={kolmiColors.text}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/premium')}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 6,
              opacity: tokens === 0 ? 0.55 : 1,
            }}
            hitSlop={8}
            accessibilityLabel={
              tokens > 0
                ? `${tokens} tokens disponibles, voir les recharges`
                : 'Aucun token, voir les recharges'
            }
            accessibilityRole="button"
          >
            <View
              style={
                tokens === 0
                  ? {
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      borderWidth: 1,
                      borderColor: kolmiColors.textMuted,
                    }
                  : {
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: kolmiColors.accent,
                    }
              }
            />
            <Text
              style={{
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 14,
                color: tokens === 0 ? kolmiColors.textMuted : kolmiColors.text,
                letterSpacing: 0.4,
              }}
            >
              {tokens}
            </Text>
          </TouchableOpacity>

          {/* Spacer 36x36 pour centrer optiquement le pill tokens — mirroir
              du back-arrow à gauche. */}
          <View style={{ width: 36, height: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: kolmiPaddingX,
            paddingTop: kolmiSpace.xs,
            paddingBottom: kolmiSpace.xxxl,
            gap: kolmiSpace.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          <SignatureCard profile={profile} dna={dna} />


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
                    fontSize: fontScale(28),
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
                onPress={() => {
                  Alert.alert(
                    'Refaire le test',
                    'Vos 8 réponses actuelles seront effacées pour refaire le test. Votre Maison actuelle reste affichée tant que le nouveau test n’est pas terminé.',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      {
                        text: 'Refaire',
                        style: 'destructive',
                        onPress: async () => {
                          // Sans ce wipe, MatchmakerChat détecte 8 réponses
                          // valides et bounce direct vers /matchmaker/result
                          // — l'utilisateur ne voit jamais une question.
                          await clearKolmiAnswers()
                          router.replace('/matchmaker')
                        },
                      },
                    ],
                  )
                }}
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
                  fontSize: fontScale(40),
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

          {/* Promo abonnement — visible uniquement aux utilisateurs
              gratuits (ni abonnés ni clients packs). Carte calme,
              pitch émotionnel, CTA discret. Pas de badge "promo" :
              c'est une invitation, pas une pub. */}
          {!subscribed && !purchased && (
            <SubscriptionPromoCard
              onPress={() => router.push('/premium')}
              index={2}
            />
          )}

          {/* Profil — édition */}
          <Section title="Mon profil" index={3}>
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
              {(() => {
                const age = computeAge(profile.birthDate)
                return age != null ? ` · ${age} ans` : ''
              })()}
              {profile.gender ? ` · ${profile.gender}` : ''}
            </Text>
            {profile.orientations?.length ? (
              <Text
                style={{
                  fontFamily: kolmiFonts.ui,
                  fontSize: 14,
                  color: kolmiColors.textBody,
                  lineHeight: 21,
                }}
              >
                Recherche : {formatOrientations(profile.orientations)}
              </Text>
            ) : null}
            <ActionRow
              label="Modifier mes photos"
              onPress={() => router.push('/profile/edit-photos')}
            />
            <ActionRow
              label="Modifier ma date de naissance"
              onPress={() => router.push('/profile/edit-birthday')}
            />
            <ActionRow
              label="Modifier mon genre"
              onPress={() => router.push('/profile/edit-gender')}
            />
            <ActionRow
              label="Modifier mon orientation"
              onPress={() => router.push('/profile/edit-orientation')}
            />
          </Section>

          {/* Préférences */}
          <Section title="Mes préférences" index={4}>
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
          <Section title="Compte" index={5}>
            {isAnonymous ? (
              <ActionRow
                label="Sécuriser mon compte"
                onPress={() => router.push('/auth/email')}
              />
            ) : (
              <ActionRow
                label={user?.email ? `Connecté en tant que ${user.email}` : 'Compte sécurisé'}
                onPress={() => {}}
                disabled
              />
            )}
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

          <ProfileFooter />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

// Carte signature en haut du profil — la "page de garde" éditoriale.
// Avatar circulaire à gauche, prénom serif et ligne italique avec âge ·
// Maison à droite. Petit kicker "MEMBRE · KOLMI" en supra.
function SignatureCard({
  profile,
  dna,
}: {
  profile: KolmiProfile
  dna: KolmiDnaResult | null
}) {
  const firstPhoto = profile.photoUrls?.[0]
  const age = computeAge(profile.birthDate)
  const initials = (profile.firstName ?? '').trim().slice(0, 1).toUpperCase()
  const subtitleParts: string[] = []
  if (age != null) subtitleParts.push(`${age} ans`)
  if (dna?.categoryLabel) subtitleParts.push(dna.categoryLabel)
  const subtitle = subtitleParts.join(' · ')

  return (
    <Animated.View
      entering={FadeInUp.duration(kolmiMotion.duration.lg).easing(
        kolmiMotion.easing.soft,
      )}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: kolmiSpace.md,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          borderWidth: 1,
          borderColor: 'rgba(22,19,15,0.15)',
          backgroundColor: '#FAF8F5',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {firstPhoto ? (
          <Image
            source={{ uri: firstPhoto }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <Text
            style={{
              fontFamily: kolmiFonts.serif,
              fontSize: fontScale(28),
              color: kolmiColors.textMuted,
            }}
          >
            {initials || '·'}
          </Text>
        )}
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontFamily: kolmiFonts.uiSemiBold,
            fontSize: 10,
            letterSpacing: 1.8,
            color: kolmiColors.textSecondary,
            textTransform: 'uppercase',
          }}
        >
          Membre · KOLMI
        </Text>
        <Text
          style={{
            fontFamily: kolmiFonts.serif,
            fontSize: fontScale(32),
            color: kolmiColors.text,
            lineHeight: 36,
            letterSpacing: -0.4,
          }}
        >
          {profile.firstName ?? 'Mon profil'}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontFamily: kolmiFonts.serifItalic,
              fontSize: 14,
              color: kolmiColors.textBody,
              lineHeight: 20,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  )
}

// Pied de page éditorial — clôt la fiche personnelle comme un colophon.
// Carte promo abonnement — n'apparaît qu'aux utilisateurs gratuits.
// Pas de badge "promo", pas de bordeaux saturé : on est dans le ton
// éditorial. Cadre bordeaux fin, italique serif, dot d'accent, CTA
// outlined comme la "porte" de ready.tsx pour rester cohérent.
function SubscriptionPromoCard({
  onPress,
  index = 0,
}: {
  onPress: () => void
  index?: number
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(staggerDelay(index, 80))
        .duration(kolmiMotion.duration.lg)
        .easing(kolmiMotion.easing.soft)}
      style={{
        padding: kolmiSpace.lg,
        borderRadius: kolmiRadius.lg,
        borderWidth: 1.2,
        borderColor: kolmiColors.accent,
        backgroundColor: '#FAF8F5',
        gap: kolmiSpace.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 24,
            height: 0.8,
            backgroundColor: kolmiColors.accent,
          }}
        />
        <Text
          style={{
            fontFamily: kolmiFonts.uiSemiBold,
            fontSize: 10,
            color: kolmiColors.accent,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
          }}
        >
          KOLMI · Abonnement
        </Text>
      </View>

      <Text
        style={{
          fontFamily: kolmiFonts.serifItalic,
          fontSize: 22,
          color: kolmiColors.text,
          lineHeight: 28,
          letterSpacing: -0.2,
          marginTop: 2,
        }}
      >
        Et si vous arrêtiez de compter ?
      </Text>

      <Text
        style={{
          fontFamily: kolmiFonts.ui,
          fontSize: 13,
          lineHeight: 20,
          color: kolmiColors.textBody,
          marginTop: 2,
        }}
      >
        5 tokens chaque mois, profils illimités, le matchmaker en alerte
        permanente. 60 € / mois.
      </Text>

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{
          marginTop: kolmiSpace.sm,
          alignSelf: 'flex-start',
          paddingHorizontal: kolmiSpace.md,
          paddingVertical: 10,
          borderRadius: kolmiRadius.pill,
          borderWidth: 1.2,
          borderColor: kolmiColors.accent,
        }}
      >
        <Text
          style={{
            fontFamily: kolmiFonts.uiSemiBold,
            fontSize: 13,
            color: kolmiColors.accent,
            letterSpacing: 0.4,
          }}
        >
          Découvrir l'abonnement →
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

function ProfileFooter() {
  return (
    <View
      style={{
        alignItems: 'center',
        paddingTop: kolmiSpace.lg,
        gap: 6,
      }}
    >
      <View
        style={{
          width: 32,
          height: 1,
          backgroundColor: 'rgba(22,19,15,0.18)',
        }}
      />
      <Text
        style={{
          fontFamily: kolmiFonts.uiSemiBold,
          fontSize: 10,
          letterSpacing: 2,
          color: kolmiColors.textSecondary,
          textTransform: 'uppercase',
        }}
      >
        KOLMI · Bêta privée · MMXXVI
      </Text>
    </View>
  )
}

function computeAge(birthDate: KolmiProfile['birthDate']): number | null {
  if (!birthDate) return null
  const today = new Date()
  let age = today.getFullYear() - birthDate.year
  const m = today.getMonth() + 1 - birthDate.month
  if (m < 0 || (m === 0 && today.getDate() < birthDate.day)) age -= 1
  return age >= 0 ? age : null
}

const ORIENTATION_LABELS: Record<string, string> = {
  men: 'Hommes',
  women: 'Femmes',
  other: 'Autre',
}

function formatOrientations(ids: string[]): string {
  return ids.map((id) => ORIENTATION_LABELS[id] ?? id).join(', ')
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
