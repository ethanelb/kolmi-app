import React, { useEffect, useState, useCallback } from 'react'
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Image } from 'expo-image'
import Svg, { Path } from 'react-native-svg'
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
  fontScale,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import SwipeToConfirm from '@/components/kolmi/SwipeToConfirm'
import AnimatedCounter from '@/components/kolmi/AnimatedCounter'
import { getProfileByIdSync as getSelectedProfileById } from '@/lib/kolmi/fetchProfiles'
import {
  deleteMeeting,
  findActiveMeetingForProfile,
  getTokens,
  saveMeeting,
  spendToken,
} from '@/lib/kolmi/storage'
import { simulateOtherDecision } from '@/lib/kolmi/mockBackend'
import type { Meeting, MeetingStatus } from '@/lib/kolmi/types'

const NOTE_MAX = 80

// Quand un meeting non terminal existe déjà pour ce profil, on redirige
// vers l'écran qui correspond à son état plutôt que de créer un doublon.
function nextRouteForActive(meeting: Meeting): string {
  switch (meeting.status as MeetingStatus) {
    case 'confirmed':
      return `/meeting/confirm/${meeting.id}`
    case 'accepted_waiting_slots':
      return `/meeting/schedule/${meeting.id}`
    default:
      return '/(tabs)/encounters'
  }
}

