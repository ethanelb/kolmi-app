import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import {
  getKolmiDnaResult,
  getKolmiPreferences,
  getKolmiProfile,
  getTokens,
  resetKolmiState,
  type KolmiPreferences,
  type KolmiProfile,
} from '@/lib/kolmi/storage'
import type { KolmiDnaResult } from '@/lib/kolmi/types'

export default function ProfileTabScreen() {
  const router = useRouter()
  const [profile, setProfile] = useState<KolmiProfile>({})
  const [dna, setDna] = useState<KolmiDnaResult | null>(null)
  const [prefs, setPrefs] = useState<KolmiPreferences | null>(null)
  const [tokens, setTokensState] = useState<number>(0)

  const refresh = React.useCallback(() => {
    getKolmiProfile().then(setProfile)
    getKolmiDnaResult().then(setDna)
    getKolmiPreferences().then(setPrefs)
    getTokens().then(setTokensState)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useFocusEffect(
    React.useCallback(() => {
      refresh()
    }, [refresh])
  )

  function handleSignOut() {
    Alert.alert(
      'Se déconnecter',
      'Toutes vos données locales seront effacées sur cet appareil.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await resetKolmiState()
            router.replace('/')
          },
        },
      ]
    )
  }

  function handleDevRestart() {
    Alert.alert(
      "Recommencer l'onboarding",
      'Vos réponses, votre profil et votre Maison seront effacés pour pouvoir refaire le flow.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Recommencer',
          style: 'destructive',
          onPress: async () => {
            await resetKolmiState()
            router.replace('/onboarding/welcome')
          },
        },
      ]
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: kolmiColors.bg }}>
      <GrainOverlay />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: kolmiPaddingX,
            paddingTop: kolmiSpace.md,
            paddingBottom: kolmiSpace.xxxl,
            gap: kolmiSpace.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: kolmiSpace.xs }}>
            <Text
              style={{
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 11,
                letterSpacing: 1.6,
                color: kolmiColors.textSecondary,
                textTransform: 'uppercase',
              }}
            >
              {profile.firstName ? 'Bonjour' : 'Profil'}
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
              {profile.firstName ?? 'Mon profil'}
            </Text>
          </View>

          {/* Maison ADN */}
          {dna && (
            <Section title="Ma Maison">
              <View style={{ gap: kolmiSpace.xs }}>
                <Text
                  style={{
                    fontFamily: kolmiFonts.serif,
                    fontSize: 28,
                    color: kolmiColors.text,
                    letterSpacing: -0.3,
                  }}
                >
                  {dna.categoryLabel}
                </Text>
                <Text
                  style={{
                    fontFamily: kolmiFonts.serifItalic,
                    fontSize: 14,
                    color: kolmiColors.textBody,
                    lineHeight: 20,
                  }}
                >
                  {dna.summary}
                </Text>
              </View>
              <ActionRow
                label="Voir mon ADN"
                onPress={() =>
                  router.push({
                    pathname: '/matchmaker/result',
                    params: { instant: '1' },
                  })
                }
              />
              <ActionRow
                label="Refaire le test"
                onPress={() => router.replace('/matchmaker')}
              />
            </Section>
          )}

          {/* Tokens */}
          <Section title="Tokens de rencontre">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: kolmiFonts.serif,
                  fontSize: 40,
                  color: kolmiColors.accent,
                  letterSpacing: -0.5,
                }}
              >
                {tokens}
              </Text>
              <Text
                style={{
                  fontFamily: kolmiFonts.serifItalic,
                  fontSize: 14,
                  color: kolmiColors.textBody,
                }}
              >
                {tokens > 1 ? 'tokens disponibles' : tokens === 1 ? 'token disponible' : 'aucun token'}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: kolmiFonts.ui,
                fontSize: 13,
                color: kolmiColors.textMuted,
                lineHeight: 19,
              }}
            >
              Un token est utilisé pour demander une rencontre.
            </Text>
            <ActionRow
              label="Acheter des tokens"
              onPress={() => router.push('/premium')}
            />
          </Section>

          {/* Profil — édition */}
          <Section title="Mon profil">
            <Text
              style={{
                fontFamily: kolmiFonts.ui,
                fontSize: 14,
                color: kolmiColors.textBody,
                lineHeight: 21,
              }}
            >
              {(profile.photoUrls?.length ?? 0)} photo
              {(profile.photoUrls?.length ?? 0) > 1 ? 's' : ''}
              {profile.heightCm ? ` · ${profile.heightCm} cm` : ''}
              {profile.gender ? ` · ${profile.gender}` : ''}
            </Text>
            <ActionRow
              label="Modifier mon profil"
              onPress={() => router.push('/profile')}
            />
          </Section>

          {/* Préférences */}
          <Section title="Mes préférences">
            {prefs ? (
              <Text
                style={{
                  fontFamily: kolmiFonts.ui,
                  fontSize: 14,
                  color: kolmiColors.textBody,
                  lineHeight: 21,
                }}
              >
                {prefs.minAge}–{prefs.maxAge} ans · {prefs.distance}
              </Text>
            ) : (
              <Text
                style={{
                  fontFamily: kolmiFonts.serifItalic,
                  fontSize: 14,
                  color: kolmiColors.textMuted,
                }}
              >
                Aucune préférence renseignée.
              </Text>
            )}
            <ActionRow label="Modifier mes préférences" onPress={() => {}} disabled />
          </Section>

          {/* Compte */}
          <Section title="Compte">
            <ActionRow
              label="Confidentialité"
              onPress={() => {}}
              disabled
            />
            {__DEV__ && (
              <ActionRow
                label="Recommencer l'onboarding (dev)"
                onPress={handleDevRestart}
                tone="danger"
              />
            )}
            <ActionRow
              label="Se déconnecter"
              onPress={handleSignOut}
              tone="danger"
            />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: kolmiSpace.sm }}>
      <Text
        style={{
          fontFamily: kolmiFonts.uiSemiBold,
          fontSize: 11,
          color: kolmiColors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1.6,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          padding: kolmiSpace.md,
          borderRadius: kolmiRadius.lg,
          borderWidth: 1,
          borderColor: 'rgba(22,19,15,0.12)',
          backgroundColor: '#FAF8F5',
          gap: kolmiSpace.sm,
        }}
      >
        {children}
      </View>
    </View>
  )
}

function ActionRow({
  label,
  onPress,
  disabled,
  tone,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  tone?: 'danger'
}) {
  const color = disabled
    ? kolmiColors.textMuted
    : tone === 'danger'
      ? kolmiColors.accent
      : kolmiColors.text
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
      style={{
        height: 44,
        borderRadius: kolmiRadius.pill,
        borderWidth: 1,
        borderColor:
          tone === 'danger' ? kolmiColors.accent : kolmiColors.outline,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: kolmiFonts.uiSemiBold,
          fontSize: 14,
          color,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}
