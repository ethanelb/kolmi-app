import React, { useEffect, useState } from 'react'
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { getSelectedProfileById } from '@/data/mockSelectedProfiles'
import {
  deleteMeeting,
  getTokens,
  saveMeeting,
  spendToken,
} from '@/lib/kolmi/storage'
import type { Meeting } from '@/lib/kolmi/types'

export default function MeetingRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const profile = getSelectedProfileById(id ?? '')
  const [tokens, setTokens] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getTokens().then(setTokens)
  }, [])

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: kolmiColors.bg }}>
        <GrainOverlay />
        <SafeAreaView
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: kolmiPaddingX,
          }}
        >
          <Text
            style={{
              fontFamily: kolmiFonts.serifItalic,
              fontSize: 16,
              color: kolmiColors.textMuted,
            }}
          >
            Profil introuvable.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginTop: kolmiSpace.md }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.uiMedium,
                fontSize: 14,
                color: kolmiColors.accent,
              }}
            >
              Retour
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    )
  }

  const hasTokens = (tokens ?? 0) > 0

  const onConfirm = async () => {
    if (submitting) return
    setSubmitting(true)

    // Pre-check tokens without spending — if zero, push to premium.
    const balance = await getTokens()
    if (balance <= 0) {
      setSubmitting(false)
      Alert.alert(
        'Plus de tokens',
        'Recharger pour demander cette rencontre.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Voir Premium',
            onPress: () => router.replace('/premium'),
          },
        ],
      )
      return
    }

    // V1 local: save the meeting first, then spend the token. If the spend
    // fails after the meeting is persisted, roll back the meeting so the
    // user neither pays for nothing nor sees a ghost meeting.
    // In production this MUST be a server-side transaction.
    const now = new Date().toISOString()
    const meeting: Meeting = {
      id: `meeting-${profile.id}-${Date.now()}`,
      profileId: profile.id,
      status: 'waiting_for_other',
      createdAt: now,
    }

    try {
      await saveMeeting(meeting)
      const spent = await spendToken()
      if (!spent) {
        await deleteMeeting(meeting.id)
        throw new Error('Token introuvable au moment du débit.')
      }
      router.replace('/(tabs)/dates')
    } catch (err) {
      console.warn('[kolmi] meeting request failed', err)
      // Best-effort rollback if anything fails downstream of save.
      deleteMeeting(meeting.id).catch(() => {})
      Alert.alert(
        'Demande non envoyée',
        "Une erreur est survenue. Aucun token n'a été débité. Réessayez dans un instant.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: kolmiColors.bg }}>
      <GrainOverlay />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View
          style={{
            paddingHorizontal: kolmiPaddingX,
            paddingTop: kolmiSpace.xs,
            paddingBottom: kolmiSpace.sm,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ paddingVertical: 4 }}
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
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: kolmiPaddingX,
            paddingBottom: kolmiSpace.xxxl,
            gap: kolmiSpace.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: kolmiSpace.xs }}>
            <Text
              style={{
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 11,
                color: kolmiColors.accent,
                textTransform: 'uppercase',
                letterSpacing: 1.6,
              }}
            >
              Demande de rencontre
            </Text>
            <Text
              style={{
                fontFamily: kolmiFonts.serif,
                fontSize: 36,
                color: kolmiColors.text,
                lineHeight: 42,
                letterSpacing: -0.4,
              }}
            >
              {profile.firstName}, {profile.age}
            </Text>
            <Text
              style={{
                fontFamily: kolmiFonts.serifItalic,
                fontSize: 16,
                color: kolmiColors.textBody,
                lineHeight: 22,
              }}
            >
              {profile.dnaLabel} · {profile.city}
            </Text>
          </View>

          {profile.photoUrl && (
            <Image
              source={{ uri: profile.photoUrl }}
              style={{
                width: '100%',
                height: 220,
                borderRadius: kolmiRadius.lg,
                backgroundColor: kolmiColors.surfaceSoft,
              }}
            />
          )}

          <View
            style={{
              borderWidth: 1,
              borderColor: 'rgba(22,19,15,0.12)',
              backgroundColor: '#FAF8F5',
              borderRadius: kolmiRadius.lg,
              padding: kolmiSpace.md,
              gap: kolmiSpace.sm,
            }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 11,
                color: kolmiColors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1.6,
              }}
            >
              Comment ça se passe
            </Text>
            <Step n={1} text="Votre matchmaker transmet la demande à l'autre profil." />
            <Step n={2} text="Si elle accepte, vous choisissez chacun vos disponibilités." />
            <Step n={3} text="Le matchmaker confirme un créneau et un lieu choisi pour vous deux." />
          </View>

          <View
            style={{
              borderTopWidth: 1,
              borderColor: kolmiColors.outline,
              paddingTop: kolmiSpace.md,
              gap: kolmiSpace.xs,
            }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.uiMedium,
                fontSize: 13,
                color: kolmiColors.textSecondary,
              }}
            >
              Coût : 1 token de rencontre
            </Text>
            <Text
              style={{
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 16,
                color: hasTokens ? kolmiColors.text : kolmiColors.accent,
              }}
            >
              {tokens === null
                ? '…'
                : hasTokens
                  ? `Solde : ${tokens} token${tokens > 1 ? 's' : ''}`
                  : 'Solde insuffisant'}
            </Text>
          </View>

          <View style={{ gap: kolmiSpace.sm, marginTop: kolmiSpace.sm }}>
            {hasTokens ? (
              <TouchableOpacity
                onPress={onConfirm}
                activeOpacity={0.85}
                disabled={submitting || tokens === null}
                style={{
                  height: 56,
                  borderRadius: kolmiRadius.pill,
                  backgroundColor: kolmiColors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: submitting || tokens === null ? 0.6 : 1,
                  shadowColor: '#5A0A0A',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.18,
                  shadowRadius: 14,
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: kolmiFonts.uiSemiBold,
                    fontSize: 16,
                    color: kolmiColors.white,
                    letterSpacing: 0.2,
                  }}
                >
                  {submitting ? 'Envoi…' : 'Confirmer la demande'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.replace('/premium')}
                activeOpacity={0.85}
                style={{
                  height: 56,
                  borderRadius: kolmiRadius.pill,
                  backgroundColor: kolmiColors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: kolmiFonts.uiSemiBold,
                    fontSize: 16,
                    color: kolmiColors.white,
                    letterSpacing: 0.2,
                  }}
                >
                  Recharger des tokens
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{
                height: 56,
                borderRadius: kolmiRadius.pill,
                borderWidth: 1.5,
                borderColor: kolmiColors.outline,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: kolmiFonts.uiMedium,
                  fontSize: 16,
                  color: kolmiColors.text,
                }}
              >
                Annuler
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: kolmiSpace.sm, alignItems: 'flex-start' }}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 1,
          borderColor: kolmiColors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}
      >
        <Text
          style={{
            fontFamily: kolmiFonts.uiSemiBold,
            fontSize: 11,
            color: kolmiColors.accent,
          }}
        >
          {n}
        </Text>
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: kolmiFonts.serifItalic,
          fontSize: 15,
          color: kolmiColors.text,
          lineHeight: 22,
        }}
      >
        {text}
      </Text>
    </View>
  )
}
