import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native'
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
import EmptyKeyboardAccessory, { EMPTY_ACCESSORY_ID } from '@/components/kolmi/EmptyKeyboardAccessory'
import { tapMedium } from '@/lib/kolmi/haptics'
import { getKolmiProfile, saveKolmiProfile } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'

const SIGNUP_TOTAL_STEPS = 10
const MIN_CM = 130
const MAX_CM = 220

export default function HeightScreen() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const inputRef = useRef<TextInput>(null)

  const parsed = parseInt(value, 10)
  const isValid = Number.isFinite(parsed) && parsed >= MIN_CM && parsed <= MAX_CM

  useEffect(() => {
    let cancelled = false
    getKolmiProfile().then((p) => {
      if (cancelled) return
      if (typeof p.heightCm === 'number') setValue(String(p.heightCm))
      const t = setTimeout(() => inputRef.current?.focus(), 250)
      return () => clearTimeout(t)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <SignupHeader
          step={5}
          total={SIGNUP_TOTAL_STEPS}
          onBack={() => router.back()}
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.body}>
            <Text style={styles.title}>{'Quelle est\nta taille ?'}</Text>
            <Text style={styles.subtitle}>
              Entre {MIN_CM} et {MAX_CM} cm
            </Text>

            <Pressable
              style={styles.inputWrap}
              onPress={() => inputRef.current?.focus()}
            >
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={value}
                  onChangeText={(t) => setValue(t.replace(/[^0-9]/g, '').slice(0, 3))}
                  placeholder="175"
                  placeholderTextColor={kolmiColors.textGhost}
                  keyboardType="number-pad"
                  maxLength={3}
                  returnKeyType="done"
                  inputAccessoryViewID={EMPTY_ACCESSORY_ID}
                />
                <Text style={styles.unit}>cm</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cta, !isValid && styles.ctaDisabled]}
              onPress={async () => {
                if (!isValid) return
                tapMedium()
                const ok = await safePersist(() =>
                  saveKolmiProfile({ heightCm: parsed }),
                )
                if (!ok) return
                router.push('/onboarding/orientation')
              }}
              activeOpacity={isValid ? 0.85 : 1}
            >
              <Text style={[styles.ctaText, !isValid && styles.ctaTextDisabled]}>
                Continuer
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <EmptyKeyboardAccessory />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  flex: { flex: 1 },
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
  inputWrap: {
    marginTop: kolmiSpace.xxxl,
    borderBottomWidth: 1.5,
    borderBottomColor: kolmiColors.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: kolmiSpace.xs,
  },
  input: {
    height: 52,
    flex: 1,
    fontFamily: kolmiFonts.serif,
    fontSize: 24,
    color: kolmiColors.text,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  unit: {
    fontFamily: kolmiFonts.serif,
    fontSize: 22,
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
