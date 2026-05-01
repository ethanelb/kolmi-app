import React, { useEffect, useState } from 'react'
import Animated, {
  Easing,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import { kolmiMotion } from '@/lib/kolmi/motion'

type Props = {
  value: number
  durationMs?: number
  style?: React.ComponentProps<typeof Animated.Text>['style']
}

// Compteur entier qui s'anime de l'ancienne valeur vers la nouvelle.
// Utilisé pour le solde de tokens — donne du poids au crédit ou au débit
// sans cliper visuellement le chiffre.
export default function AnimatedCounter({ value, durationMs = kolmiMotion.duration.lg, style }: Props) {
  const sv = useSharedValue(value)
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    sv.value = withTiming(value, {
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
    })
  }, [value, durationMs, sv])

  // `prepare` arrondit dans le worklet : `react` ne se déclenche que quand
  // l'entier change (≈ 5 fois sur 600 ms d'anim) au lieu de toutes les
  // frames. Évite ~55 appels bridge/sec inutiles pendant l'animation des
  // tokens.
  useAnimatedReaction(
    () => Math.round(sv.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplay)(current)
      }
    },
    [],
  )

  return <Animated.Text style={style}>{display}</Animated.Text>
}
