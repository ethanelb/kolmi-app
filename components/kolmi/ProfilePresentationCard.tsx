import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, AccessibilityInfo } from 'react-native'
import { Image } from 'expo-image'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import {
  kolmiColors,
  kolmiFonts,
  kolmiRadius,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import type { SelectedProfile } from '@/data/mockSelectedProfiles'
import type { ProfileStage } from '@/lib/kolmi/conversationEngine'

type Props = {
  profile: SelectedProfile
  stage: ProfileStage
  // Si true, on joue la séquence de build (animation caractère/ligne
  // par ligne). Si false, on rend immédiatement la carte construite —
  // utilisé quand on restaure une conversation persistée pour ne pas
  // ré-animer les cartes déjà vues.
  isFresh?: boolean
  // Callback dès que toutes les animations de building sont finies.
  // L'orchestrateur peut alors marker le profil 'ready' et révéler la
  // décision inline en dessous.
  onReady?: () => void
  // Tap sur la carte (uniquement une fois construite) → ouvre le détail.
  onPress?: () => void
}

const BUILD_PHOTO_DUR = 600
const BUILD_LINE_INTERVAL = 180 // entre chaque ligne de texte
const BUILD_LINE_DUR = 380

// Carte de présentation éditoriale. 75 % de largeur — signal visuel
// que c'est "présenté", pas "consommé". Hairlines flanquant le nom.
// Float subtil sur l'avatar pour la rendre vivante. Quand stage =
// 'decided', on ne rend rien (le parent affiche un MiniRecap à la place).
function ProfilePresentationCard({
  profile,
  stage,
  isFresh = false,
  onReady,
  onPress,
}: Props) {
  // On anime la séquence de build UNIQUEMENT si la carte est neuve dans
  // cette session (fresh). Restaurer une conversation depuis le storage
  // doit afficher la carte déjà construite, sans ré-animer.
  const animateBuild = stage === 'building' && isFresh
  const initial = animateBuild ? 0 : 1

  const sv = {
    photo: useSharedValue(initial),
    name: useSharedValue(initial),
    maison: useSharedValue(initial),
    occupation: useSharedValue(initial),
    hairline: useSharedValue(initial),
    teaser: useSharedValue(initial),
    float: useSharedValue(0),
  }

  // isBuilt : la carte est-elle prête à recevoir un tap ? Vrai dès que
  // l'animation de build est terminée OU si on n'anime pas.
  const [isBuilt, setIsBuilt] = useState(!animateBuild)

  // Garde anti-restart : la séquence de build ne doit jamais se relancer
  // pour un même mount, même si onReady change de référence (parent
  // recrée son useCallback). Sinon le float infini empile et la card
  // se met à danser de façon erratique.
  const builtRef = useRef(false)

  // Build sequence — uniquement si on doit animer (fresh + building),
  // et une seule fois par mount.
  useEffect(() => {
    if (!animateBuild) return
    if (builtRef.current) return
    builtRef.current = true
    let cancelled = false
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return

      if (reduce) {
        sv.photo.value = 1
        sv.name.value = 1
        sv.maison.value = 1
        sv.occupation.value = 1
        sv.hairline.value = 1
        sv.teaser.value = 1
        setIsBuilt(true)
        onReady?.()
        return
      }

      sv.photo.value = withTiming(1, {
        duration: BUILD_PHOTO_DUR,
        easing: Easing.out(Easing.cubic),
      })

      const sched = (
        target: typeof sv.name,
        delay: number,
        cb?: () => void,
      ) => {
        target.value = withDelay(
          delay,
          withTiming(
            1,
            { duration: BUILD_LINE_DUR, easing: Easing.out(Easing.cubic) },
            (finished) => {
              'worklet'
              if (finished && cb) runOnJS(cb)()
            },
          ),
        )
      }

      sched(sv.name, BUILD_PHOTO_DUR + 0 * BUILD_LINE_INTERVAL)
      sched(sv.maison, BUILD_PHOTO_DUR + 1 * BUILD_LINE_INTERVAL)
      sched(sv.occupation, BUILD_PHOTO_DUR + 2 * BUILD_LINE_INTERVAL)
      sched(sv.hairline, BUILD_PHOTO_DUR + 3 * BUILD_LINE_INTERVAL)
      sched(sv.teaser, BUILD_PHOTO_DUR + 4 * BUILD_LINE_INTERVAL, () => {
        setIsBuilt(true)
        onReady?.()
      })

      // Float infini de l'avatar (sin wave ±2 px, période 4 s)
      sv.float.value = withDelay(
        1200,
        withRepeat(
          withSequence(
            withTiming(-2, {
              duration: 2000,
              easing: Easing.inOut(Easing.quad),
            }),
            withTiming(2, {
              duration: 2000,
              easing: Easing.inOut(Easing.quad),
            }),
          ),
          -1,
          true,
        ),
      )
    })
    return () => {
      cancelled = true
    }
  }, [animateBuild, onReady, sv.photo, sv.name, sv.maison, sv.occupation, sv.hairline, sv.teaser, sv.float])

  const photoStyle = useAnimatedStyle(() => ({
    opacity: sv.photo.value,
    transform: [
      { translateY: sv.float.value },
      { scale: 0.96 + sv.photo.value * 0.04 },
    ],
  }))

  // Un useAnimatedStyle par ligne — on évite la factory inline qui
  // violait les rules of hooks.
  const nameStyle = useAnimatedStyle(() => ({
    opacity: sv.name.value,
    transform: [{ translateY: (1 - sv.name.value) * 8 }],
  }))
  const maisonStyle = useAnimatedStyle(() => ({
    opacity: sv.maison.value,
    transform: [{ translateY: (1 - sv.maison.value) * 8 }],
  }))
  const occupationStyle = useAnimatedStyle(() => ({
    opacity: sv.occupation.value,
    transform: [{ translateY: (1 - sv.occupation.value) * 8 }],
  }))
  const teaserStyle = useAnimatedStyle(() => ({
    opacity: sv.teaser.value,
    transform: [{ translateY: (1 - sv.teaser.value) * 8 }],
  }))

  const hairlineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: sv.hairline.value }],
    opacity: sv.hairline.value,
  }))

  const subtitleText =
    profile.occupation && profile.city
      ? `${profile.occupation} · ${profile.city}`
      : profile.occupation ?? profile.city

  const teaser = profile.teaser ?? profile.reason

  // Si on est passé en 'decided', on ne rend plus rien (le parent
  // affiche un MiniRecap à la place). On retourne après tous les hooks
  // pour garder un ordre stable.
  if (stage === 'decided') return null

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || !isBuilt}
      style={({ pressed }) => [styles.cardWrap, pressed && onPress && styles.cardPressed]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={
        onPress ? `Ouvrir le profil de ${profile.firstName}` : undefined
      }
    >
      <Animated.View style={[styles.photoWrap, photoStyle]}>
        {profile.photoUrl ? (
          <Image
            source={{ uri: profile.photoUrl }}
            style={styles.photo}
            contentFit="cover"
            transition={140}
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoLetter}>
              {profile.firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <View style={styles.nameHairline} />
          <Animated.Text style={[styles.name, nameStyle]}>
            {profile.firstName}, {profile.age}
          </Animated.Text>
          <View style={styles.nameHairline} />
        </View>

        <Animated.Text style={[styles.maison, maisonStyle]}>
          {profile.dnaLabel}
        </Animated.Text>

        {subtitleText ? (
          <Animated.Text style={[styles.subtitle, occupationStyle]}>
            {subtitleText}
          </Animated.Text>
        ) : null}

        <View style={styles.hairlineTrack}>
          <Animated.View
            style={[
              styles.hairlineFill,
              hairlineStyle,
              { transformOrigin: 'left' as const },
            ]}
          />
        </View>

        <Animated.Text style={[styles.teaser, teaserStyle]} numberOfLines={3}>
          {teaser}
        </Animated.Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  cardWrap: {
    alignSelf: 'center',
    width: '100%',
    backgroundColor: '#FAF8F5',
    borderRadius: kolmiRadius.lg,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    overflow: 'hidden',
    // Resserré : on veut que la carte vienne haut, pas qu'elle flotte
    // au milieu de l'écran sous l'impression d'un grand vide.
    marginTop: kolmiSpace.xs,
    marginBottom: kolmiSpace.md,
  },
  cardPressed: {
    opacity: 0.94,
  },
  photoWrap: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: kolmiColors.surfaceSoft,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: '#EFE7DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLetter: {
    fontFamily: kolmiFonts.serif,
    fontSize: 90,
    color: kolmiColors.accent,
  },

  body: {
    paddingHorizontal: kolmiSpace.lg,
    paddingTop: kolmiSpace.md,
    paddingBottom: kolmiSpace.lg,
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  nameHairline: {
    width: 16,
    height: 0.6,
    backgroundColor: 'rgba(139,26,26,0.5)',
  },
  name: {
    fontFamily: kolmiFonts.serif,
    fontSize: 26,
    color: kolmiColors.text,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  maison: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 14,
    color: kolmiColors.accent,
    letterSpacing: 0.1,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: kolmiFonts.ui,
    fontSize: 13,
    color: kolmiColors.textBody,
    marginTop: 2,
  },

  hairlineTrack: {
    width: 32,
    height: 0.6,
    overflow: 'hidden',
    marginVertical: kolmiSpace.sm,
  },
  hairlineFill: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(139,26,26,0.5)',
  },

  teaser: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    lineHeight: 22,
    color: kolmiColors.text,
    textAlign: 'center',
    paddingHorizontal: kolmiSpace.sm,
  },
})

export default React.memo(ProfilePresentationCard)
