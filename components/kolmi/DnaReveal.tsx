import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
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
} from '@/constants/kolmiTheme'
import { dnaCategories, type DnaCategoryId } from '@/data/kolmiDna'
import type { KolmiDnaResult } from '@/lib/kolmi/types'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
const ROMAN_LOWER = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii']

const ORDER: DnaCategoryId[] = [
  'cinabre',
  'carmen',
  'saudade',
  'terracotta',
  'montparnasse',
  'bauhaus',
  'bloomsbury',
  'indigo',
]

const SCREEN_HEIGHT = Dimensions.get('window').height

type Props = {
  result: KolmiDnaResult
  onContinue: () => void
  instant?: boolean
  continueLabel?: string
}

export default function DnaReveal({
  result,
  onContinue,
  instant = false,
  continueLabel = 'Découvrir mes profils',
}: Props) {
  const category = dnaCategories[result.categoryId]
  const number = ORDER.indexOf(result.categoryId) + 1
  const finalNumeral = ROMAN[Math.max(0, number - 1)] ?? 'I'
  const titleLower = category.title.toLowerCase()
  const traits = category.traits.slice(0, 5)

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

  const ctaOpacity = useSharedValue(0)
  const ctaTranslate = useSharedValue(20)
  const footerOpacity = useSharedValue(0)

  const [skipped, setSkipped] = useState(instant)
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
    ctaOpacity.value = 1
    ctaTranslate.value = 0
    footerOpacity.value = 1
    setSkipped(true)
  }, [
    waitOpacity, waitPulse, numeralOpacity, numeralTranslate, numeralTilt,
    numeralShake, tagOpacity, tagSpread, nameOpacity, nameTranslate, nameClip,
    dividerWidth, italicOpacity, trait0, trait1, trait2, trait3, trait4,
    ctaOpacity, ctaTranslate, footerOpacity,
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

    ctaOpacity.value = withDelay(5500, withTiming(1, { duration: 500 }))
    ctaTranslate.value = withDelay(
      5500,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
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
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslate.value }],
  }))
  const footerStyle = useAnimatedStyle(() => ({ opacity: footerOpacity.value }))

  return (
    <Pressable
      style={{ flex: 1 }}
      onPress={skipped ? undefined : snapToFinal}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, styles.waitWrap, waitStyle]}
      >
        <Text style={styles.waitText}>— Lecture en cours —</Text>
      </Animated.View>

      <View style={styles.body}>
        <View style={styles.heroBlock}>
          <Animated.Text
            style={[styles.numeral, numeralStyle]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {finalNumeral}
          </Animated.Text>
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

        <View style={styles.spacer} />

        <Animated.View style={[styles.ctaWrap, ctaStyle]}>
          <TouchableOpacity
            onPress={onContinue}
            activeOpacity={0.85}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>{continueLabel}</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text style={[styles.footer, footerStyle]}>
          Cabinet d&apos;AURIA · KOLMI · MMXXVI
        </Animated.Text>
      </View>
    </Pressable>
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
    flex: 1,
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.md,
    paddingBottom: kolmiSpace.lg,
  },
  heroBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 230,
    marginTop: -kolmiSpace.md,
  },
  numeral: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 220,
    lineHeight: 230,
    color: kolmiColors.accent,
    letterSpacing: -2,
    includeFontPadding: false,
    textAlign: 'center',
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
    fontSize: 64,
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
  spacer: {
    flex: 1,
  },
  ctaWrap: {
    marginTop: kolmiSpace.lg,
  },
  ctaButton: {
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
  },
  ctaText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 16,
    color: kolmiColors.white,
    letterSpacing: 0.2,
  },
  footer: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 9,
    color: kolmiColors.textMuted,
    letterSpacing: 2.6,
    textAlign: 'center',
    marginTop: kolmiSpace.md,
  },
})
