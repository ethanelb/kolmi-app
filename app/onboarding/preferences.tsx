import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
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
import {
  getKolmiPreferences,
  saveKolmiPreferences,
  saveKolmiProgress,
} from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'
import { select, success } from '@/lib/kolmi/haptics'

const SIGNUP_TOTAL_STEPS = 11

const DISTANCES = ['5 km', '10 km', '25 km', '50 km', '100 km', 'Toute la France']

export default function PreferencesScreen() {
  const router = useRouter()
  const [minAge, setMinAge] = useState(22)
  const [maxAge, setMaxAge] = useState(35)
  const [distance, setDistance] = useState('25 km')

  useEffect(() => {
    getKolmiPreferences().then((prefs) => {
      if (!prefs) return
      setMinAge(prefs.minAge)
      setMaxAge(prefs.maxAge)
      setDistance(prefs.distance)
    })
  }, [])

  const handleFinish = async () => {
    success()
    const ok = await safePersist(async () => {
      await saveKolmiPreferences({ minAge, maxAge, distance })
      await saveKolmiProgress({ hasCompletedBaseOnboarding: true })
    })
    if (!ok) return
    router.replace('/matchmaker')
  }

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <SignupHeader
          step={SIGNUP_TOTAL_STEPS}
          total={SIGNUP_TOTAL_STEPS}
          onBack={() => router.back()}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{'Tes\npréférences'}</Text>
          <Text style={styles.subtitle}>
            Kolmi les utilise pour t'envoyer une sélection adaptée
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tranche d'âge</Text>
            <Text style={styles.value}>{minAge} – {maxAge} ans</Text>

            <View style={styles.ageRow}>
              {[18, 20, 22, 25, 28, 30, 35, 40, 45, 50].map(age => {
                const active = age === minAge || age === maxAge
                return (
                  <TouchableOpacity
                    key={age}
                    style={[styles.ageChip, active && styles.ageChipActive]}
                    onPress={() => {
                      select()
                      if (age <= maxAge - 2) setMinAge(age)
                      else if (age >= minAge + 2) setMaxAge(age)
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
                      select()
                      setDistance(d)
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

          <View style={styles.infoCard}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path
                d="M8 1L9.3 5.7L14 7L9.3 8.3L8 13L6.7 8.3L2 7L6.7 5.7L8 1Z"
                stroke={kolmiColors.accent}
                strokeWidth={1.3}
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.infoText}>
              L'IA de Kolmi affine les suggestions au fil du temps selon tes interactions
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cta}
            onPress={handleFinish}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Commencer Kolmi</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.lg,
    paddingBottom: kolmiSpace.lg,
    gap: kolmiSpace.lg,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: kolmiSpace.sm,
    padding: kolmiSpace.md,
    borderRadius: kolmiRadius.lg,
    backgroundColor: kolmiColors.bgDeep,
    borderWidth: 1,
    borderColor: kolmiColors.accent + '33',
  },
  infoText: {
    flex: 1,
    fontFamily: kolmiFonts.ui,
    fontSize: 13,
    color: kolmiColors.textBody,
    lineHeight: 19,
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
