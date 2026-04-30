import React from 'react'
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
import KolmiWordmark from '@/components/kolmi/KolmiWordmark'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { tapMedium } from '@/lib/kolmi/haptics'

export default function WelcomeScreen() {
  const router = useRouter()

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
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              tapMedium()
              router.push('/onboarding/phone')
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryText}>S'inscrire</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryText}>Se connecter (dev)</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.legal}>
            En continuant, vous acceptez nos{' '}
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
    fontSize: 48,
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
    gap: kolmiSpace.sm,
  },
  primaryBtn: {
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
  primaryText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 22,
    color: kolmiColors.white,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    height: 56,
    borderRadius: kolmiRadius.pill,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 17,
    color: kolmiColors.text,
    letterSpacing: 0.2,
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
