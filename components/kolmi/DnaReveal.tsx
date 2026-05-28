import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  withRepeat,
  Easing,
  type SharedValue,
} from 'react-native-reanimated'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
  fontScale,
} from '@/constants/kolmiTheme'
import { dnaCategories, type DnaCategoryId } from '@/data/kolmiDna'
import type { KolmiDnaResult } from '@/lib/kolmi/types'
import MaisonGlyph from './MaisonGlyph'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
const ROMAN_LOWER = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii']

const ORDER: DnaCategoryId[] = [
  'gigi',
  'amare',
  'solea',
  'terracotta',
  'fiora',
  'lumi',
  'calia',
  'vesna',
]

const SCREEN_HEIGHT = Dimensions.get('window').height

type Props = {
  result: KolmiDnaResult
  onContinue: () => void
  instant?: boolean
}

export default function DnaReveal({
  result,
  onContinue,
  instant = false,
}: Props) {
  const category = dnaCategories[result.categoryId]
  const number = ORDER.indexOf(result.categoryId) + 1
  const finalNumeral = ROMAN[Math.max(0, number - 1)] ?? 'I'
  const titleLower = category.title.toLowerCase()
  const traits = category.traits.slice(0, 5)
  const compatibleIds = category.compatible ?? []
  const compatibleMaisons = compatibleIds
    .map((id) => dnaCategories[id])
    .filter(Boolean)

  const waitOpacity = useSharedValue(1)
  const waitPulse = useSharedValue(0.4)

  const numeralTranslate = useSharedValue(-SCREEN_HEIGHT * 0.7)
  const numeralOpacity = useSharedValue(0)
  const numeralTilt = useSharedValue(-4)
  const numeralShake = useSharedValue(0)

  const tagOpacity = useSharedValue(0)
  const tagSpread = useSharedValue(0)

  const nameOpacity = useSharedValue(0)
  const nameTranslate = useSharedValue(36)
  const nameClip = useSharedValue(0)

  const dividerWidth = useSharedValue(0)
  const italicOpacity = useSharedValue(0)

  const trait0 = useSharedValue(0)
  const trait1 = useSharedValue(0)
  const trait2 = useSharedValue(0)
  const trait3 = useSharedValue(0)
  const trait4 = useSharedValue(0)
  const traitVals: SharedValue<number>[] = [trait0, trait1, trait2, trait3, trait4]

  const hintOpacity = useSharedValue(0)
  const hintBounce = useSharedValue(0)
  const footerOpacity = useSharedValue(0)

  // Lift animation : à la fin du scroll, on translate tout le contenu vers
  // le haut puis on déclenche onContinue. Effet : la "page" se soulève
  // pour révéler l'app derrière.
  const liftY = useSharedValue(0)
  const liftOpacity = useSharedValue(1)

  const [skipped, setSkipped] = useState(instant)
  const [lifting, setLifting] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const snapToFinal = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    waitOpacity.value = 0
    waitPulse.value = 1
    numeralOpacity.value = 1
    numeralTranslate.value = 0
    numeralTilt.value = 0
    numeralShake.value = 0
    tagOpacity.value = 1
    tagSpread.value = 1
    nameOpacity.value = 1
    nameTranslate.value = 0
    nameClip.value = 1
    dividerWidth.value = 1
    italicOpacity.value = 1
    trait0.value = 1
    trait1.value = 1
    trait2.value = 1
    trait3.value = 1
    trait4.value = 1
    hintOpacity.value = 1
    footerOpacity.value = 1
    setSkipped(true)
  }, [
    waitOpacity, waitPulse, numeralOpacity, numeralTranslate, numeralTilt,
    numeralShake, tagOpacity, tagSpread, nameOpacity, nameTranslate, nameClip,
    dividerWidth, italicOpacity, trait0, trait1, trait2, trait3, trait4,
    hintOpacity, footerOpacity,
  ])

  useEffect(() => {
    if (instant) {
      snapToFinal()
      return
    }
  }, [instant, snapToFinal])

  useEffect(() => {
    if (skipped || instant) return
    waitPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.4, { duration: 600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    )
    waitOpacity.value = withDelay(900, withTiming(0, { duration: 300 }))

    numeralOpacity.value = withDelay(1000, withTiming(1, { duration: 200 }))
    numeralTranslate.value = withDelay(
      1000,
      withSpring(0, { damping: 13, stiffness: 95, mass: 1 }),
    )
    numeralTilt.value = withDelay(
      1000,
      withSpring(0, { damping: 11, stiffness: 80 }),
    )

    const landTimer = setTimeout(() => {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {})
      numeralShake.value = withSequence(
        withTiming(-3, { duration: 60 }),
        withTiming(2, { duration: 70 }),
        withTiming(0, { duration: 80 }),
      )
    }, 1700)
    timersRef.current.push(landTimer)

    tagOpacity.value = withDelay(2300, withTiming(1, { duration: 500 }))
    tagSpread.value = withDelay(
      2300,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
    )

    nameOpacity.value = withDelay(2900, withTiming(1, { duration: 600 }))
    nameTranslate.value = withDelay(
      2900,
      withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }),
    )
    nameClip.value = withDelay(
      2900,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
    )

    const nameTimer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {})
    }, 3050)
    timersRef.current.push(nameTimer)

    dividerWidth.value = withDelay(
      3500,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    )
    italicOpacity.value = withDelay(3800, withTiming(1, { duration: 500 }))

    traitVals.forEach((sv, i) => {
      sv.value = withDelay(
        4300 + i * 180,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
      )
    })

    hintOpacity.value = withDelay(5500, withTiming(1, { duration: 500 }))
    // Bounce infini de la flèche pour inciter à scroll : 0 → 6px → 0
    hintBounce.value = withDelay(
      5500,
      withRepeat(
        withSequence(
          withTiming(6, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    )
    footerOpacity.value = withDelay(5900, withTiming(1, { duration: 500 }))

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [skipped, instant])

  const waitStyle = useAnimatedStyle(() => ({
    opacity: waitOpacity.value * waitPulse.value,
  }))
  const numeralStyle = useAnimatedStyle(() => ({
    opacity: numeralOpacity.value,
    transform: [
      { translateY: numeralTranslate.value + numeralShake.value },
      { rotate: `${numeralTilt.value}deg` },
    ],
  }))
  const tagStyle = useAnimatedStyle(() => ({ opacity: tagOpacity.value }))
  const tagLineLeftStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: tagSpread.value }],
    opacity: tagSpread.value,
  }))
  const tagLineRightStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: tagSpread.value }],
    opacity: tagSpread.value,
  }))
  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameTranslate.value }],
  }))
  const nameMaskStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -nameClip.value * 100 }],
    opacity: 1 - nameClip.value,
  }))
  const dividerStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: dividerWidth.value }],
    opacity: dividerWidth.value,
  }))
  const italicStyle = useAnimatedStyle(() => ({ opacity: italicOpacity.value }))
  const trait0Style = useAnimatedStyle(() => ({
    opacity: trait0.value,
    transform: [{ translateX: (1 - trait0.value) * 14 }],
  }))
  const trait1Style = useAnimatedStyle(() => ({
    opacity: trait1.value,
    transform: [{ translateX: (1 - trait1.value) * 14 }],
  }))
  const trait2Style = useAnimatedStyle(() => ({
    opacity: trait2.value,
    transform: [{ translateX: (1 - trait2.value) * 14 }],
  }))
  const trait3Style = useAnimatedStyle(() => ({
    opacity: trait3.value,
    transform: [{ translateX: (1 - trait3.value) * 14 }],
  }))
  const trait4Style = useAnimatedStyle(() => ({
    opacity: trait4.value,
    transform: [{ translateX: (1 - trait4.value) * 14 }],
  }))
  const traitStyles = [trait0Style, trait1Style, trait2Style, trait3Style, trait4Style]
  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
  }))
  const hintArrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hintBounce.value }],
  }))
  const footerStyle = useAnimatedStyle(() => ({ opacity: footerOpacity.value }))
  const liftStyle = useAnimatedStyle(() => ({
    opacity: liftOpacity.value,
    transform: [{ translateY: liftY.value }],
  }))

  const triggerLift = useCallback(() => {
    if (lifting) return
    setLifting(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    liftY.value = withTiming(-SCREEN_HEIGHT, {
      duration: 720,
      easing: Easing.in(Easing.cubic),
    })
    liftOpacity.value = withDelay(
      120,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    )
    const t = setTimeout(() => onContinue(), 700)
    timersRef.current.push(t)
  }, [lifting, liftY, liftOpacity, onContinue])

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y
      // Marge de 6px pour gérer les imprécisions de subpixel.
      if (distanceFromBottom <= 6) {
        triggerLift()
      }
    },
    [triggerLift],
  )

  return (
    <Animated.View style={[{ flex: 1 }, liftStyle]}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, styles.waitWrap, waitStyle]}
      >
        <Text style={styles.waitText}>— Lecture en cours —</Text>
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={skipped ? undefined : snapToFinal}
        onTouchStart={skipped ? undefined : snapToFinal}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={!lifting}
      >
        <View style={styles.heroBlock}>
          <Animated.View style={numeralStyle}>
            <MaisonGlyph size={200} numeral={finalNumeral} />
          </Animated.View>
        </View>

        <View style={styles.tagRow}>
          <Animated.View
            style={[styles.tagLine, tagLineLeftStyle, { transformOrigin: 'right' as const }]}
          />
          <Animated.Text style={[styles.tagText, tagStyle]}>
            {`MAISON · ÉDITION №${number} / ${ROMAN.length}`}
          </Animated.Text>
          <Animated.View
            style={[styles.tagLine, tagLineRightStyle, { transformOrigin: 'left' as const }]}
          />
        </View>

        <View style={styles.nameWrap}>
          <Animated.Text
            style={[styles.name, nameStyle]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {category.maison}
          </Animated.Text>
          <Animated.View
            pointerEvents="none"
            style={[styles.nameMask, nameMaskStyle]}
          />
        </View>

        <Animated.View
          style={[styles.divider, dividerStyle, { transformOrigin: 'center' as const }]}
        />

        <Animated.Text style={[styles.italic, italicStyle]}>
          {titleLower}.
        </Animated.Text>

        <View style={styles.traitsList}>
          {traits.map((trait, i) => (
            <Animated.View key={trait} style={[styles.traitRow, traitStyles[i]]}>
              <Text style={styles.traitOrdinal}>{ROMAN_LOWER[i]}.</Text>
              <Text style={styles.traitText}>{trait}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View style={[styles.scrollHint, hintStyle]}>
          <Text style={styles.scrollHintText}>
            Faites glisser pour découvrir
          </Text>
          <Animated.Text style={[styles.scrollHintArrow, hintArrowStyle]}>
            ↓
          </Animated.Text>
        </Animated.View>

        {/* Section "L'esprit de la Maison" — texte long en italique,
            visible uniquement quand l'utilisateur scrolle après le reveal. */}
        <Animated.View style={[styles.afterCta, footerStyle]}>
          <View style={styles.sectionRule} />
          <Text style={styles.sectionLabel}>L'esprit de la Maison</Text>
          <Text style={styles.descriptionText}>{category.description}</Text>
        </Animated.View>

        {/* Section "Maisons amies" — 2 Maisons curées qui résonnent avec
            celle de l'utilisateur (cf. data/kolmiDna.ts > compatible). */}
        {compatibleMaisons.length > 0 && (
          <Animated.View style={[styles.afterCta, footerStyle]}>
            <View style={styles.sectionRule} />
            <Text style={styles.sectionLabel}>Maisons amies</Text>
            <View style={styles.compatibleList}>
              {compatibleMaisons.map((m) => {
                const num = ORDER.indexOf(m.id) + 1
                const roman = ROMAN[Math.max(0, num - 1)] ?? ''
                return (
                  <View key={m.id} style={styles.compatibleRow}>
                    <Text style={styles.compatibleRoman}>{roman}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.compatibleName}>{m.maison}</Text>
                      <Text style={styles.compatibleSubtitle}>{m.subtitle}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </Animated.View>
        )}

        {/* Section "Comment fonctionne Kolmi" — explainer concis du modèle
            concierge. Dernier bloc avant le déclenchement du lift. */}
        <Animated.View style={[styles.afterCta, footerStyle]}>
          <View style={styles.sectionRule} />
          <Text style={styles.sectionLabel}>Comment fonctionne Kolmi</Text>
          <Text style={styles.descriptionText}>
            Kolmi n'est pas une app de swipe. C'est un entremetteur.
          </Text>
          <Text style={styles.descriptionText}>
            Chaque jour, une sélection curée de profils choisis pour vous —
            pas un flux infini, mais quelques rencontres possibles.
          </Text>
          <Text style={styles.descriptionText}>
            Vous demandez une rencontre, Kolmi s'occupe du reste : vérifie
            les disponibilités, propose un créneau, choisit un lieu. Pas de
            messages à échanger avant de vous voir — vous parlez en vrai.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.endHint, footerStyle]}>
          <Text style={styles.endHintText}>
            Continuez à descendre pour entrer
          </Text>
          <Animated.Text style={[styles.scrollHintArrow, hintArrowStyle]}>
            ↓
          </Animated.Text>
        </Animated.View>

      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  waitWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  waitText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 17,
    color: kolmiColors.textMuted,
    letterSpacing: 1.6,
  },
  body: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.md,
    paddingBottom: kolmiSpace.xl,
  },
  heroBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    marginTop: -kolmiSpace.xs,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: kolmiSpace.xs,
  },
  tagLine: {
    height: 1,
    width: 36,
    backgroundColor: kolmiColors.text,
    opacity: 0.7,
  },
  tagText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 10,
    color: kolmiColors.text,
    letterSpacing: 2.4,
  },
  nameWrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    height: 76,
    marginTop: kolmiSpace.sm,
  },
  name: {
    fontFamily: kolmiFonts.serif,
    fontSize: fontScale(64),
    lineHeight: 72,
    color: kolmiColors.text,
    letterSpacing: -1.6,
    textAlign: 'center',
    includeFontPadding: false,
  },
  nameMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 76,
    backgroundColor: kolmiColors.bg,
  },
  divider: {
    width: 56,
    height: 1.5,
    backgroundColor: kolmiColors.text,
    alignSelf: 'center',
    marginTop: kolmiSpace.md,
    marginBottom: kolmiSpace.sm,
  },
  italic: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 22,
    lineHeight: 28,
    color: kolmiColors.textBody,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  traitsList: {
    alignSelf: 'center',
    marginTop: kolmiSpace.xl,
    gap: 6,
  },
  traitRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  traitOrdinal: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 14,
    color: kolmiColors.accent,
    width: 28,
    textAlign: 'right',
    letterSpacing: 0.4,
  },
  traitText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 14,
    color: kolmiColors.text,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  scrollHint: {
    marginTop: kolmiSpace.xxl,
    alignItems: 'center',
    gap: 6,
  },
  scrollHintText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 14,
    color: kolmiColors.textMuted,
    letterSpacing: 0.2,
  },
  scrollHintArrow: {
    fontFamily: kolmiFonts.serif,
    fontSize: 18,
    color: kolmiColors.accent,
  },
  endHint: {
    marginTop: kolmiSpace.xxl,
    alignItems: 'center',
    gap: 6,
    paddingBottom: kolmiSpace.md,
  },
  endHintText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 14,
    color: kolmiColors.accent,
    letterSpacing: 0.2,
  },
  afterCta: {
    marginTop: kolmiSpace.xxl,
  },
  sectionRule: {
    height: 0.6,
    width: 36,
    backgroundColor: kolmiColors.accent,
    marginBottom: kolmiSpace.md,
  },
  sectionLabel: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textBody,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    marginBottom: kolmiSpace.md,
  },
  descriptionText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 17,
    lineHeight: 26,
    color: kolmiColors.text,
    letterSpacing: -0.1,
  },
  compatibleList: {
    gap: kolmiSpace.lg,
    marginTop: kolmiSpace.xs,
  },
  compatibleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: kolmiSpace.md,
  },
  compatibleRoman: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 22,
    color: kolmiColors.accent,
    width: 30,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  compatibleName: {
    fontFamily: kolmiFonts.serif,
    fontSize: 22,
    lineHeight: 26,
    color: kolmiColors.text,
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  compatibleSubtitle: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 14,
    lineHeight: 20,
    color: kolmiColors.textBody,
  },
})
