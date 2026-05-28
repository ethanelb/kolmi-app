import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import {
  kolmiColors,
  kolmiSpace,
  kolmiRadius,
  kolmiFonts,
  kolmiPaddingX,
  fontScale,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import EmptyKeyboardAccessory, {
  EMPTY_ACCESSORY_ID,
} from '@/components/kolmi/EmptyKeyboardAccessory'
import { tapMedium, tapLight } from '@/lib/kolmi/haptics'
import { supabase } from '@/lib/supabase'

// Étape 2 : saisie du code à 6 chiffres reçu par email. À la validation, on
// appelle verifyOtp(type='email_change') qui lie l'email au user anonyme et
// convertit définitivement la session.
export default function AuthVerifyScreen() {
  const router = useRouter()
  const { email } = useLocalSearchParams<{ email: string }>()
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<TextInput>(null)

  const isValid = code.length === 6 && /^\d{6}$/.test(code)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [])

  async function handleSubmit() {
    if (!isValid || submitting || !email) return
    tapMedium()
    setSubmitting(true)
    setError(null)
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email_change',
    })
    setSubmitting(false)
    if (err) {
      setError(err.message)
      tapLight()
      return
    }
    // Succès : l'utilisateur anonyme est désormais lié à son email.
    // Retour à l'écran d'origine (Profil) — la sub onAuthStateChange ré-render.
    router.dismissAll()
  }

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.body}>
            <Text style={styles.title}>Vérifiez votre boîte mail</Text>
            <Text style={styles.subtitle}>
              Un code à 6 chiffres a été envoyé à{' '}
              <Text style={styles.emailHighlight}>{email}</Text>.
            </Text>

            <Text style={styles.label}>Code</Text>
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
              autoFocus
              keyboardType="number-pad"
              placeholder="123456"
              placeholderTextColor={kolmiColors.textMuted}
              style={styles.input}
              inputAccessoryViewID={
                Platform.OS === 'ios' ? EMPTY_ACCESSORY_ID : undefined
              }
              maxLength={6}
              onSubmitEditing={handleSubmit}
            />

            {error && <Text style={styles.error}>{error}</Text>}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cta, (!isValid || submitting) && styles.ctaDisabled]}
              disabled={!isValid || submitting}
              onPress={handleSubmit}
              activeOpacity={isValid && !submitting ? 0.85 : 1}
            >
              {submitting ? (
                <ActivityIndicator color={kolmiColors.white} />
              ) : (
                <Text style={styles.ctaText}>Valider</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.back}>
              <Text style={styles.backText}>Changer d'email</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        {Platform.OS === 'ios' && <EmptyKeyboardAccessory />}
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
  },
  title: {
    fontFamily: kolmiFonts.serif,
    fontSize: fontScale(32),
    color: kolmiColors.text,
    lineHeight: 38,
    letterSpacing: -0.4,
    marginBottom: kolmiSpace.md,
  },
  subtitle: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 15,
    color: kolmiColors.textBody,
    lineHeight: 22,
    marginBottom: kolmiSpace.xl,
  },
  emailHighlight: {
    fontFamily: kolmiFonts.uiMedium,
    color: kolmiColors.text,
  },
  label: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 13,
    color: kolmiColors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: kolmiSpace.sm,
  },
  input: {
    fontFamily: kolmiFonts.ui,
    fontSize: 28,
    letterSpacing: 8,
    textAlign: 'center',
    color: kolmiColors.text,
    borderBottomWidth: 1,
    borderBottomColor: kolmiColors.outline,
    paddingVertical: kolmiSpace.md,
  },
  error: {
    fontFamily: kolmiFonts.ui,
    fontSize: 13,
    color: kolmiColors.accent,
    marginTop: kolmiSpace.sm,
  },
  footer: {
    paddingHorizontal: kolmiPaddingX,
    paddingBottom: kolmiSpace.lg,
    gap: kolmiSpace.md,
  },
  cta: {
    height: 56,
    borderRadius: kolmiRadius.pill,
    backgroundColor: kolmiColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 16,
    color: kolmiColors.white,
    letterSpacing: 0.2,
  },
  back: { alignItems: 'center', paddingVertical: kolmiSpace.sm },
  backText: {
    fontFamily: kolmiFonts.ui,
    fontSize: 14,
    color: kolmiColors.textMuted,
  },
})
