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
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { tapMedium, select } from '@/lib/kolmi/haptics'
import { getKolmiProfile, saveKolmiProfile } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'

const OPTIONS = ['Lycée', 'Bac', 'Bac+2 / Bac+3', 'Bac+5', 'Doctorat', 'Autre']

export default function EducationScreen() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    getKolmiProfile().then((p) => {
      if (p.education) setSelected(p.education)
    })
  }, [])

  const persistAndNext = async (path: string, value: string | null) => {
    if (value !== null) {
      const ok = await safePersist(() => saveKolmiProfile({ education: value }))
      if (!ok) return
    }
    router.push(path as any)
  }

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>{'Niveau\nd\'études ?'}</Text>

          <View style={styles.options}>
            {OPTIONS.map((o) => {
              const active = selected === o
              return (
                <TouchableOpacity
                  key={o}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    select()
                    setSelected(o)
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{o}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, !selected && styles.ctaDisabled]}
            onPress={() => {
              if (!selected) return
              tapMedium()
              persistAndNext('/onboarding/occupation', selected)
            }}
            activeOpacity={selected ? 0.85 : 1}
          >
            <Text style={[styles.ctaText, !selected && styles.ctaTextDisabled]}>Continuer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.sm,
  },
  backBtn: { padding: kolmiSpace.xs },
  backText: { fontFamily: kolmiFonts.serif, fontSize: 28, color: kolmiColors.text, lineHeight: 28 },
  optionalLabel: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 12,
    color: kolmiColors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  skipText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 14,
    color: kolmiColors.accent,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: kolmiPaddingX, paddingTop: kolmiSpace.md, paddingBottom: kolmiSpace.lg },
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
  options: { gap: kolmiSpace.sm, marginTop: kolmiSpace.xl },
  option: {
    paddingHorizontal: kolmiSpace.lg,
    paddingVertical: kolmiSpace.md,
    borderRadius: kolmiRadius.pill,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    minHeight: 56,
    justifyContent: 'center',
  },
  optionActive: {
    borderColor: kolmiColors.accent,
    borderWidth: 1.5,
    backgroundColor: kolmiColors.bgDeep,
  },
  optionText: { fontFamily: kolmiFonts.uiMedium, fontSize: 16, color: kolmiColors.text },
  optionTextActive: { fontFamily: kolmiFonts.uiSemiBold, color: kolmiColors.accent },
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
  ctaTextDisabled: { color: kolmiColors.textMuted },
})
