import React, { useRef, useState } from 'react'
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
import { useRouter } from 'expo-router'
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
import { tapMedium } from '@/lib/kolmi/haptics'
import { supabase } from '@/lib/supabase'

// Étape 1 du flow "Sécuriser mon compte" : on prend l'email du user anonyme,
// on déclenche un OTP via supabase.auth.updateUser, puis on passe à
// /auth/verify pour la saisie du code.
export default function AuthEmailScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<TextInput>(null)

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  async function handleSubmit() {
    if (!isValid || submitting) return
    tapMedium()
    setSubmitting(true)
    setError(null)
    const trimmed = email.trim().toLowerCase()
    const { error: err } = await supabase.auth.updateUser({ email: trimmed })
    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    router.push({ pathname: '/auth/verify', params: { email: trimmed } })
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
            <Text style={styles.title}>Sécurisez votre compte</Text>
            <Text style={styles.subtitle}>
              Votre profil, vos rencontres et vos tokens seront sauvegardés et
              accessibles depuis n'importe quel appareil.
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              ref={inputRef}
              value={email}
              onChangeText={setEmail}
              autoFocus
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="votre@email.com"
              placeholderTextColor={kolmiColors.textMuted}
              style={styles.input}
              inputAccessoryViewID={
                Platform.OS === 'ios' ? EMPTY_ACCESSORY_ID : undefined
              }
              returnKeyType="next"
              onSubmitEditing={handleSubmit}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Text style={styles.hint}>
              Vous recevrez un code à 6 chiffres dans votre boîte mail.
            </Text>
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
                <Text
                  style={[styles.ctaText, !isValid && styles.ctaTextDisabled]}
                >
                  Envoyer le code
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.back}
            >
              <Text style={styles.backText}>Annuler</Text>
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
    fontSize: 17,
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
  hint: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 13,
    color: kolmiColors.textMuted,
    marginTop: kolmiSpace.md,
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
  ctaTextDisabled: { color: kolmiColors.white },
  back: { alignItems: 'center', paddingVertical: kolmiSpace.sm },
  backText: {
    fontFamily: kolmiFonts.ui,
    fontSize: 14,
    color: kolmiColors.textMuted,
  },
})
