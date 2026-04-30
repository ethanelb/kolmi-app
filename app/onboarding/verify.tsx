import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  kolmiColors,
  kolmiSpace,
  kolmiFonts,
  kolmiPaddingX,
} from '@/constants/kolmiTheme'
import SignupHeader from '@/components/kolmi/SignupHeader'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import EmptyKeyboardAccessory, { EMPTY_ACCESSORY_ID } from '@/components/kolmi/EmptyKeyboardAccessory'
import { select, success } from '@/lib/kolmi/haptics'

const SIGNUP_TOTAL_STEPS = 11
const CODE_LENGTH = 6

function formatPhone(raw?: string) {
  const digits = (raw ?? '').replace(/\D/g, '').replace(/^0/, '')
  if (digits.length < 9) return '+33 6 00 00 00 00'
  return `+33 ${digits[0]} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`
}

function Spinner() {
  const rot = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.timing(rot, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start()
  }, [rot])
  const spin = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })
  return (
    <Animated.View
      style={[styles.spinner, { transform: [{ rotate: spin }] }]}
    />
  )
}

export default function VerifyScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ phone?: string }>()
  const phoneDisplay = formatPhone(params.phone)

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [resent, setResent] = useState(false)
  const refs = useRef<(TextInput | null)[]>([])

  const full = code.every(d => d.length > 0)

  useEffect(() => {
    if (!full) return
    success()
    const t = setTimeout(() => router.push('/onboarding/birthday'), 600)
    return () => clearTimeout(t)
  }, [full, router])

  const handleChange = (i: number, v: string) => {
    const digits = v.replace(/\D/g, '')
    if (digits.length > 1) {
      select()
      setCode(prev => {
        const next = [...prev]
        for (let j = 0; j < digits.length && i + j < CODE_LENGTH; j++) {
          next[i + j] = digits[j]
        }
        return next
      })
      // Force the native value of each touched cell back to a single digit —
      // otherwise the first cell can briefly display "12" when typing fast
      // before React re-renders with the distributed value.
      for (let j = 0; j < digits.length && i + j < CODE_LENGTH; j++) {
        refs.current[i + j]?.setNativeProps({ text: digits[j] })
      }
      // Focus the cell AFTER the last filled one (not on it) so a fast
      // follow-up keystroke doesn't overwrite the just-distributed digit
      // via selectTextOnFocus.
      const focusIdx = Math.min(i + digits.length, CODE_LENGTH - 1)
      refs.current[focusIdx]?.focus()
      return
    }
    const digit = digits.slice(-1)
    if (digit) select()
    setCode(prev => {
      const next = [...prev]
      next[i] = digit
      return next
    })
    refs.current[i]?.setNativeProps({ text: digit })
    if (digit && i < CODE_LENGTH - 1) {
      refs.current[i + 1]?.focus()
    }
  }

  const handleKey = (i: number, key: string) => {
    if (key === 'Backspace' && !code[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <SignupHeader
          step={2}
          total={SIGNUP_TOTAL_STEPS}
          onBack={() => router.back()}
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.body}>
            <Text style={styles.title}>{'Entrez le code\nreçu'}</Text>
            <Text style={styles.subtitle}>{`Envoyé au ${phoneDisplay}`}</Text>

            <View style={styles.codeRow}>
              {code.map((d, i) => (
                <TextInput
                  key={i}
                  ref={el => {
                    refs.current[i] = el
                  }}
                  style={styles.codeInput}
                  value={d}
                  onChangeText={v => handleChange(i, v)}
                  onKeyPress={e => handleKey(i, e.nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={i === 0 ? CODE_LENGTH : 1}
                  autoFocus={i === 0}
                  selectTextOnFocus
                  textContentType={i === 0 ? 'oneTimeCode' : 'none'}
                  autoComplete={i === 0 ? 'sms-otp' : 'off'}
                  inputAccessoryViewID={EMPTY_ACCESSORY_ID}
                />
              ))}
            </View>

            {full && (
              <View style={styles.spinnerWrap}>
                <Spinner />
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerHint}>
              {resent
                ? 'Code renvoyé.'
                : 'Vous devriez recevoir le code dans 30s'}
            </Text>
            <TouchableOpacity
              hitSlop={10}
              activeOpacity={0.6}
              onPress={() => {
                if (resent) return
                select()
                setResent(true)
                setTimeout(() => setResent(false), 4000)
              }}
            >
              <Text style={styles.footerLink}>
                {resent ? 'Réessayer dans quelques secondes' : 'Code non reçu ?'}
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
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: kolmiSpace.xxxl - 4,
  },
  codeInput: {
    width: 28,
    height: 40,
    borderBottomWidth: 1.5,
    borderBottomColor: kolmiColors.text,
    fontFamily: kolmiFonts.serif,
    fontSize: 22,
    color: kolmiColors.text,
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  spinnerWrap: {
    alignItems: 'center',
    marginTop: kolmiSpace.xxxl - 4,
  },
  spinner: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: kolmiColors.surfaceSoft,
    borderTopColor: kolmiColors.accent,
    borderRadius: 12,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: kolmiSpace.xxxl,
    gap: 6,
  },
  footerHint: {
    fontFamily: kolmiFonts.ui,
    fontSize: 13,
    color: kolmiColors.textBody,
  },
  footerLink: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 13,
    color: kolmiColors.text,
    textDecorationLine: 'underline',
  },
})
