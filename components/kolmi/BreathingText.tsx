import React, { useEffect } from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

type Props = {
  children: React.ReactNode
  // Cycle complet (in + out) en ms
  durationMs?: number
  // Opacité minimale (0..1) — l'opacité oscille entre 1.0 et minOpacity.
  minOpacity?: number
  style?: React.ComponentProps<typeof Animated.Text>['style']
}

// Texte qui respire doucement — utilisé pour rappeler que la Maison
// "vit" sans mouvement violent. À utiliser avec parcimonie : un seul
// élément de la page doit respirer à la fois.
export default function BreathingText({
  children,
  durationMs = 3600,
  minOpacity = 0.78,
  style,
}: Props) {
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(minOpacity, {
        duration: durationMs / 2,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    )
  }, [opacity, durationMs, minOpacity])

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return <Animated.Text style={[style, animStyle]}>{children}</Animated.Text>
}
