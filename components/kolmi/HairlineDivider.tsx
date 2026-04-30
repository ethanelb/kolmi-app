import React from 'react'
import Animated, { FadeIn } from 'react-native-reanimated'
import { kolmiColors } from '@/constants/kolmiTheme'
import { kolmiMotion } from '@/lib/kolmi/motion'

type Props = {
  delayMs?: number
  width?: number | `${number}%`
  color?: string
}

// Divider hairline qui apparaît en fade depuis transparent.
// Prend toute la largeur par défaut. Utilisé pour rythmer les blocs
// éditoriaux sans crier.
export default function HairlineDivider({
  delayMs = 0,
  width = '100%',
  color = kolmiColors.outline,
}: Props) {
  return (
    <Animated.View
      entering={FadeIn.delay(delayMs).duration(kolmiMotion.duration.lg).easing(
        kolmiMotion.easing.soft,
      )}
      style={{
        width,
        height: 1,
        backgroundColor: color,
        alignSelf: 'center',
      }}
    />
  )
}
