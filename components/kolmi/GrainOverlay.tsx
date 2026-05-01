import React from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Rect } from 'react-native-svg'

interface Props {
  opacity?: number
  density?: number
}

type Speck = { x: number; y: number; o: number; w: number; light: boolean }

// The grain pattern is identical on every screen — compute it ONCE per density
// at module scope so screen mounts pay zero generation cost and React reuses
// the same array reference across all instances.
const SPECK_CACHE = new Map<number, Speck[]>()

function getSpecks(density: number): Speck[] {
  const cached = SPECK_CACHE.get(density)
  if (cached) return cached
  let s = 1
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
  const out: Speck[] = []
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
  SPECK_CACHE.set(density, out)
  return out
}

// Off-white paper grain — uniform, fine, random speckle.
// Density tuned to keep the editorial look while drastically reducing the
// number of SVG nodes per screen mount (was 5200 → 1200). On a phone screen
// the grain is still visually fine but mounts ~4× faster.
function GrainOverlay({ opacity = 1, density = 1200 }: Props) {
  const specks = getSpecks(density)

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

export default React.memo(GrainOverlay)
