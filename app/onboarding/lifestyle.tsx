import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
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
import { select, tapMedium } from '@/lib/kolmi/haptics'
import { getKolmiProfile, saveKolmiProfile } from '@/lib/kolmi/storage'

const SIGNUP_TOTAL_STEPS = 11

const QUESTIONS = [
  {
    id: 'drinking',
    question: 'Alcool',
    options: ['Jamais', 'Rarement', 'En soirée', 'Régulièrement'],
  },
  {
    id: 'smoking',
    question: 'Tabac',
    options: ['Jamais', 'Occasionnellement', 'Fumeur(se)'],
  },
  {
    id: 'children',
    question: 'Enfants',
    options: ['J\'en ai', 'Je n\'en ai pas', 'Je veux en avoir', 'Je ne veux pas en avoir', 'Ouvert(e) à l\'idée'],
  },
  {
    id: 'religion',
    question: 'Religion',
    options: ['Athée', 'Agnostique', 'Chrétien(ne)', 'Musulman(e)', 'Juif(ve)', 'Bouddhiste', 'Autre'],
  },
]

export default function LifestyleScreen() {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})

  useEffect(() => {
    getKolmiProfile().then((p) => {
      if (p.lifestyle && Object.keys(p.lifestyle).length > 0) {
        setAnswers(p.lifestyle)
      }
    })
  }, [])

  const setAnswer = (qid: string, option: string) => {
    setAnswers(prev => ({ ...prev, [qid]: option }))
  }

  const answeredCount = Object.keys(answers).length
  const isValid = answeredCount >= 2

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <SignupHeader
          step={8}
          total={SIGNUP_TOTAL_STEPS}
          onBack={() => router.back()}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{'Parle-nous\nde toi'}</Text>
          <Text style={styles.subtitle}>
            Ces infos aident à trouver de meilleurs matchs — tu peux changer à tout moment
          </Text>

          {QUESTIONS.map(q => (
            <View key={q.id} style={styles.question}>
              <Text style={styles.questionLabel}>{q.question}</Text>
              <View style={styles.chips}>
                {q.options.map(opt => {
                  const active = answers[q.id] === opt
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => {
                        select()
                        setAnswer(q.id, opt)
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => router.push('/onboarding/photos')}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Passer pour l'instant</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cta, !isValid && styles.ctaDisabled]}
            onPress={async () => {
              if (isValid) {
                tapMedium()
                await saveKolmiProfile({ lifestyle: answers })
                router.push('/onboarding/photos')
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.lg,
    paddingBottom: kolmiSpace.lg,
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
    marginBottom: kolmiSpace.lg,
  },
  question: { marginBottom: kolmiSpace.lg },
  questionLabel: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 12,
    color: kolmiColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: kolmiSpace.sm,
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
    gap: kolmiSpace.sm,
  },
  skipText: {
    fontFamily: kolmiFonts.ui,
    fontSize: 13,
    color: kolmiColors.textMuted,
    textAlign: 'center',
    paddingVertical: kolmiSpace.xs,
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
