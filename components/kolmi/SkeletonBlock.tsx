import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

export default function SkeletonBlock({
  width,
  height,
  radius = 6,
}: {
  width: number | `${number}%`
  height: number
  radius?: number
}) {
  const [layoutWidth, setLayoutWidth] = useState(0)
  const progress = useSharedValue(-1)

  useEffect(() => {
    if (layoutWidth === 0) return
    progress.value = -1
    progress.value = withRepeat(
      withTiming(1, {
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false,
    )
  }, [layoutWidth, progress])

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * layoutWidth }],
  }))

  return (
    <View
      onLayout={(e) => {
        const next = e.nativeEvent.layout.width
        if (next !== layoutWidth) setLayoutWidth(next)
      }}
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: 'rgba(22,19,15,0.07)',
      }}
    >
      {layoutWidth > 0 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: layoutWidth,
            },
            shimmerStyle,
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(250,248,245,0)',
              'rgba(250,248,245,0.55)',
              'rgba(250,248,245,0)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  )
}
