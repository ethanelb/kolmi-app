import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import Svg, { Path } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import {
  kolmiColors,
  kolmiSpace,
  kolmiRadius,
  kolmiFonts,
  kolmiPaddingX,
  fontScale,
} from '@/constants/kolmiTheme'
import SignupHeader from '@/components/kolmi/SignupHeader'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { tapLight, tapMedium } from '@/lib/kolmi/haptics'
import { getKolmiProfile, saveKolmiProfile, type KolmiProfile } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'
import { safeRead } from '@/lib/kolmi/safeRead'
import { pickProfilePhotos } from '@/lib/kolmi/photoPicker'
import { uploadProfilePhotos } from '@/lib/kolmi/photos'

const SIGNUP_TOTAL_STEPS = 10
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
  // Pré-cue : pendant que le long-press s'arme (les premières ~150 ms du
  // touch), on enclenche un léger scale-down 0.97 pour signaler que le
  // touch a été vu. Si l'utilisateur lâche avant 250 ms, le pan ne
  // s'active pas mais l'utilisateur a quand même eu un retour. Si le pan
  // s'active, le scale-up 1.08 prend le relais et masque proprement le
  // pré-cue.
  const press = useSharedValue(0)

  const longPress = Gesture.LongPress()
    .enabled(!!photo)
    .minDuration(150)
    .maxDistance(8)
    .onStart(() => {
      press.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) })
    })
    .onFinalize(() => {
      press.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) })
    })

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

  // Le long-press s'exécute avant le pan via Gesture.Simultaneous : on veut
  // les deux feedbacks (pré-cue puis lift) sans que l'un cancel l'autre.
  const composed = Gesture.Simultaneous(longPress, pan)

  const animStyle = useAnimatedStyle(() => {
    // Le scale est composite : si on est en drag, le 1.08 du drag domine.
    // Sinon, on applique le pré-cue 1 → 0.97 piloté par `press`.
    const dragScale = scale.value
    const preCueScale = 1 - press.value * 0.03
    const finalScale = dragging.value > 0 ? dragScale : preCueScale
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: finalScale },
      ],
      zIndex: dragging.value > 0 ? 20 : 0,
      elevation: dragging.value > 0 ? 12 : 0,
      shadowOpacity: dragging.value * 0.22,
    }
  })

  return (
    <GestureDetector gesture={composed}>
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

export default function PhotosScreen() {
  const router = useRouter()
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null, null, null])
  // Évite le flash "grille vide" quand l'utilisateur revient sur l'écran
  // avec des photos déjà uploadées : on attend l'hydratation avant de
  // monter la grille.
  const [profileLoaded, setProfileLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    safeRead(() => getKolmiProfile(), {} as KolmiProfile).then((p) => {
      if (cancelled) return
      if (p.photoUrls?.length) {
        const slots: (string | null)[] = Array(TOTAL_SLOTS).fill(null)
        p.photoUrls.forEach((url, i) => {
          if (i < TOTAL_SLOTS) slots[i] = url
        })
        setPhotos(slots)
      }
      setProfileLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const filledCount = photos.filter(Boolean).length
  const isValid = filledCount >= MIN_PHOTOS

  const addPhoto = async (index: number) => {
    // Limite = nombre de slots vides restants à partir de l'index tapé.
    // L'user peut sélectionner plusieurs photos d'un coup, on les distribue
    // dans les slots vides à partir de cet index puis dans les suivants.
    const emptyAfter = photos
      .map((p, i) => (p ? -1 : i))
      .filter((i) => i >= index)
    const limit = emptyAfter.length
    if (limit === 0) return
    const uris = await pickProfilePhotos(limit)
    if (uris.length === 0) return
    setPhotos((prev) => {
      const next = [...prev]
      let cursor = 0
      for (const slotIdx of emptyAfter) {
        if (cursor >= uris.length) break
        next[slotIdx] = uris[cursor++]
      }
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
    // Insert + shift (et non swap) : drag de 0 vers 5 doit décaler les
    // photos 1-5 d'un cran vers la gauche, comme sur Hinge ou Tinder.
    // L'ancien comportement (swap) était contre-intuitif quand on
    // traversait plusieurs slots.
    setPhotos((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    tapMedium()
  }

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <SignupHeader
          step={8}
          total={SIGNUP_TOTAL_STEPS}
          onBack={() => router.back()}
        />

        <View style={styles.body}>
          <Text style={styles.title}>{'Ajoute\ntes photos'}</Text>
          <Text style={styles.subtitle}>
            {filledCount < MIN_PHOTOS
              ? `Encore ${MIN_PHOTOS - filledCount} photo${MIN_PHOTOS - filledCount > 1 ? 's' : ''} requise${MIN_PHOTOS - filledCount > 1 ? 's' : ''}`
              : 'Parfait ! Tu peux continuer'}
          </Text>

          {profileLoaded ? (
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
          ) : (
            <View style={styles.gridPlaceholder} />
          )}

          <Text style={styles.hint}>
            Maintiens une photo et glisse pour réorganiser · {MIN_PHOTOS} photos minimum
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, (!isValid || !profileLoaded) && styles.ctaDisabled]}
            disabled={!profileLoaded}
            onPress={async () => {
              if (!isValid) return
              tapMedium()
              const localUris = photos.filter((p): p is string => Boolean(p))
              // Save local d'abord pour ne pas bloquer la navigation si
              // l'upload Supabase met du temps. L'upload se déclenche en
              // arrière-plan puis re-save avec les URLs publiques.
              const ok = await safePersist(() =>
                saveKolmiProfile({ photoUrls: localUris }),
              )
              if (!ok) return
              uploadProfilePhotos(localUris)
                .then((remote) => saveKolmiProfile({ photoUrls: remote }))
                .catch((err) => console.warn('[kolmi] photo upload bg failed', err))
              router.push('/onboarding/selfie')
            }}
            activeOpacity={isValid ? 0.85 : 1}
          >
            <Text style={[styles.ctaText, !isValid && styles.ctaTextDisabled]}>
              Continuer
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
  body: {
    flex: 1,
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.lg,
  },
  title: {
    fontFamily: kolmiFonts.serif,
    fontSize: fontScale(36),
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
  // Empreinte exacte de la grille (2 lignes × hauteur slot + gap) pendant
  // l'hydratation du profil — évite que le hint et le CTA sautent.
  gridPlaceholder: {
    height: SLOT_HEIGHT * ROWS + SLOT_GAP * (ROWS - 1),
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
    fontSize: fontScale(32),
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