export default function MeetingRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const profile = getSelectedProfileById(id ?? '')
  const [tokens, setTokens] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    getTokens().then(setTokens)
  }, [])

  const onConfirm = useCallback(async () => {
    if (submitting || !profile) return
    setSubmitting(true)

    // 0. Idempotence : si une demande non-terminale existe déjà pour ce
    // profil, on n'en crée pas une seconde — on redirige vers son écran.
    let active: Meeting | null = null
    try {
      active = await findActiveMeetingForProfile(profile.id)
    } catch (err) {
      console.warn('[kolmi] active meeting lookup failed', err)
    }
    if (active) {
      setSubmitting(false)
      Alert.alert(
        'Demande déjà en cours',
        'Une demande est déjà en cours pour ce profil.',
        [
          {
            text: 'Voir la demande',
            onPress: () => router.replace(nextRouteForActive(active!)),
          },
        ],
      )
      return
    }

    // 1. Pre-check tokens — théoriquement déjà fait avant d'arriver
    // ici (cf. tabs/index modal "rareté"), mais on re-vérifie avant
    // de débiter.
    const balance = await getTokens().catch(() => 0)
    if (balance <= 0) {
      setSubmitting(false)
      Alert.alert(
        'Plus de tokens',
        'Recharger pour demander cette rencontre.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Voir Premium', onPress: () => router.replace('/premium') },
        ],
      )
      return
    }

    // 2. Sauvegarde du meeting puis débit du token. Si quelque chose
    // casse entre les deux, on rollback le meeting tant que le token
    // n'a pas été débité.
    const now = new Date().toISOString()
    const meetingId = `meeting-${profile.id}-${Date.now()}`
    const meeting: Meeting = {
      id: meetingId,
      profileId: profile.id,
      status: 'requested_by_me',
      createdAt: now,
      note: note.trim() || undefined,
    }
    let tokenDebited = false

    try {
      await saveMeeting(meeting)

      const spent = await spendToken()
      if (!spent) {
        await deleteMeeting(meeting.id).catch(() => {})
        Alert.alert(
          'Plus de tokens',
          "Votre solde est à zéro. Aucun token n'a été débité.",
        )
        return
      }
      tokenDebited = true

      // Mock backend : programme la décision de l'autre (5-30 s).
      simulateOtherDecision(meeting.id)

      router.replace('/(tabs)/encounters')
    } catch (err) {
      console.warn('[kolmi] meeting request failed', err)
      if (!tokenDebited) {
        deleteMeeting(meeting.id).catch(() => {})
        Alert.alert(
          'Demande non envoyée',
          "Une erreur est survenue. Aucun token n'a été débité. Réessayez dans un instant.",
        )
      } else {
        Alert.alert(
          'Demande envoyée',
          "Le token a été débité, mais l'ouverture de l'écran suivant a échoué. Retrouvez votre demande dans Rendez-vous.",
        )
      }
    } finally {
      setSubmitting(false)
    }
  }, [submitting, profile, note, router])

  if (!profile) {
    return (
      <View style={styles.root}>
        <GrainOverlay />
        <SafeAreaView style={styles.safe}>
          <View style={styles.notFoundWrap}>
            <Text style={styles.notFoundText}>Profil introuvable.</Text>
            <TouchableOpacity onPress={() => router.back()} style={{ marginTop: kolmiSpace.md }}>
              <Text style={styles.backLink}>Retour</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  const tokensAfter = Math.max(0, (tokens ?? 0) - 1)
  const remainingLabel =
    tokens === null
      ? '—'
      : tokens === 1
        ? 'Plus de token après cet envoi.'
        : `Il vous restera ${tokensAfter} token${tokensAfter > 1 ? 's' : ''}.`

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header minimal : retour à gauche, kicker centré */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backBtn}
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
          <View style={styles.headerCenter}>
            <Text style={styles.headerKicker}>Demande de rendez-vous</Text>
          </View>
          {/* Spacer droit pour équilibrer le retour */}
          <View style={styles.backBtn} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Vignette profil — photo 80×80 + prénom + Maison */}
            <Animated.View entering={FadeIn.duration(420)} style={styles.vignette}>
              <View style={styles.vignettePhoto}>
                {profile.photoUrl ? (
                  <Image
                    source={{ uri: profile.photoUrl }}
                    style={styles.vignettePhotoImg}
                    contentFit="cover"
                    transition={140}
                  />
                ) : (
                  <View style={styles.vignettePhotoPlaceholder}>
                    <Text style={styles.vignettePhotoLetter}>
                      {profile.firstName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.vignetteName}>
                  {profile.firstName}, {profile.age}
                </Text>
                <Text style={styles.vignetteMaison}>{profile.dnaLabel}</Text>
              </View>
            </Animated.View>

            <View style={styles.bigHairline} />

            <Animated.Text
              entering={FadeInDown.delay(280).duration(500)}
              style={styles.title}
            >
              Confirmer votre envoi.
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.delay(380).duration(500)}
              style={styles.subtitle}
            >
              Une fois envoyé, votre matchmaker transmet la demande. {profile.firstName} décidera si vous vous rencontrez.
            </Animated.Text>

            {/* Bloc tokens — carte cream avec compteur animé */}
            <Animated.View
              entering={FadeInDown.delay(600).duration(500)}
              style={styles.tokenCard}
            >
              <Text style={styles.tokenLabel}>Vos tokens</Text>
              <AnimatedCounter
                value={tokens ?? 0}
                style={styles.tokenCounter}
              />
              <Text style={styles.tokenAfter}>{remainingLabel}</Text>
            </Animated.View>

            {/* Petit mot optionnel */}
            <Animated.View
              entering={FadeInDown.delay(800).duration(500)}
              style={styles.noteWrap}
            >
              <Text style={styles.noteLabel}>Un mot pour {profile.firstName}</Text>
              <TextInput
                value={note}
                onChangeText={(t) => setNote(t.slice(0, NOTE_MAX))}
                placeholder="Optionnel — une phrase, pas plus"
                placeholderTextColor={kolmiColors.textMuted}
                style={styles.noteInput}
                multiline
                maxLength={NOTE_MAX}
              />
              <View style={styles.noteHairline} />
              <Text style={styles.noteCount}>
                {note.length}/{NOTE_MAX}
              </Text>
            </Animated.View>
          </ScrollView>

          {/* CTA en bas — SwipeToConfirm + Annuler */}
          <Animated.View
            entering={FadeInDown.delay(1000).duration(500)}
            style={styles.footer}
          >
            <SwipeToConfirm
              label={submitting ? 'Envoi…' : 'Glisser pour confirmer'}
              confirmedLabel="Envoyé."
              onConfirm={onConfirm}
              disabled={submitting || tokens === null || (tokens ?? 0) <= 0}
            />
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={styles.cancelBtn}
              hitSlop={8}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  notFoundWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: kolmiPaddingX,
  },
  notFoundText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    color: kolmiColors.textMuted,
  },
  backLink: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 14,
    color: kolmiColors.accent,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.xs,
    paddingBottom: kolmiSpace.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerKicker: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textMuted,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },

  // Scroll content
  scrollContent: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.lg,
    paddingBottom: kolmiSpace.xxl,
  },

  // Vignette
  vignette: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: kolmiSpace.md,
  },
  vignettePhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: kolmiColors.surfaceSoft,
  },
  vignettePhotoImg: {
    width: '100%',
    height: '100%',
  },
  vignettePhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EFE7DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vignettePhotoLetter: {
    fontFamily: kolmiFonts.serif,
    fontSize: fontScale(32),
    color: kolmiColors.accent,
  },
  vignetteName: {
    fontFamily: kolmiFonts.serif,
    fontSize: 22,
    color: kolmiColors.text,
    letterSpacing: -0.3,
  },
  vignetteMaison: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 13,
    color: kolmiColors.accent,
    letterSpacing: 0.2,
  },

  bigHairline: {
    width: 96,
    height: 0.6,
    backgroundColor: 'rgba(139,26,26,0.55)',
    marginVertical: 28,
  },

  title: {
    fontFamily: kolmiFonts.serif,
    fontSize: fontScale(32),
    color: kolmiColors.text,
    lineHeight: 38,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 17,
    color: kolmiColors.textBody,
    lineHeight: 25,
    marginTop: kolmiSpace.sm,
  },

  // Token card
  tokenCard: {
    marginTop: kolmiSpace.xl,
    padding: kolmiSpace.lg,
    backgroundColor: '#FAF8F5',
    borderRadius: kolmiRadius.lg,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
  },
  tokenLabel: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textMuted,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
  tokenCounter: {
    fontFamily: kolmiFonts.serif,
    fontSize: fontScale(56),
    lineHeight: 60,
    color: kolmiColors.accent,
    letterSpacing: -1,
    marginTop: kolmiSpace.sm,
    includeFontPadding: false,
  },
  tokenAfter: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 14,
    color: kolmiColors.textBody,
    marginTop: kolmiSpace.xs,
  },

  // Note input
  noteWrap: {
    marginTop: kolmiSpace.xl,
    gap: kolmiSpace.xs,
  },
  noteLabel: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textMuted,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
  noteInput: {
    fontFamily: kolmiFonts.ui,
    fontSize: 16,
    color: kolmiColors.text,
    paddingVertical: kolmiSpace.sm,
    paddingHorizontal: 0,
    minHeight: 48,
  },
  noteHairline: {
    height: 0.6,
    backgroundColor: 'rgba(26,26,26,0.18)',
  },
  noteCount: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 11,
    color: kolmiColors.textMuted,
    textAlign: 'right',
    marginTop: kolmiSpace.xxs,
  },

  // Footer
  footer: {
    paddingHorizontal: kolmiPaddingX,
    paddingBottom: kolmiSpace.lg,
    paddingTop: kolmiSpace.sm,
    gap: kolmiSpace.md,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: kolmiSpace.xs,
  },
  cancelText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 14,
    color: kolmiColors.textBody,
  },
})
