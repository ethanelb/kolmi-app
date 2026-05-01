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
import { tapMedium, select } from '@/lib/kolmi/haptics'
import { getKolmiProfile, saveKolmiProfile } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'

const OPTIONS = [
  'Afrique subsaharienne',
  'Europe / Caucasien',
  'Asie de l’Est',
  'Hispanique / Amérique latine',
  'Maghreb / Moyen-Orient',
  'Amérindien',
  'Océanie / Pacifique',
  'Asie du Sud',
  'Asie du Sud-Est',
  'Autre',
  'Préfère ne pas dire',
]

export default function OriginScreen() {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    getKolmiProfile().then((p) => {
      if (p.origins?.length) setSelected(p.origins)
    })
  }, [])

  const toggle = (o: string) => {
    select()
    setSelected((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o],
    )
  }

  const isValid = selected.length > 0

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
          <Text style={styles.title}>{'Tes\norigines ?'}</Text>

          <View style={styles.options}>
            {OPTIONS.map((o) => {
              const active = selected.includes(o)
              return (
                <TouchableOpacity
                  key={o}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => toggle(o)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.checkbox, active && styles.checkboxActive]}>
                    {active && (
                      <Svg width={12} height={9} viewBox="0 0 12 9" fill="none">
                        <Path
                          d="M1 4.5L4.5 8L11 1"
                          stroke={kolmiColors.white}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </View>
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{o}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, !isValid && styles.ctaDisabled]}
            onPress={async () => {
              if (!isValid) return
              tapMedium()
              const ok = await safePersist(() =>
                saveKolmiProfile({ origins: selected }),
              )
              if (!ok) return
              router.push('/onboarding/religion')
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.sm,
  },
  backBtn: { padding: kolmiSpace.xs },
  backText: { fontFamily: kolmiFonts.serif, fontSize: 28, color: kolmiColors.text, lineHeight: 28 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: kolmiPaddingX, paddingTop: kolmiSpace.md, paddingBottom: kolmiSpace.lg },
  title: {
    fontFamily: kolmiFonts.serif,
    fontSize: 36,
    color: kolmiColors.text,
    lineHeight: 42,
    letterSpacing: -0.4,
  },
  options: { gap: kolmiSpace.sm, marginTop: kolmiSpace.xl },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: kolmiSpace.md,
    paddingVertical: kolmiSpace.md,
    borderRadius: kolmiRadius.pill,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    minHeight: 56,
    gap: kolmiSpace.sm,
  },
  optionActive: {
    borderColor: kolmiColors.accent,
    borderWidth: 1.5,
    backgroundColor: kolmiColors.bgDeep,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: kolmiColors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    borderColor: kolmiColors.accent,
    backgroundColor: kolmiColors.accent,
  },
  optionText: {
    flex: 1,
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 15,
    color: kolmiColors.text,
    textAlign: 'center',
  },
  optionTextActive: { fontFamily: kolmiFonts.uiSemiBold, color: kolmiColors.accent },
  footer: { paddingHorizontal: kolmiPaddingX, paddingBottom: kolmiSpace.xl },
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
  ctaDisabled: { backgroundColor: kolmiColors.surfaceSoft, shadowOpacity: 0, elevation: 0 },
  ctaText: { fontFamily: kolmiFonts.uiSemiBold, fontSize: 16, color: kolmiColors.white, letterSpacing: 0.2 },
  ctaTextDisabled: { color: kolmiColors.textMuted },
})
