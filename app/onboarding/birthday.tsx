import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
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
import Wheel from '@/components/kolmi/Wheel'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { tapMedium } from '@/lib/kolmi/haptics'
import { getKolmiProfile, saveKolmiProfile } from '@/lib/kolmi/storage'

const SIGNUP_TOTAL_STEPS = 11

const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

export default function BirthdayScreen() {
  const router = useRouter()

  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), [])
  const years = useMemo(
    () => Array.from({ length: 70 }, (_, i) => 2007 - i),
    [],
  )

  const [day, setDay] = useState<number>(20)
  const [monthIdx, setMonthIdx] = useState<number>(0)
  const [year, setYear] = useState<number>(1995)

  useEffect(() => {
    getKolmiProfile().then((p) => {
      if (p.birthDate) {
        setDay(p.birthDate.day)
        setMonthIdx(Math.max(0, p.birthDate.month - 1))
        setYear(p.birthDate.year)
      }
    })
  }, [])

  const isValid = useMemo(() => {
    const today = new Date()
    const minBirth = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    )
    const birth = new Date(year, monthIdx, day)
    return birth.getTime() <= minBirth.getTime()
  }, [day, monthIdx, year])

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <SignupHeader
          step={3}
          total={SIGNUP_TOTAL_STEPS}
          onBack={() => router.back()}
        />

        <View style={styles.body}>
          <Text style={styles.title}>{'Quelle est votre\ndate de naissance ?'}</Text>

          <View style={styles.wheels}>
            <Wheel
              items={days}
              value={day}
              onChange={setDay}
              width={70}
              cycle
            />
            <Wheel
              items={MONTHS}
              value={MONTHS[monthIdx]}
              onChange={m => setMonthIdx(MONTHS.indexOf(m))}
              width={130}
              cycle
            />
            <Wheel
              items={years}
              value={year}
              onChange={setYear}
              width={80}
            />
          </View>

          <Text style={styles.footnote}>
            Seul votre âge sera visible par les autres utilisateurs
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, !isValid && styles.ctaDisabled]}
            onPress={async () => {
              if (isValid) {
                tapMedium()
                await saveKolmiProfile({
                  birthDate: { day, month: monthIdx + 1, year },
                })
                router.push('/onboarding/name')
              }
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
  wheels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: kolmiSpace.xl,
  },
  footnote: {
    textAlign: 'center',
    fontFamily: kolmiFonts.ui,
    fontSize: 12,
    color: kolmiColors.textMuted,
    marginTop: kolmiSpace.xl,
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
