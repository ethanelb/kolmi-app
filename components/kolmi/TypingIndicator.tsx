import React, { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'

// Three small ink-blot dots that pulse — no bubble, no avatar.
// Echoes the editorial "correspondance" treatment: just typography
// (or its absence) flowing on the page.
export default function TypingIndicator() {
  const a = useRef(new Animated.Value(0)).current
  const b = useRef(new Animated.Value(0)).current
  const c = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const pulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 480,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 480,
            useNativeDriver: true,
          }),
        ]),
      )
    const loops = [pulse(a, 0), pulse(b, 160), pulse(c, 320)]
    loops.forEach((l) => l.start())
    return () => loops.forEach((l) => l.stop())
  }, [a, b, c])

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginVertical: 18,
        paddingLeft: 4,
      }}
    >
      <InkDot value={a} />
      <InkDot value={b} />
      <InkDot value={c} />
    </View>
  )
}

function InkDot({ value }: { value: Animated.Value }) {
  return (
    <Animated.View
      style={{
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#1A140C',
        opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.85] }),
        transform: [
          {
            scale: value.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1.2],
            }),
          },
        ],
      }}
    />
  )
}
