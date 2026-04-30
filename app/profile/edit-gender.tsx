import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native'
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

const GENDERS = [
  'Homme',
  'Femme',
  'Non-binaire',
  'Transgenre',
  'Genderfluid',
  'Autre',
]

export default function EditGenderScreen() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [showOnProfile, setShowOnProfile] = useState(true)

  useEffect(() => {
    getKolmiProfile().then((p) => {
      if (p.gender) setSelected(p.gender)
      if (typeof p.showGenderOnProfile === 'boolean') setShowOnProfile(p.showGenderOnProfile)
    })
  }, [])

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
          <Text style={styles.title}>{'Vous vous identifiez\ncomme...'}</Text>

          <View style={styles.options}>
            {GENDERS.map(g => {
              const active = selected === g
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    select()
                    setSelected(g)
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {g}
                  </Text>
                  {active && (
                    <Svg width={16} height={12} viewBox="0 0 16 12" fill="none">
                      <Path
                        d="M1 6L6 11L15 1"
                        stroke={kolmiColors.accent}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Afficher sur mon profil</Text>
            <Switch
              value={showOnProfile}
              onValueChange={setShowOnProfile}
              trackColor={{ true: kolmiColors.accent, false: kolmiColors.surfaceSoft }}
              thumbColor={kolmiColors.white}
              ios_backgroundColor={kolmiColors.surfaceSoft}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, !selected && styles.ctaDisabled]}
            onPress={async () => {
              if (!selected) return
              tapMedium()
              const ok = await safePersist(() =>
                saveKolmiProfile({
                  gender: selected,
                  showGenderOnProfile: showOnProfile,
                }),
              )
              if (!ok) return
              router.back()
            }}
            activeOpacity={selected ? 0.85 : 1}
          >
            <Text style={[styles.ctaText, !selected && styles.ctaTextDisabled]}>
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
    backgroundColor: 'transparent',
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
  },
  optionTextActive: {
    fontFamily: kolmiFonts.uiSemiBold,
    color: kolmiColors.accent,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: kolmiSpace.md,
    paddingVertical: kolmiSpace.sm,
    marginTop: kolmiSpace.xl,
  },
  toggleLabel: {
    fontFamily: kolmiFonts.ui,
    fontSize: 14,
    color: kolmiColors.textBody,
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
