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
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { select, tapMedium } from '@/lib/kolmi/haptics'
import { getKolmiProfile, saveKolmiProfile } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'

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

export default function EditLifestyleScreen() {
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
          <Text style={styles.title}>{'Votre style\nde vie'}</Text>
          <Text style={styles.subtitle}>
            Ces infos aident à trouver de meilleurs matchs — vous pouvez changer à tout moment
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
            style={[styles.cta, !isValid && styles.ctaDisabled]}
            onPress={async () => {
              if (!isValid) return
              tapMedium()
              const ok = await safePersist(() =>
                saveKolmiProfile({ lifestyle: answers }),
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
