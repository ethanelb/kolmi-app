import React, { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Rect } from 'react-native-svg'

interface Props {
  opacity?: number
  density?: number
}

// Off-white paper grain — uniform, fine, random speckle.
// Matches the reference: a clean white-cream sheet with consistent fine
// grain across the whole surface. No vignette, no fibers, no blotches.
export default function GrainOverlay({ opacity = 1, density = 5200 }: Props) {
  const specks = useMemo(() => {
    let s = 1
    const rand = () => {
      s = (s * 1664525 + 1013904223) % 4294967296
      return s / 4294967296
    }
    const out: { x: number; y: number; o: number; w: number; light: boolean }[] = []
    for (let i = 0; i < density; i++) {
      const isLight = rand() < 0.25
      out.push({
        x: rand() * 400,
        y: rand() * 900,
        o: isLight ? 0.05 + rand() * 0.1 : 0.07 + rand() * 0.22,
        w: rand() < 0.88 ? 1 : 1.4,
        light: isLight,
      })
    }
    return out
  }, [density])

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { opacity, backgroundColor: '#F5F2EC' },
      ]}
      pointerEvents="none"
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 900"
        preserveAspectRatio="xMidYMid slice"
      >
        {specks.map((p, i) => (
          <Rect
            key={i}
            x={p.x}
            y={p.y}
            width={p.w}
            height={p.w}
            fill={p.light ? '#FFFFFF' : '#1A140C'}
            fillOpacity={p.o}
          />
        ))}
      </Svg>
    </View>
  )
}
