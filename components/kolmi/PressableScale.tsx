import React from 'react'
import { Pressable, type PressableProps, type ViewStyle, type StyleProp } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import { kolmiMotion } from '@/lib/kolmi/motion'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

type Props = PressableProps & {
  scaleTo?: number
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}

// CTA / carte avec retour tactile : un léger scale au press.
// Reste cohérent avec le ton cream paper — pas de bounce.
export default function PressableScale({
  scaleTo = 0.97,
  children,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <AnimatedPressable
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, {
          duration: 90,
          easing: kolmiMotion.easing.snappy,
        })
        onPressIn?.(e)
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, {
          duration: 220,
          easing: kolmiMotion.easing.soft,
        })
        onPressOut?.(e)
      }}
      style={[animatedStyle, style]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  )
}
