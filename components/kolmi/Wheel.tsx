import React, { useEffect, useMemo, useRef, useCallback } from 'react'
import {
  View,
  Text,
  Animated,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { kolmiColors, kolmiFonts, kolmiRadius } from '@/constants/kolmiTheme'

const ITEM_HEIGHT = 30
const VISIBLE_ROWS = 7
const HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS
const CYCLES = 100

interface Props<T extends string | number> {
  items: T[]
  value: T
  onChange: (v: T) => void
  width: number
  cycle?: boolean
}

// Wheel picker — opacity per row driven by Animated.Value bound to scroll
// position, so the visual selection follows the finger in real time (no
// dependence on the parent's committed value).
export default function Wheel<T extends string | number>({
  items,
  value,
  onChange,
  width,
  cycle = false,
}: Props<T>) {
  const ref = useRef<Animated.LegacyRef<typeof Animated.ScrollView>>(null) as React.MutableRefObject<any>
  const realIdx = items.indexOf(value)
  const lastReportedIdx = useRef(realIdx)
  const lastTickIdx = useRef(realIdx)

  const renderItems = useMemo(() => {
    if (!cycle) return items
    const out: T[] = []
    for (let c = 0; c < CYCLES; c++) {
      for (const item of items) out.push(item)
    }
    return out
  }, [items, cycle])

  const virtualIdx = cycle
    ? Math.floor(CYCLES / 2) * items.length + Math.max(0, realIdx)
    : Math.max(0, realIdx)

  const scrollY = useRef(new Animated.Value(virtualIdx * ITEM_HEIGHT)).current

  const scrollToVirtual = useCallback((vi: number, animated = false) => {
    ref.current?.scrollTo?.({ y: vi * ITEM_HEIGHT, animated })
  }, [])

  // Initial position + re-sync on external value change.
  useEffect(() => {
    const t = setTimeout(() => {
      scrollToVirtual(virtualIdx)
      scrollY.setValue(virtualIdx * ITEM_HEIGHT)
      lastReportedIdx.current = realIdx
      lastTickIdx.current = realIdx
    }, 0)
    return () => clearTimeout(t)
  }, [virtualIdx, realIdx, scrollToVirtual, scrollY])

  // Haptic tick when an item lands in the center band. Math.floor (rather
  // than Math.round) makes the tick fire when scrollY crosses an integer
  // multiple of ITEM_HEIGHT — i.e. exactly when the next item is centered
  // visually. selectionAsync is the soft "list selection changed" tick
  // Apple uses on UIPickerView.
  useEffect(() => {
    const id = scrollY.addListener(({ value: y }) => {
      const next = Math.floor(y / ITEM_HEIGHT)
      const real = cycle
        ? ((next % items.length) + items.length) % items.length
        : Math.max(0, Math.min(items.length - 1, next))
      if (real !== lastTickIdx.current) {
        lastTickIdx.current = real
        Haptics.selectionAsync().catch(() => {})
      }
    })
    return () => scrollY.removeListener(id)
  }, [scrollY, items.length, cycle])

  const handleEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y
      const next = Math.round(y / ITEM_HEIGHT)
      const real = cycle
        ? ((next % items.length) + items.length) % items.length
        : Math.max(0, Math.min(items.length - 1, next))

      if (real !== lastReportedIdx.current) {
        lastReportedIdx.current = real
        onChange(items[real])
      }

      // Cycle re-centering: silent jump back to the middle copy.
      if (cycle) {
        const middleStart = Math.floor(CYCLES / 2) * items.length
        const minSafe = items.length * 5
        const maxSafe = renderItems.length - items.length * 5
        if (next < minSafe || next > maxSafe) {
          requestAnimationFrame(() => {
            const target = (middleStart + real) * ITEM_HEIGHT
            scrollToVirtual(middleStart + real, false)
            scrollY.setValue(target)
          })
        }
      }
    },
    [items, cycle, onChange, renderItems.length, scrollToVirtual, scrollY],
  )

  return (
    <View style={[styles.container, { width, height: HEIGHT }]}>
      <View style={styles.band} pointerEvents="none" />
      <Animated.ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        onMomentumScrollEnd={handleEnd}
        contentContainerStyle={{
          paddingTop: HEIGHT / 2 - ITEM_HEIGHT / 2,
          paddingBottom: HEIGHT / 2 - ITEM_HEIGHT / 2,
        }}
      >
        {renderItems.map((item, i) => {
          const itemY = i * ITEM_HEIGHT
          // Opacity falls off with distance from the band (scrollY).
          const opacity = scrollY.interpolate({
            inputRange: [
              itemY - 3 * ITEM_HEIGHT,
              itemY - 2 * ITEM_HEIGHT,
              itemY - ITEM_HEIGHT,
              itemY,
              itemY + ITEM_HEIGHT,
              itemY + 2 * ITEM_HEIGHT,
              itemY + 3 * ITEM_HEIGHT,
            ],
            outputRange: [0, 0.25, 0.55, 1, 0.55, 0.25, 0],
            extrapolate: 'clamp',
          })
          const scale = scrollY.interpolate({
            inputRange: [itemY - ITEM_HEIGHT, itemY, itemY + ITEM_HEIGHT],
            outputRange: [0.92, 1, 0.92],
            extrapolate: 'clamp',
          })
          return (
            <Animated.View
              key={`${item}-${i}`}
              style={[styles.row, { opacity, transform: [{ scale }] }]}
            >
              <Text style={styles.label}>{item}</Text>
            </Animated.View>
          )
        })}
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    top: HEIGHT / 2 - ITEM_HEIGHT / 2 - 3,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT + 6,
    backgroundColor: kolmiColors.surfaceWheel,
    borderRadius: kolmiRadius.md,
    zIndex: 0,
  },
  row: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 18,
    color: kolmiColors.text,
    fontFamily: kolmiFonts.serifLegacy,
    includeFontPadding: false,
  },
})
