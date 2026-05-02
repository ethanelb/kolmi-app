import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated'
import { kolmiColors, kolmiFonts, kolmiRadius } from '@/constants/kolmiTheme'
import { success } from '@/lib/kolmi/haptics'

type Props = {
  label?: string
  confirmedLabel?: string
  onConfirm: () => void
  disabled?: boolean
}

const TRACK_HEIGHT = 56
const THUMB_SIZE = 48
const THUMB_INSET = (TRACK_HEIGHT - THUMB_SIZE) / 2
const SNAP_THRESHOLD = 0.75 // ≥ 75 % du chemin → confirmé

// Bouton swipe-to-confirm bordeaux. L'utilisateur tire le pouce (le
// rond crème) horizontalement. La trace bordeaux se remplit derrière.
// Au-delà de 75 % du chemin au release → spring jusqu'à 1, haptic
// success, et `onConfirm()` est appelé une seule fois sur le thread JS.
// Sinon, spring back à 0 (pas de pénalité).
function SwipeToConfirm({
  label = 'Glisser pour confirmer',
  confirmedLabel = 'Confirmé.',
  onConfirm,
  disabled = false,
}: Props) {
  // progress : 0 = repos · 1 = confirmé. width animé du fill via cette
  // valeur. Le pouce et le label suivent.
  const progress = useSharedValue(0)
  // Largeur mesurée du track — sert à convertir le drag (px) en
  // progress (0-1). Mise à jour via onLayout.
  const trackWidth = useSharedValue(0)
  // Pulse fin du chevron `→` au repos pour inviter au geste.
  const chevronShift = useSharedValue(0)
  // Flag JS : a déjà confirmé (évite double-call).
  const hasConfirmedRef = React.useRef(false)

  useEffect(() => {
    if (disabled) return
    // Mini balancement du chevron : 0 → +6 → 0 en boucle (≈ 1,4 s).
    chevronShift.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(6, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    )
  }, [disabled, chevronShift])

  function callConfirm() {
    if (hasConfirmedRef.current) return
    hasConfirmedRef.current = true
    success()
    onConfirm()
  }

  // Pan gesture : on ne pilote que progress (0-1). On clamp pour pas que
  // le pouce sorte du track. Sur release, on snap : <0.75 → 0, ≥0.75 → 1.
  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onUpdate((e) => {
      'worklet'
      if (trackWidth.value <= 0) return
      const max = trackWidth.value - THUMB_SIZE - THUMB_INSET * 2
      const next = Math.max(0, Math.min(1, e.translationX / max))
      progress.value = next
    })
    .onEnd(() => {
      'worklet'
      if (progress.value >= SNAP_THRESHOLD) {
        progress.value = withSpring(1, { damping: 16, stiffness: 140 })
        runOnJS(callConfirm)()
      } else {
        progress.value = withSpring(0, { damping: 18, stiffness: 160 })
      }
    })

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }))

  const thumbStyle = useAnimatedStyle(() => {
    const max = trackWidth.value - THUMB_SIZE - THUMB_INSET * 2
    return {
      transform: [{ translateX: progress.value * Math.max(0, max) }],
    }
  })

  // Le label "Glisser pour confirmer" fade-out à mesure que le pouce
  // avance ; le label "Confirmé." fade-in au-delà de 75 %.
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6], [1, 0], Extrapolation.CLAMP),
  }))
  const confirmedLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [SNAP_THRESHOLD - 0.05, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }))

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: chevronShift.value }],
    opacity: interpolate(progress.value, [0, 0.3], [1, 0], Extrapolation.CLAMP),
  }))

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        onLayout={(e) => {
          trackWidth.value = e.nativeEvent.layout.width
        }}
        style={[
          styles.track,
          disabled && styles.trackDisabled,
        ]}
      >
        {/* Fill bordeaux qui suit progress * 100 % */}
        <Animated.View style={[styles.fill, fillStyle]} />

        {/* Labels superposés au centre */}
        <Animated.Text
          style={[styles.label, labelStyle]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
        <Animated.Text
          style={[styles.confirmedLabel, confirmedLabelStyle]}
          numberOfLines={1}
        >
          {confirmedLabel}
        </Animated.Text>

        {/* Chevron à droite (visible quand progress ~ 0) */}
        <Animated.Text style={[styles.chevron, chevronStyle]}>›</Animated.Text>

        {/* Thumb (cercle crème) */}
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <Text style={styles.thumbArrow}>→</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    borderRadius: kolmiRadius.pill,
    backgroundColor: kolmiColors.accent,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowColor: '#5A0A0A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  trackDisabled: {
    backgroundColor: kolmiColors.surfaceSoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: kolmiColors.accentDeep,
  },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 16,
    color: kolmiColors.white,
    letterSpacing: 0.4,
  },
  confirmedLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 18,
    color: kolmiColors.white,
    letterSpacing: 0.2,
  },
  chevron: {
    position: 'absolute',
    right: 22,
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 20,
    color: 'rgba(255,255,255,0.85)',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: THUMB_INSET,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbArrow: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 18,
    color: kolmiColors.accent,
  },
})

export default React.memo(SwipeToConfirm)
