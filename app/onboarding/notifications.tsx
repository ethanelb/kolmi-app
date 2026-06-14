import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import {
  kolmiColors,
  kolmiSpace,
  kolmiRadius,
  kolmiFonts,
  kolmiPaddingX,
  fontScale,
} from '@/constants/kolmiTheme'
import SignupHeader from '@/components/kolmi/SignupHeader'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { tapMedium, success } from '@/lib/kolmi/haptics'
import { saveKolmiProfile } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'

const SIGNUP_TOTAL_STEPS = 10

export default function NotificationsScreen() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const persist = async (enabled: boolean) => {
    if (busy) return
    setBusy(true)
    tapMedium()
    if (enabled) success()
    // TODO: brancher expo-notifications -> requestPermissionsAsync()
    const ok = await safePersist(() =>
      saveKolmiProfile({ pushNotificationsEnabled: enabled }),
    )
    if (!ok) {
      setBusy(false)
      return
    }
    router.push('/onboarding/ready')
  }

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <SignupHeader step={10} total={SIGNUP_TOTAL_STEPS} onBack={() => router.back()} />

        <View style={styles.body}>
          <View style={styles.iconWrap}>
            <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"
                stroke={kolmiColors.accent}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>

          <Text style={styles.title}>{'Reste\nau courant'}</Text>
          <Text style={styles.subtitle}>
            Active les notifications pour ne rater aucune nouvelle sélection, demande de rencontre ou créneau confirmé.
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => persist(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Activer les notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => persist(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Plus tard</Text>
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
    paddingTop: kolmiSpace.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: kolmiColors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: kolmiSpace.xl,
  },
  title: {
    fontFamily: kolmiFonts.serif,
    fontSize: fontScale(36),
    color: kolmiColors.text,
    lineHeight: 42,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: kolmiFonts.ui,
    fontSize: 14,
    color: kolmiColors.textBody,
    lineHeight: 21,
    marginTop: kolmiSpace.md,
    textAlign: 'center',
    paddingHorizontal: kolmiSpace.md,
  },
  footer: {
    paddingHorizontal: kolmiPaddingX,
    paddingBottom: kolmiSpace.xl,
    gap: kolmiSpace.xs,
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
  skipBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 15,
    color: kolmiColors.textBody,
  },
})
