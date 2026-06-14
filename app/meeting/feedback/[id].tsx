import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
} from 'react-native'
import { Image } from 'expo-image'
import Svg, { Path, Line, Circle, G } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
  fontScale,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { getProfileByIdSync as getSelectedProfileById } from '@/lib/kolmi/fetchProfiles'
import { getMeetingById, updateMeeting } from '@/lib/kolmi/storage'
import { simulateOtherFeedback } from '@/lib/kolmi/mockBackend'
import { tapMedium, success } from '@/lib/kolmi/haptics'
import type { Meeting } from '@/lib/kolmi/types'

// Écran de feedback post-rendez-vous : 2 boutons binaires, irréversibles.
// Pas de note 1-5, pas d'étoile. La décision modifie le Meeting et,
// pour la branche "on se revoit", déclenche la décision de l'autre via
// le mock backend (pour pouvoir simuler un match mutuel).
export default function MeetingFeedbackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const stored = id ? await getMeetingById(id) : null
      if (!cancelled) {
        setMeeting(stored)
        setLoaded(true)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const profile = useMemo(
    () => (meeting ? getSelectedProfileById(meeting.profileId) : null),
    [meeting],
  )

  const handleChoice = useCallback(
    async (wantsAgain: boolean) => {
      if (!meeting || submitting) return
      setSubmitting(true)
      tapMedium()

      try {
        await updateMeeting(meeting.id, {
          status: 'completed',
          feedbackByMe: wantsAgain,
        })

        if (wantsAgain) {
          // Mock backend : simule la décision de l'autre. Si match mutuel,
          // une notif locale est poussée (cf. simulateOtherFeedback).
          simulateOtherFeedback(meeting.id)
          success()
          // Stub : conversation pas encore implémentée.
          Alert.alert(
            'Réponse enregistrée.',
            "Si l'autre dit oui aussi, vous serez prévenu·e dès qu'il/elle aura répondu.",
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/encounters') }],
          )
        } else {
          router.replace('/(tabs)/encounters')
        }
      } catch (err) {
        console.warn('[kolmi] feedback failed', err)
        Alert.alert('Erreur', "Le feedback n'a pas pu être enregistré.")
        setSubmitting(false)
      }
    },
    [meeting, submitting, router],
  )

  if (!loaded) {
    return (
      <View style={styles.root}>
        <GrainOverlay />
        <SafeAreaView style={styles.centered}>
          <Text style={styles.placeholderText}>Chargement…</Text>
        </SafeAreaView>
      </View>
    )
  }

  if (!meeting || !profile) {
    return (
      <View style={styles.root}>
        <GrainOverlay />
        <SafeAreaView style={styles.centered}>
          <Text style={styles.placeholderText}>Rendez-vous introuvable.</Text>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
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
            <Text style={styles.headerKicker}>Après le rendez-vous</Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.body}>
          {/* Vignette discrète : avatar 40×40 + prénom italique sous */}
          <Animated.View entering={FadeIn.duration(420)} style={styles.vignette}>
            <View style={styles.avatarWrap}>
              {profile.photoUrl ? (
                <Image
                  source={{ uri: profile.photoUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarLetter}>
                    {profile.firstName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.vignetteName}>
              avec <Text style={styles.vignetteNameAccent}>{profile.firstName}</Text>
            </Text>
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.delay(220).duration(500)}
            style={styles.title}
          >
            Et alors ?
          </Animated.Text>

          {/* Carte 1 — On se revoit */}
          <Animated.View entering={FadeInDown.delay(420).duration(500)}>
            <TouchableOpacity
              onPress={() => handleChoice(true)}
              activeOpacity={0.88}
              disabled={submitting}
              style={[styles.cardChoice, styles.cardChoicePrimary]}
            >
              <View style={styles.cardChoiceHeader}>
                <PedimentMark color={kolmiColors.white} />
              </View>
              <Text style={styles.cardChoiceTextPrimary}>On se revoit.</Text>
              <Text style={styles.cardChoiceSubPrimary}>
                {profile.firstName} sera prévenu·e si elle/il dit oui aussi.
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Carte 2 — On en reste là */}
          <Animated.View entering={FadeInDown.delay(580).duration(500)}>
            <TouchableOpacity
              onPress={() => handleChoice(false)}
              activeOpacity={0.7}
              disabled={submitting}
              style={[styles.cardChoice, styles.cardChoiceSecondary]}
            >
              <Text style={styles.cardChoiceTextSecondary}>On en reste là.</Text>
              <Text style={styles.cardChoiceSubSecondary}>
                Pas de suite. Discrètement, sans message.
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.note}>
            Votre choix est définitif. Aucun message n'est envoyé à {profile.firstName}.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  )
}

// Mini fronton bordeaux/blanc pour la carte primaire.
function PedimentMark({ color }: { color: string }) {
  return (
    <Svg width={36} height={20} viewBox="0 0 36 20" fill="none">
      <G stroke={color} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M 18 4 L 4 14 L 32 14 Z" strokeWidth={1.4} fill="none" />
        <Circle cx="18" cy="11.5" r="0.7" fill={color} />
        <Line x1="2" y1="14" x2="34" y2="14" strokeWidth={1.4} />
        <Line x1="2" y1="17" x2="34" y2="17" strokeWidth={0.8} />
      </G>
    </Svg>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    color: kolmiColors.textMuted,
  },
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
  body: {
    flex: 1,
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.lg,
    paddingBottom: kolmiSpace.lg,
    gap: kolmiSpace.lg,
  },

  vignette: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: kolmiSpace.sm,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: kolmiColors.surfaceSoft,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#EFE7DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: kolmiFonts.serif,
    fontSize: 18,
    color: kolmiColors.accent,
  },
  vignetteName: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    color: kolmiColors.textBody,
  },
  vignetteNameAccent: {
    color: kolmiColors.text,
  },

  title: {
    fontFamily: kolmiFonts.serif,
    fontSize: fontScale(28),
    color: kolmiColors.text,
    lineHeight: 34,
    letterSpacing: -0.4,
    marginTop: kolmiSpace.sm,
  },

  cardChoice: {
    borderRadius: kolmiRadius.lg,
    paddingVertical: kolmiSpace.xl,
    paddingHorizontal: kolmiSpace.lg,
    gap: kolmiSpace.xs,
  },
  cardChoicePrimary: {
    backgroundColor: kolmiColors.accent,
    shadowColor: '#5A0A0A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  cardChoiceHeader: {
    marginBottom: kolmiSpace.sm,
  },
  cardChoiceTextPrimary: {
    fontFamily: kolmiFonts.serif,
    fontSize: 26,
    color: kolmiColors.white,
    letterSpacing: -0.4,
  },
  cardChoiceSubPrimary: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 20,
    marginTop: 4,
  },
  cardChoiceSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: kolmiColors.outline,
  },
  cardChoiceTextSecondary: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 22,
    color: kolmiColors.textBody,
    letterSpacing: -0.2,
  },
  cardChoiceSubSecondary: {
    fontFamily: kolmiFonts.ui,
    fontSize: 13,
    color: kolmiColors.textMuted,
    lineHeight: 19,
    marginTop: 4,
  },

  note: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 11,
    color: kolmiColors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: 'auto',
    paddingTop: kolmiSpace.lg,
  },
})
