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
import Svg, { Path, Rect } from 'react-native-svg'
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

const SIGNUP_TOTAL_STEPS = 11

export default function PhoneScreen() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const inputRef = useRef<TextInput>(null)

  const isValid = phone.length === 9

  const handleChange = (raw: string) => {
    let digits = raw.replace(/\D/g, '')
    // iOS autofill may paste with country code "+33" → strip it.
    if (digits.startsWith('33') && digits.length > 9) {
      digits = digits.slice(2)
    }
    // French local format starts with 0 → strip it (we display "FR 33").
    digits = digits.replace(/^0/, '').slice(0, 9)
    setPhone(digits)
  }

  // French mobile after stripping the leading 0: 1 digit + 4 pairs.
  // e.g. "649754915" → "6 49 75 49 15"
  const formatPhone = (digits: string) => {
    if (!digits) return ''
    const head = digits.slice(0, 1)
    const rest = digits.slice(1).replace(/(\d{2})(?=\d)/g, '$1 ').trim()
    return rest ? `${head} ${rest}` : head
  }

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    getKolmiProfile().then((p) => {
      if (p.phone) setPhone(p.phone)
    })
  }, [])

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <SignupHeader
          step={1}
          total={SIGNUP_TOTAL_STEPS}
          onBack={() => router.back()}
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.body}>
            <Text style={styles.title}>{'Quel est votre\nnuméro ?'}</Text>
            <Text style={styles.subtitle}>
              Un code de vérification sera envoyé.
            </Text>

            <Pressable
              style={styles.inputRow}
              onPress={() => inputRef.current?.focus()}
            >
              <View style={styles.prefixWrap}>
                <Text style={styles.prefix}>FR 33</Text>
                <Svg width={8} height={12} viewBox="0 0 8 12" fill="none">
                  <Path
                    d="M2 2L6 6L2 10"
                    stroke={kolmiColors.text}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={formatPhone(phone)}
                onChangeText={handleChange}
                keyboardType="phone-pad"
                maxLength={20}
                returnKeyType="done"
                inputAccessoryViewID={EMPTY_ACCESSORY_ID}
                textContentType="telephoneNumber"
                autoComplete="tel"
              />
            </Pressable>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cta, !isValid && styles.ctaDisabled]}
              onPress={async () => {
                if (!isValid) return
                tapMedium()
                const ok = await safePersist(() => saveKolmiProfile({ phone }))
                if (!ok) return
                router.push({
                  pathname: '/onboarding/verify',
                  params: { phone },
                })
              }}
              activeOpacity={isValid ? 0.85 : 1}
            >
              <Text style={[styles.ctaText, !isValid && styles.ctaTextDisabled]}>
                Vérifier le numéro
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: kolmiSpace.md,
    marginTop: kolmiSpace.xxxl,
  },
  prefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: kolmiColors.text,
  },
  prefix: {
    fontFamily: kolmiFonts.serif,
    fontSize: 18,
    color: kolmiColors.text,
  },
  input: {
    flex: 1,
    height: 48,
    borderBottomWidth: 1.5,
    borderBottomColor: kolmiColors.text,
    fontFamily: kolmiFonts.serif,
    fontSize: 20,
    color: kolmiColors.text,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  assurance: {
    marginTop: kolmiSpace.xxxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: kolmiSpace.xs,
  },
  assuranceText: {
    fontFamily: kolmiFonts.ui,
    fontSize: 13,
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
