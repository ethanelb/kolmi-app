import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
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
import KolmiWordmark from '@/components/kolmi/KolmiWordmark'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { tapMedium } from '@/lib/kolmi/haptics'

function AppleLogo() {
  return (
    <Svg width={18} height={20} viewBox="0 0 24 28" fill="none">
      <Path
        d="M19.665 21.7c-.94 1.36-1.92 2.7-3.46 2.73-1.51.03-2-.89-3.73-.89-1.72 0-2.27.87-3.7.92-1.49.05-2.62-1.47-3.57-2.83-1.94-2.79-3.42-7.88-1.43-11.32 1-1.7 2.78-2.78 4.71-2.81 1.46-.03 2.84.98 3.74.98.89 0 2.57-1.21 4.34-1.03.74.03 2.83.3 4.18 2.27-.11.07-2.49 1.45-2.46 4.32.03 3.43 3.01 4.57 3.04 4.59-.03.08-.48 1.63-1.66 3.07ZM13.36 4.04c.81-.98 1.36-2.34 1.21-3.69-1.17.05-2.59.78-3.43 1.76-.75.86-1.41 2.25-1.23 3.57 1.31.1 2.65-.66 3.45-1.64Z"
        fill="#FFFFFF"
      />
    </Svg>
  )
}

function GoogleLogo() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  )
}

export default function WelcomeScreen() {
  const router = useRouter()
  // Verrou anti-double-tap : sans ça, taper "Continuer avec Apple" deux fois
  // d'affilée empile deux navigations vers /onboarding/name. Important
  // surtout dès que Supabase Auth sera câblé (la latence du round-trip
  // ouvre une fenêtre de double-tap visible).
  const [busy, setBusy] = useState<null | 'apple' | 'google'>(null)

  const goNext = (provider: 'apple' | 'google') => {
    if (busy) return
    setBusy(provider)
    tapMedium()
    router.push('/onboarding/name')
  }

  const appleBtn = (
    <TouchableOpacity
      key="apple"
      style={[styles.appleBtn, busy && busy !== 'apple' && styles.btnDimmed]}
      onPress={() => {
        // TODO: connect Supabase Auth (Sign in with Apple)
        goNext('apple')
      }}
      disabled={!!busy}
      activeOpacity={0.85}
    >
      <View style={styles.logoWrap}><AppleLogo /></View>
      <Text style={styles.appleText}>Continuer avec Apple</Text>
    </TouchableOpacity>
  )

  const googleBtn = (
    <TouchableOpacity
      key="google"
      style={[styles.googleBtn, busy && busy !== 'google' && styles.btnDimmed]}
      onPress={() => {
        // TODO: connect Supabase Auth (Sign in with Google)
        goNext('google')
      }}
      disabled={!!busy}
      activeOpacity={0.85}
    >
      <View style={styles.logoWrap}><GoogleLogo /></View>
      <Text style={styles.googleText}>Continuer avec Google</Text>
    </TouchableOpacity>
  )

  // Apple HIG : Apple en premier sur iOS. Convention Material : Google en premier sur Android.
  const ordered = Platform.OS === 'ios' ? [appleBtn, googleBtn] : [googleBtn, appleBtn]

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.logoArea}>
          <KolmiWordmark size={48} color={kolmiColors.accent} />
        </View>

        <View style={styles.heroArea}>
          <Text style={styles.title}>Un vrai date.</Text>
          <Text style={styles.title}>
            Sans{' '}
            <Text style={styles.strike}>swipe</Text>
            <Text style={styles.dot}>.</Text>
          </Text>
        </View>

        <View style={styles.actions}>
          {ordered}

          <Text style={styles.legal}>
            En continuant, tu acceptes nos{' '}
            <Text style={styles.legalLink}>conditions</Text> et notre{' '}
            <Text style={styles.legalLink}>politique de confidentialité</Text>.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: kolmiColors.bg,
  },
  safe: {
    flex: 1,
  },
  logoArea: {
    paddingTop: kolmiSpace.xs,
    alignItems: 'center',
  },
  heroArea: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.lg,
  },
  title: {
    fontFamily: kolmiFonts.serif,
    fontSize: fontScale(48),
    color: kolmiColors.text,
    lineHeight: 56,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  strike: {
    color: kolmiColors.text,
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
    textDecorationColor: kolmiColors.accent,
  },
  dot: {
    color: kolmiColors.accent,
  },
  actions: {
    paddingHorizontal: kolmiPaddingX,
    paddingBottom: kolmiSpace.xl,
    gap: 12,
  },
  appleBtn: {
    height: 56,
    borderRadius: kolmiRadius.pill,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Pendant qu'un provider navigue, l'autre est dimmé pour signaler qu'il
  // est inactif sans le faire disparaître.
  btnDimmed: {
    opacity: 0.45,
  },
  appleText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  googleBtn: {
    height: 56,
    borderRadius: kolmiRadius.pill,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 16,
    color: '#000000',
    letterSpacing: 0.1,
  },
  logoWrap: {
    width: 18,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  legal: {
    fontFamily: kolmiFonts.ui,
    fontSize: 12,
    color: kolmiColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: kolmiSpace.md,
    marginTop: kolmiSpace.xs,
  },
  legalLink: {
    textDecorationLine: 'underline',
    color: kolmiColors.text,
    fontFamily: kolmiFonts.uiMedium,
  },
})
