import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  kolmiColors,
  kolmiSpace,
  kolmiRadius,
  kolmiFonts,
  kolmiPaddingX,
} from '@/constants/kolmiTheme'
import SignupHeader from '@/components/kolmi/SignupHeader'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { tapLight, tapMedium } from '@/lib/kolmi/haptics'
import { getKolmiProfile, saveKolmiProfile } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'
import { pickProfilePhoto } from '@/lib/kolmi/photoPicker'

const SIGNUP_TOTAL_STEPS = 11
const { width } = Dimensions.get('window')
const SLOT_GAP = 10
const SLOT_SIZE = (width - kolmiPaddingX * 2 - SLOT_GAP * 2) / 3

export default function PhotosScreen() {
  const router = useRouter()
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null, null, null])

  useEffect(() => {
    getKolmiProfile().then((p) => {
      if (p.photoUrls?.length) {
        const slots: (string | null)[] = [null, null, null, null, null, null]
        p.photoUrls.forEach((url, i) => {
          if (i < 6) slots[i] = url
        })
        setPhotos(slots)
      }
    })
  }, [])

  const filledCount = photos.filter(Boolean).length
  const isValid = filledCount >= 4

  const addPhoto = async (index: number) => {
    const uri = await pickProfilePhoto()
    if (!uri) return
    setPhotos((prev) => {
      const next = [...prev]
      next[index] = uri
      return next
    })
  }

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <SignupHeader
          step={9}
          total={SIGNUP_TOTAL_STEPS}
          onBack={() => router.back()}
        />

        <View style={styles.body}>
          <Text style={styles.title}>{'Ajoute\ntes photos'}</Text>
          <Text style={styles.subtitle}>
            {filledCount < 4
              ? `Encore ${4 - filledCount} photo${4 - filledCount > 1 ? 's' : ''} requise${4 - filledCount > 1 ? 's' : ''}`
              : 'Super ! Tu peux ajouter jusqu\'à 6 photos'}
          </Text>

          <View style={styles.grid}>
            {photos.map((photo, i) => {
              const isRequired = i < 4
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.slot,
                    !photo && isRequired && styles.slotRequired,
                    !photo && !isRequired && styles.slotOptional,
                    photo && styles.slotFilled,
                  ]}
                  onPress={() => {
                    tapLight()
                    void addPhoto(i)
                  }}
                  activeOpacity={0.75}
                >
                  {photo ? (
                    <>
                      <Image source={{ uri: photo }} style={styles.photoImage} />
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => {
                          const newPhotos = [...photos]
                          newPhotos[i] = null
                          setPhotos(newPhotos)
                        }}
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
              )
            })}
          </View>

          <Text style={styles.hint}>
            Glisse pour réorganiser · 4 photos minimum requises
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
              router.push('/onboarding/vocal')
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
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE * 1.3,
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
