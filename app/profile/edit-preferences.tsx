import React, { useEffect, useState } from 'react'
import { Alert, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  kolmiColors,
  kolmiSpace,
  kolmiRadius,
  kolmiFonts,
  kolmiPaddingX,
  fontScale,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { getKolmiPreferences, saveKolmiPreferences } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'
import { select, tapMedium } from '@/lib/kolmi/haptics'

const DISTANCES = ['5 km', '10 km', '25 km', '50 km', '100 km', 'Toute la France']
const AGE_OPTIONS = [21, 23, 25, 28, 30, 35, 40, 45, 50]

export default function EditPreferencesScreen() {
  const router = useRouter()
  const [minAge, setMinAge] = useState(22)
  const [maxAge, setMaxAge] = useState(35)
  const [distance, setDistance] = useState('25 km')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getKolmiPreferences()
      .then((prefs) => {
        if (prefs) {
          setMinAge(prefs.minAge)
          setMaxAge(prefs.maxAge)
          setDistance(prefs.distance)
        }
      })
      .finally(() => setLoaded(true))
  }, [])

  const handleSave = async () => {
    tapMedium()
    const ok = await safePersist(() =>
      saveKolmiPreferences({ minAge, maxAge, distance }),
    )
    if (!ok) return
    router.back()
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

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{'Vos\npréférences'}</Text>
          <Text style={styles.subtitle}>
            Kolmi les utilise pour vous envoyer une sélection adaptée
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tranche d'âge</Text>
            <Text style={styles.value}>{minAge} – {maxAge} ans</Text>

            <View style={styles.ageRow}>
              {AGE_OPTIONS.map(age => {
                const active = age === minAge || age === maxAge
                return (
                  <TouchableOpacity
                    key={age}
                    style={[styles.ageChip, active && styles.ageChipActive]}
                    onPress={() => {
                      try {
                        if (age === minAge || age === maxAge) {
                          select()
                          return
                        }
                        if (age <= maxAge - 2) {
                          select()
                          setMinAge(age)
                        } else if (age >= minAge + 2) {
                          select()
                          setMaxAge(age)
                        } else {
                          Alert.alert(
                            'Tranche trop étroite',
                            "Gardez au moins 2 ans d'écart entre l'âge minimum et l'âge maximum.",
                          )
                        }
                      } catch (err) {
                        console.warn('[kolmi] age update failed', err)
                        Alert.alert(
                          'Action impossible',
                          "Impossible de modifier la tranche d'âge. Réessayez dans un instant.",
                        )
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.ageChipText, active && styles.ageChipTextActive]}>
                      {age}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Distance maximale</Text>
            <View style={styles.chips}>
              {DISTANCES.map(d => {
                const active = distance === d
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => {
                      try {
                        select()
                        setDistance(d)
                      } catch (err) {
                        console.warn('[kolmi] distance update failed', err)
                        Alert.alert(
                          'Action impossible',
                          "Impossible de modifier la distance. Réessayez dans un instant.",
                        )
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, !loaded && styles.ctaDisabled]}
            onPress={handleSave}
            disabled={!loaded}
            activeOpacity={loaded ? 0.85 : 1}
          >
            <Text style={[styles.ctaText, !loaded && styles.ctaTextDisabled]}>
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.lg,
    paddingBottom: kolmiSpace.lg,
    gap: kolmiSpace.lg,
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
    marginTop: -kolmiSpace.sm,
  },
  section: { gap: kolmiSpace.xs },
  sectionLabel: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 12,
    color: kolmiColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  value: {
    fontFamily: kolmiFonts.serif,
    fontSize: 24,
    color: kolmiColors.accent,
    marginVertical: kolmiSpace.xs,
  },
  ageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: kolmiSpace.xs },
  ageChip: {
    paddingHorizontal: kolmiSpace.md,
    paddingVertical: kolmiSpace.xs + 2,
    borderRadius: kolmiRadius.pill,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
  },
  ageChipActive: {
    borderColor: kolmiColors.accent,
    borderWidth: 1.5,
    backgroundColor: kolmiColors.bgDeep,
  },
  ageChipText: {
    fontFamily: kolmiFonts.ui,
    fontSize: 14,
    color: kolmiColors.textSecondary,
  },
  ageChipTextActive: {
    fontFamily: kolmiFonts.uiSemiBold,
    color: kolmiColors.accent,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: kolmiSpace.xs },
  chip: {
    paddingHorizontal: kolmiSpace.md,
    paddingVertical: kolmiSpace.xs + 2,
    borderRadius: kolmiRadius.pill,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
  },
  chipActive: {
    borderColor: kolmiColors.accent,
    borderWidth: 1.5,
    backgroundColor: kolmiColors.bgDeep,
  },
  chipText: {
    fontFamily: kolmiFonts.ui,
    fontSize: 14,
    color: kolmiColors.text,
  },
  chipTextActive: {
    fontFamily: kolmiFonts.uiSemiBold,
    color: kolmiColors.accent,
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
