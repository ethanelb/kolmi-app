import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import {
  kolmiColors,
  kolmiSpace,
  kolmiRadius,
  kolmiFonts,
  kolmiPaddingX,
} from '@/constants/kolmiTheme'
import SignupHeader from '@/components/kolmi/SignupHeader'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { tapMedium, success } from '@/lib/kolmi/haptics'
import { saveKolmiProfile } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'

const SIGNUP_TOTAL_STEPS = 10

export default function SelfieScreen() {
  const router = useRouter()
  const [captured, setCaptured] = useState(false)

  const onCapture = () => {
    // TODO: brancher expo-camera + upload Supabase
    tapMedium()
    success()
    setCaptured(true)
  }

  const onContinue = async () => {
    if (!captured) {
      Alert.alert('Selfie requis', 'Prends un selfie pour vérifier ton profil.')
      return
    }
    tapMedium()
    const ok = await safePersist(() =>
      saveKolmiProfile({ selfieVerifUrl: 'mock://selfie.jpg' }),
    )
    if (!ok) return
    router.push('/onboarding/education')
  }

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <SignupHeader step={9} total={SIGNUP_TOTAL_STEPS} onBack={() => router.back()} />

        <View style={styles.body}>
          <Text style={styles.title}>{'Vérifie\nton profil'}</Text>
          <Text style={styles.subtitle}>
            Un selfie rapide pour confirmer que c'est bien toi. Il ne sera pas affiché publiquement.
          </Text>

          <View style={styles.placeholder}>
            {captured ? (
              <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5 12l5 5L20 7"
                  stroke={kolmiColors.accent}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            ) : (
              <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M9 4l-2 3H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2-3H9Z"
                  stroke={kolmiColors.text}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            )}
            <Text style={styles.placeholderText}>
              {captured ? 'Selfie capturé' : 'Aucun selfie'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.secondaryBtn]}
            onPress={onCapture}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryText}>
              {captured ? 'Reprendre' : 'Prendre un selfie'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cta, !captured && styles.ctaDisabled]}
            onPress={onContinue}
            activeOpacity={captured ? 0.85 : 1}
          >
            <Text style={[styles.ctaText, !captured && styles.ctaTextDisabled]}>
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
  placeholder: {
    flex: 1,
    marginTop: kolmiSpace.xl,
    borderRadius: kolmiRadius.lg,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    backgroundColor: kolmiColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: kolmiSpace.sm,
    marginBottom: kolmiSpace.lg,
  },
  placeholderText: {
    fontFamily: kolmiFonts.ui,
    fontSize: 14,
    color: kolmiColors.textBody,
  },
  footer: {
    paddingHorizontal: kolmiPaddingX,
    paddingBottom: kolmiSpace.xl,
    gap: kolmiSpace.sm,
  },
  secondaryBtn: {
    height: 56,
    borderRadius: kolmiRadius.pill,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: kolmiColors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 16,
    color: kolmiColors.text,
    letterSpacing: 0.1,
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
