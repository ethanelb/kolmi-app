import React, { useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { kolmiColors, kolmiFonts, kolmiSpace } from '@/constants/kolmiTheme'
import { select } from '@/lib/kolmi/haptics'

export type EncounterSegment = 'active' | 'past' | 'archive'

type Props = {
  value: EncounterSegment
  onChange: (next: EncounterSegment) => void
  counts?: Partial<Record<EncounterSegment, number>>
}

const SEGMENTS: { id: EncounterSegment; label: string }[] = [
  { id: 'active', label: 'Actives' },
  { id: 'past', label: 'Passées' },
  { id: 'archive', label: 'Archives' },
]

// Segmented control 3 boutons. Trait bordeaux animé (Reanimated spring)
// glisse sous l'option active. Compteurs en exposant si fournis.
function EncountersSegmentedControl({ value, onChange, counts }: Props) {
  const indicatorX = useSharedValue(0)
  const indicatorWidth = useSharedValue(0)
  const segWidthsRef = React.useRef<Record<EncounterSegment, { x: number; w: number }>>({
    active: { x: 0, w: 0 },
    past: { x: 0, w: 0 },
    archive: { x: 0, w: 0 },
  })

  const recomputeIndicator = (id: EncounterSegment) => {
    const r = segWidthsRef.current[id]
    indicatorX.value = withSpring(r.x, { damping: 18, stiffness: 180 })
    indicatorWidth.value = withSpring(r.w, { damping: 18, stiffness: 180 })
  }

  useEffect(() => {
    recomputeIndicator(value)
  }, [value])

  const handleLayout = (id: EncounterSegment) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout
    segWidthsRef.current[id] = { x, w: width }
    if (id === value) {
      // First measurement → snap without spring
      indicatorX.value = x
      indicatorWidth.value = width
    }
  }

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }))

  return (
    <View style={styles.wrap}>
      <View style={styles.segmentsRow}>
        {SEGMENTS.map(({ id, label }) => {
          const isActive = id === value
          const count = counts?.[id]
          return (
            <Pressable
              key={id}
              onPress={() => {
                if (id !== value) {
                  select()
                  onChange(id)
                }
              }}
              onLayout={handleLayout(id)}
              style={styles.segment}
              hitSlop={6}
            >
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {label}
                {count !== undefined && count > 0 ? (
                  <Text style={styles.count}>  ·  {count}</Text>
                ) : null}
              </Text>
            </Pressable>
          )
        })}
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.indicator, indicatorStyle]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: kolmiSpace.sm,
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: kolmiSpace.lg,
    paddingBottom: kolmiSpace.xs,
  },
  segment: {
    paddingVertical: 6,
  },
  segmentText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 13,
    color: kolmiColors.textMuted,
    letterSpacing: 0.4,
  },
  segmentTextActive: {
    fontFamily: kolmiFonts.uiSemiBold,
    color: kolmiColors.text,
  },
  count: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 12,
    color: kolmiColors.accent,
  },
  track: {
    height: 1,
    backgroundColor: 'rgba(26,26,26,0.10)',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    height: 1.6,
    backgroundColor: kolmiColors.accent,
    top: -0.3,
    left: 0,
  },
})

export default React.memo(EncountersSegmentedControl)
