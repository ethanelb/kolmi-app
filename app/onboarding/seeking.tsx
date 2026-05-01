import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {
  kolmiColors,
  kolmiSpace,
  kolmiRadius,
  kolmiFonts,
  kolmiPaddingX,
} from '@/constants/kolmiTheme'
import SignupHeader from '@/components/kolmi/SignupHeader'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import {
  getKolmiPreferences,
  saveKolmiPreferences,
} from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'
import { select, tapMedium } from '@/lib/kolmi/haptics'

const SIGNUP_TOTAL_STEPS = 10
const MIN_AGE = 18
const MAX_AGE = 65
const MIN_GAP = 5

const TRACK_HEIGHT = 4
const THUMB_SIZE = 28
const SLIDER_HEIGHT = 44

export default function SeekingScreen() {
  const router = useRouter()
  const [minAge, setMinAge] = useState(22)
  const [maxAge, setMaxAge] = useState(35)

  useEffect(() => {
    getKolmiPreferences().then((prefs) => {
      if (!prefs) return
      setMinAge(prefs.minAge)
      setMaxAge(prefs.maxAge)
    })
  }, [])

  const onContinue = async () => {
    tapMedium()
    const ok = await safePersist(() =>
      saveKolmiPreferences({
        minAge,
        maxAge,
        distance: '25 km',
      }),
    )
    if (!ok) return
    router.push('/onboarding/photos')
  }

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <SignupHeader step={7} total={SIGNUP_TOTAL_STEPS} onBack={() => router.back()} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{'Quelle tranche\nd\'âge ?'}</Text>
          <Text style={styles.subtitle}>
            Indique la fourchette idéale. Écart minimum {MIN_GAP} ans.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tranche d'âge</Text>
            <Text style={styles.value}>{minAge} – {maxAge} ans</Text>

            <View style={styles.sliderWrap}>
              <AgeRangeSlider
                lower={minAge}
                upper={maxAge}
                onChange={(lo, hi) => {
                  setMinAge(lo)
                  setMaxAge(hi)
                }}
              />
              <View style={styles.sliderEdges}>
                <Text style={styles.sliderEdgeLabel}>{MIN_AGE}</Text>
                <Text style={styles.sliderEdgeLabel}>{MAX_AGE}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cta}
            onPress={onContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Continuer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

// ─── Age range slider (custom, gesture-driven) ────────────────────────
//
// Two thumbs on a horizontal track. Min gap of 5 years enforced. Soft
// haptic tick on each integer age change while dragging. onChange is
// called from the UI thread reaction → JS only when the integer
// representation actually changes, so we don't flood React with renders.

type SliderProps = {
  lower: number
  upper: number
  onChange: (lower: number, upper: number) => void
}

function AgeRangeSlider({ lower, upper, onChange }: SliderProps) {
  const [width, setWidth] = useState(0)
  const usable = Math.max(1, width - THUMB_SIZE)
  const range = MAX_AGE - MIN_AGE

  const ageToPx = (age: number) => ((age - MIN_AGE) / range) * usable
  const minGapPx = (MIN_GAP / range) * usable

  const lowerPx = useSharedValue(0)
  const upperPx = useSharedValue(0)
  const lastLowerInt = useSharedValue(lower)
  const lastUpperInt = useSharedValue(upper)

  // Sync shared values when dimensions or external props change.
  useEffect(() => {
    if (usable > 0) {
      lowerPx.value = ageToPx(lower)
      upperPx.value = ageToPx(upper)
      lastLowerInt.value = lower
      lastUpperInt.value = upper
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lower, upper, usable])

  // Bridge UI-thread shared value → JS only when integer ages change.
  useAnimatedReaction(
    () => ({
      lo: Math.round((lowerPx.value / usable) * range + MIN_AGE),
      hi: Math.round((upperPx.value / usable) * range + MIN_AGE),
    }),
    (curr, prev) => {
      if (!prev) return
      const lowerChanged = curr.lo !== lastLowerInt.value
      const upperChanged = curr.hi !== lastUpperInt.value
      if (lowerChanged || upperChanged) {
        lastLowerInt.value = curr.lo
        lastUpperInt.value = curr.hi
        runOnJS(onChange)(curr.lo, curr.hi)
        runOnJS(select)()
      }
    },
    [usable],
  )

  const lowerPan = Gesture.Pan()
    .onChange((e) => {
      'worklet'
      const next = Math.max(
        0,
        Math.min(upperPx.value - minGapPx, lowerPx.value + e.changeX),
      )
      lowerPx.value = next
    })
  const upperPan = Gesture.Pan()
    .onChange((e) => {
      'worklet'
      const next = Math.min(
        usable,
        Math.max(lowerPx.value + minGapPx, upperPx.value + e.changeX),
      )
      upperPx.value = next
    })

  const lowerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: lowerPx.value }],
  }))
  const upperStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: upperPx.value }],
  }))
  const activeStyle = useAnimatedStyle(() => ({
    left: lowerPx.value + THUMB_SIZE / 2,
    width: Math.max(0, upperPx.value - lowerPx.value),
  }))

  return (
    <View
      style={styles.sliderRoot}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.trackInactive} />
      <Animated.View style={[styles.trackActive, activeStyle]} />
      <GestureDetector gesture={lowerPan}>
        <Animated.View style={[styles.thumb, lowerStyle]} hitSlop={12} />
      </GestureDetector>
      <GestureDetector gesture={upperPan}>
        <Animated.View style={[styles.thumb, upperStyle]} hitSlop={12} />
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.lg,
    paddingBottom: kolmiSpace.lg,
    gap: kolmiSpace.lg,
  },
  title: {
    fontFamily: kolmiFonts.serif,
    fontSize: 36,
    color: kolmiColors.text,
    lineHeight: 42,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    color: kolmiColors.textBody,
    lineHeight: 24,
    marginTop: -kolmiSpace.sm,
    paddingRight: kolmiSpace.lg,
  },
  section: { gap: kolmiSpace.xs, marginTop: kolmiSpace.md },
  sectionLabel: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 12,
    color: kolmiColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  value: {
    fontFamily: kolmiFonts.serif,
    fontSize: 32,
    color: kolmiColors.accent,
    letterSpacing: -0.4,
    marginVertical: kolmiSpace.xs,
  },
  sliderWrap: {
    marginTop: kolmiSpace.md,
    paddingTop: kolmiSpace.sm,
  },
  sliderRoot: {
    height: SLIDER_HEIGHT,
    justifyContent: 'center',
    position: 'relative',
  },
  trackInactive: {
    position: 'absolute',
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: kolmiColors.outline,
  },
  trackActive: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: kolmiColors.accent,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: kolmiColors.accent,
    borderWidth: 2,
    borderColor: kolmiColors.bg,
    top: (SLIDER_HEIGHT - THUMB_SIZE) / 2,
    shadowColor: '#5A0A0A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  sliderEdges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: kolmiSpace.xs,
  },
  sliderEdgeLabel: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 12,
    color: kolmiColors.textMuted,
    letterSpacing: 0.4,
  },
  footer: {
    paddingHorizontal: kolmiPaddingX,
    paddingBottom: kolmiSpace.xl,
  },
  cta: {
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
})
