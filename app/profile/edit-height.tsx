import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import {
  kolmiColors,
  kolmiSpace,
  kolmiRadius,
  kolmiFonts,
  kolmiPaddingX,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { getKolmiProfile, saveKolmiProfile } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'

const ITEM_HEIGHT = 56
const VISIBLE_ITEMS = 5
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS

const CM_VALUES = Array.from({ length: 81 }, (_, i) => 140 + i)

const FT_VALUES: { label: string; cm: number }[] = []
for (let totalIn = 54; totalIn <= 84; totalIn++) {
  const ft = Math.floor(totalIn / 12)
  const inch = totalIn % 12
  FT_VALUES.push({ label: `${ft}'${inch}"`, cm: Math.round(totalIn * 2.54) })
}

export default function EditHeightScreen() {
  const router = useRouter()
  const [unit, setUnit] = useState<'cm' | 'ft'>('cm')
  const [selectedCm, setSelectedCm] = useState(170)

  const scrollRef = useRef<any>(null)
  const lastHapticIndex = useRef(-1)
  const scrollY = useRef(new Animated.Value(0)).current
  const hydratedRef = useRef(false)

  const cmIndex = CM_VALUES.indexOf(selectedCm)
  const ftIndex = FT_VALUES.findIndex(v => v.cm === selectedCm) ?? 0

  const scrollToIndex = useCallback((index: number, animated = true) => {
    scrollRef.current?.scrollTo?.({ y: index * ITEM_HEIGHT, animated })
    if (!animated) scrollY.setValue(index * ITEM_HEIGHT)
  }, [scrollY])

  useEffect(() => {
    getKolmiProfile().then((p) => {
      if (typeof p.heightCm === 'number') {
        setSelectedCm(p.heightCm)
        setTimeout(() => {
          const idx = unit === 'cm'
            ? CM_VALUES.indexOf(p.heightCm!)
            : FT_VALUES.findIndex(v => v.cm === p.heightCm)
          if (idx >= 0) {
            lastHapticIndex.current = idx
            scrollToIndex(idx, false)
          }
        }, 50)
      }
      hydratedRef.current = true
    })
  }, [scrollToIndex, unit])

  useEffect(() => {
    const id = scrollY.addListener(({ value: y }) => {
      const idx = Math.floor(y / ITEM_HEIGHT)
      if (idx === lastHapticIndex.current) return
      lastHapticIndex.current = idx
      Haptics.selectionAsync().catch(() => {})
      const liveValue =
        unit === 'cm' ? CM_VALUES[idx] : FT_VALUES[idx]?.cm
      if (liveValue !== undefined) setSelectedCm(liveValue)
    })
    return () => scrollY.removeListener(id)
  }, [scrollY, unit])

  const handleUnitToggle = (newUnit: 'cm' | 'ft') => {
    if (newUnit === unit) return
    Haptics.selectionAsync()
    setUnit(newUnit)
    if (newUnit === 'ft') {
      const idx = FT_VALUES.findIndex(v => v.cm >= selectedCm)
      setTimeout(() => scrollToIndex(Math.max(0, idx), false), 50)
    } else {
      const idx = CM_VALUES.indexOf(selectedCm)
      setTimeout(() => scrollToIndex(Math.max(0, idx), false), 50)
    }
  }

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y
    const index = Math.round(offsetY / ITEM_HEIGHT)
    if (unit === 'cm') {
      const val = CM_VALUES[index]
      if (val !== undefined) setSelectedCm(val)
    } else {
      const val = FT_VALUES[index]
      if (val !== undefined) setSelectedCm(val.cm)
    }
  }

  const values = unit === 'cm'
    ? CM_VALUES.map(v => `${v}`)
    : FT_VALUES.map(v => v.label)

  const selectedLabel = unit === 'cm'
    ? `${selectedCm} cm`
    : FT_VALUES.find(v => v.cm === selectedCm)?.label ?? `${selectedCm}`

  const initialIndex = unit === 'cm' ? cmIndex : ftIndex

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ paddingVertical: 4 }}
          >
            <Svg width={10} height={18} viewBox="0 0 10 18" fill="none">
              <Path
                d="M9 1L1 9L9 17"
                stroke={kolmiColors.text}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{'Quelle est\nvotre taille ?'}</Text>
          <Text style={styles.subtitle}>
            Affichée sur votre profil pour mieux matcher
          </Text>

          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[styles.unitBtn, unit === 'cm' && styles.unitBtnActive]}
              onPress={() => handleUnitToggle('cm')}
              activeOpacity={0.7}
            >
              <Text style={[styles.unitText, unit === 'cm' && styles.unitTextActive]}>cm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitBtn, unit === 'ft' && styles.unitBtnActive]}
              onPress={() => handleUnitToggle('ft')}
              activeOpacity={0.7}
            >
              <Text style={[styles.unitText, unit === 'ft' && styles.unitTextActive]}>ft / in</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.selectedValue}>{selectedLabel}</Text>

          <View style={styles.pickerWrapper}>
            <View style={styles.selectionHighlight} pointerEvents="none" />

            <Animated.ScrollView
              ref={scrollRef}
              style={styles.picker}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true },
              )}
              onMomentumScrollEnd={handleScrollEnd}
              scrollEventThrottle={16}
              contentOffset={{ x: 0, y: initialIndex * ITEM_HEIGHT }}
            >
              <View style={{ height: ITEM_HEIGHT * 2 }} />

              {values.map((val, i) => {
                const itemY = i * ITEM_HEIGHT
                const opacity = scrollY.interpolate({
                  inputRange: [
                    itemY - 2 * ITEM_HEIGHT,
                    itemY - ITEM_HEIGHT,
                    itemY,
                    itemY + ITEM_HEIGHT,
                    itemY + 2 * ITEM_HEIGHT,
                  ],
                  outputRange: [0.2, 0.5, 1, 0.5, 0.2],
                  extrapolate: 'clamp',
                })
                const scale = scrollY.interpolate({
                  inputRange: [itemY - ITEM_HEIGHT, itemY, itemY + ITEM_HEIGHT],
                  outputRange: [0.88, 1, 0.88],
                  extrapolate: 'clamp',
                })
                return (
                  <View key={val} style={[styles.pickerItem, { height: ITEM_HEIGHT }]}>
                    <Animated.Text
                      style={[
                        styles.pickerItemText,
                        { opacity, transform: [{ scale }] },
                      ]}
                    >
                      {val}
                    </Animated.Text>
                  </View>
                )
              })}

              <View style={{ height: ITEM_HEIGHT * 2 }} />
            </Animated.ScrollView>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cta}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              const ok = await safePersist(() =>
                saveKolmiProfile({ heightCm: selectedCm }),
              )
              if (!ok) return
              router.back()
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.xs,
    paddingBottom: kolmiSpace.sm,
  },
  body: {
    flex: 1,
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.lg,
  },
  title: {
    fontFamily: kolmiFonts.serif,
    fontSize: 36,
    color: kolmiColors.text,
    lineHeight: 42,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: kolmiFonts.ui,
    fontSize: 14,
    color: kolmiColors.textBody,
    lineHeight: 21,
    marginTop: kolmiSpace.sm,
  },

  unitToggle: {
    flexDirection: 'row',
    backgroundColor: kolmiColors.surfaceSoft,
    borderRadius: kolmiRadius.pill,
    padding: 4,
    alignSelf: 'center',
    marginTop: kolmiSpace.xl,
  },
  unitBtn: {
    paddingHorizontal: kolmiSpace.xl,
    paddingVertical: kolmiSpace.xs,
    borderRadius: kolmiRadius.pill,
  },
  unitBtnActive: {
    backgroundColor: kolmiColors.accent,
  },
  unitText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 13,
    color: kolmiColors.textSecondary,
    letterSpacing: 0.3,
  },
  unitTextActive: {
    color: kolmiColors.white,
    fontFamily: kolmiFonts.uiSemiBold,
  },

  selectedValue: {
    fontFamily: kolmiFonts.serif,
    fontSize: 44,
    color: kolmiColors.accent,
    textAlign: 'center',
    letterSpacing: -1,
    marginTop: kolmiSpace.lg,
  },

  pickerWrapper: {
    height: PICKER_HEIGHT,
    position: 'relative',
    marginTop: kolmiSpace.md,
  },
  picker: { flex: 1 },
  pickerItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemText: {
    fontFamily: kolmiFonts.serifLegacyRegular,
    fontSize: 22,
    color: kolmiColors.text,
  },
  pickerItemTextActive: {
    fontFamily: kolmiFonts.serifLegacy,
    fontSize: 26,
    color: kolmiColors.text,
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: kolmiColors.surfaceWheel,
    borderRadius: kolmiRadius.md,
    zIndex: 0,
  },

  footer: {
    paddingHorizontal: kolmiPaddingX,
    paddingBottom: kolmiSpace.xl,
  },
  cta: {
    height: 56,
    borderRadius: kolmiRadius.pill,
    backgroundColor: kolmiColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5A0A0A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  ctaText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 16,
    color: kolmiColors.white,
    letterSpacing: 0.2,
  },
})
