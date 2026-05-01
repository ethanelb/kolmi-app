import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import {
  kolmiColors,
  kolmiSpace,
  kolmiRadius,
  kolmiFonts,
  kolmiPaddingX,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { tapLight, tapMedium } from '@/lib/kolmi/haptics'
import { getKolmiProfile, saveKolmiProfile } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'
import { pickProfilePhoto } from '@/lib/kolmi/photoPicker'

const { width } = Dimensions.get('window')
const SLOT_GAP = 10
const COLS = 3
const ROWS = 2
const TOTAL_SLOTS = COLS * ROWS
const MIN_PHOTOS = 2
const SLOT_SIZE = (width - kolmiPaddingX * 2 - SLOT_GAP * 2) / COLS
const SLOT_HEIGHT = SLOT_SIZE * 1.3

type PhotoSlotProps = {
  index: number
  photo: string | null
  isRequired: boolean
  onAdd: (i: number) => void
  onRemove: (i: number) => void
  onReorder: (from: number, to: number) => void
}

function PhotoSlot({ index, photo, isRequired, onAdd, onRemove, onReorder }: PhotoSlotProps) {
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const scale = useSharedValue(1)
  const dragging = useSharedValue(0)

  const pan = Gesture.Pan()
    .enabled(!!photo)
    .activateAfterLongPress(250)
    .onStart(() => {
      dragging.value = 1
      scale.value = withSpring(1.08, { damping: 14, stiffness: 220 })
      runOnJS(tapLight)()
    })
    .onUpdate((e) => {
      translateX.value = e.translationX
      translateY.value = e.translationY
    })
    .onEnd((e) => {
      const col = index % COLS
      const row = Math.floor(index / COLS)
      const targetCol = Math.max(
        0,
        Math.min(COLS - 1, Math.round(col + e.translationX / (SLOT_SIZE + SLOT_GAP))),
      )
      const targetRow = Math.max(
        0,
        Math.min(ROWS - 1, Math.round(row + e.translationY / (SLOT_HEIGHT + SLOT_GAP))),
      )
      const targetIndex = targetRow * COLS + targetCol
      if (targetIndex !== index) {
        runOnJS(onReorder)(index, targetIndex)
      }
      translateX.value = withSpring(0, { damping: 18, stiffness: 220 })
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 })
      scale.value = withSpring(1, { damping: 18, stiffness: 220 })
      dragging.value = withTiming(0, { duration: 180 })
    })
    .onFinalize(() => {
      translateX.value = withSpring(0)
      translateY.value = withSpring(0)
      scale.value = withSpring(1)
      dragging.value = withTiming(0, { duration: 180 })
    })

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: dragging.value > 0 ? 20 : 0,
    elevation: dragging.value > 0 ? 12 : 0,
    shadowOpacity: dragging.value * 0.22,
  }))

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.slotWrap, animStyle]}>
        <TouchableOpacity
          style={[
            styles.slot,
            !photo && isRequired && styles.slotRequired,
            !photo && !isRequired && styles.slotOptional,
            photo && styles.slotFilled,
          ]}
          onPress={() => {
            if (photo) return
            tapLight()
            onAdd(index)
          }}
          activeOpacity={photo ? 1 : 0.75}
        >
          {photo ? (
            <>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => onRemove(index)}
                hitSlop={8}
              >
                <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                  <Path
                    d="M1 1L9 9 M9 1L1 9"
                    stroke={kolmiColors.white}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                  />
                </Svg>
              </TouchableOpacity>
            </>
          ) : (
            <Text
              style={[
                styles.plus,
                isRequired ? styles.plusRequired : styles.plusOptional,
              ]}
            >
              +
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  )
}

export default function EditPhotosScreen() {
  const router = useRouter()
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null, null, null])

  useEffect(() => {
    getKolmiProfile().then((p) => {
      if (p.photoUrls?.length) {
        const slots: (string | null)[] = Array(TOTAL_SLOTS).fill(null)
        p.photoUrls.forEach((url, i) => {
          if (i < TOTAL_SLOTS) slots[i] = url
        })
        setPhotos(slots)
      }
    })
  }, [])

  const filledCount = photos.filter(Boolean).length
  const isValid = filledCount >= MIN_PHOTOS

  const addPhoto = async (index: number) => {
    const uri = await pickProfilePhoto()
    if (!uri) return
    setPhotos((prev) => {
      const next = [...prev]
      next[index] = uri
      return next
    })
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const next = [...prev]
      next[index] = null
      return next
    })
  }

  const reorderPhotos = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= TOTAL_SLOTS || to >= TOTAL_SLOTS) return
    setPhotos((prev) => {
      const next = [...prev]
      const tmp = next[from]
      next[from] = next[to]
      next[to] = tmp
      return next
    })
    tapMedium()
  }

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
          <Text style={styles.title}>Vos photos</Text>
          <Text style={styles.subtitle}>
            Glissez pour réorganiser, touchez pour ajouter/retirer
          </Text>

          <View style={styles.grid}>
            {photos.map((photo, i) => (
              <PhotoSlot
                key={i}
                index={i}
                photo={photo}
                isRequired={i < MIN_PHOTOS}
                onAdd={(idx) => {
                  void addPhoto(idx)
                }}
                onRemove={removePhoto}
                onReorder={reorderPhotos}
              />
            ))}
          </View>

          <Text style={styles.hint}>
            Maintenez une photo et glissez pour réorganiser · {MIN_PHOTOS} photos minimum
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, !isValid && styles.ctaDisabled]}
            onPress={async () => {
              if (!isValid) return
              tapMedium()
              const ok = await safePersist(() =>
                saveKolmiProfile({
                  photoUrls: photos.filter((p): p is string => Boolean(p)),
                }),
              )
              if (!ok) return
              router.back()
            }}
            activeOpacity={isValid ? 0.85 : 1}
          >
            <Text style={[styles.ctaText, !isValid && styles.ctaTextDisabled]}>
              Enregistrer
            </Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SLOT_GAP,
    marginTop: kolmiSpace.xl,
  },
  slotWrap: {
    width: SLOT_SIZE,
    height: SLOT_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    shadowOpacity: 0,
  },
  slot: {
    width: '100%',
    height: '100%',
    borderRadius: kolmiRadius.lg,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slotRequired: {
    borderColor: kolmiColors.accent,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  slotOptional: {
    borderColor: kolmiColors.outline,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  slotFilled: {
    borderColor: kolmiColors.outline,
    borderStyle: 'solid',
    backgroundColor: kolmiColors.bgDeep,
  },
  photoImage: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: kolmiColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontFamily: kolmiFonts.serif,
    fontSize: 32,
  },
  plusRequired: { color: kolmiColors.accent },
  plusOptional: { color: kolmiColors.textMuted },
  hint: {
    fontFamily: kolmiFonts.ui,
    fontSize: 12,
    color: kolmiColors.textMuted,
    textAlign: 'center',
    marginTop: kolmiSpace.md,
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
  ctaDisabled: {
    backgroundColor: kolmiColors.surfaceSoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 16,
    color: kolmiColors.white,
    letterSpacing: 0.2,
  },
  ctaTextDisabled: {
    color: kolmiColors.textMuted,
  },
})
