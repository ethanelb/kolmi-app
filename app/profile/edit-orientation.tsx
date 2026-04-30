import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
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

const OPTIONS = [
  { id: 'men', label: 'Des hommes' },
  { id: 'women', label: 'Des femmes' },
  { id: 'everyone', label: 'Tout le monde' },
  { id: 'nonbinary', label: 'Des personnes non-binaires' },
]

export default function EditOrientationScreen() {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    getKolmiProfile().then((p) => {
      if (p.orientations?.length) setSelected(p.orientations)
    })
  }, [])

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const isValid = selected.length > 0

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
          <Text style={styles.title}>{'Qui voulez-vous\nrencontrer ?'}</Text>
          <Text style={styles.subtitle}>
            Vous pouvez sélectionner plusieurs options
          </Text>

          <View style={styles.options}>
            {OPTIONS.map(opt => {
              const active = selected.includes(opt.id)
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    select()
                    toggle(opt.id)
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
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
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, !isValid && styles.ctaDisabled]}
            onPress={async () => {
              if (!isValid) return
              tapMedium()
              const ok = await safePersist(() =>
                saveKolmiProfile({ orientations: selected }),
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
  options: {
    gap: kolmiSpace.sm,
    marginTop: kolmiSpace.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: kolmiSpace.lg,
    paddingVertical: kolmiSpace.md,
    borderRadius: kolmiRadius.pill,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    minHeight: 56,
  },
  optionActive: {
    borderColor: kolmiColors.accent,
    borderWidth: 1.5,
    backgroundColor: kolmiColors.bgDeep,
  },
  optionText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 16,
    color: kolmiColors.text,
    flex: 1,
    paddingRight: kolmiSpace.sm,
  },
  optionTextActive: {
    fontFamily: kolmiFonts.uiSemiBold,
    color: kolmiColors.accent,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: kolmiColors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: kolmiColors.accent,
    borderColor: kolmiColors.accent,
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
