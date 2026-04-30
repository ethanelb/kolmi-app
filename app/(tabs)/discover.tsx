import React, { useEffect, useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  kolmiColors,
  kolmiSpace,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { mockSelectedProfiles, type SelectedProfile } from '@/data/mockSelectedProfiles'
import { getPassedProfiles } from '@/lib/kolmi/storage'
import { tapMedium } from '@/lib/kolmi/haptics'

type Section = {
  id: string
  title: string
  profiles: SelectedProfile[]
}

export default function DiscoverScreen() {
  const router = useRouter()
  const [passed, setPassed] = useState<string[]>([])
  const [analyzed, setAnalyzed] = useState<Set<string>>(new Set())

  const refresh = React.useCallback(() => {
    getPassedProfiles().then(setPassed)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useFocusEffect(
    React.useCallback(() => {
      refresh()
    }, [refresh])
  )

  // Sections mutuellement exclusives — un profil n'apparaît jamais
  // dans plus d'une section.
  const available = mockSelectedProfiles.filter((p) => !passed.includes(p.id))
  const featured = available.filter((p) => p.isFeatured)
  const compat = available.filter((p) => !p.isFeatured && p.compatibility >= 85)
  const placedIds = new Set([...featured, ...compat].map((p) => p.id))
  const week = available.filter((p) => !placedIds.has(p.id))

  const sections: Section[] = [
    { id: 'featured', title: 'Profils mis en avant', profiles: featured },
    { id: 'compat', title: 'Compatibles avec votre Maison', profiles: compat },
    { id: 'week', title: 'Disponibles cette semaine', profiles: week },
  ]

  const allEmpty = sections.every((s) => s.profiles.length === 0)

  function handleAnalyze(id: string) {
    tapMedium()
    setAnalyzed((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
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
                fontFamily: kolmiFonts.serif,
                fontSize: 36,
                color: kolmiColors.text,
                lineHeight: 42,
                letterSpacing: -0.4,
              }}
            >
              Découvrir
            </Text>
            <Text
              style={{
                fontFamily: kolmiFonts.serifItalic,
                fontSize: 16,
                color: kolmiColors.textBody,
                lineHeight: 22,
              }}
            >
              Des profils mis en avant que votre matchmaker peut analyser pour vous.
            </Text>
          </View>

          {allEmpty && (
            <View
              style={{
                marginTop: kolmiSpace.lg,
                padding: kolmiSpace.lg,
                borderRadius: kolmiRadius.lg,
                borderWidth: 1,
                borderColor: kolmiColors.outline,
                gap: kolmiSpace.sm,
              }}
            >
              <Text
                style={{
                  fontFamily: kolmiFonts.serif,
                  fontSize: 22,
                  color: kolmiColors.text,
                  lineHeight: 28,
                }}
              >
                Aucun profil mis en avant pour le moment.
              </Text>
              <Text
                style={{
                  fontFamily: kolmiFonts.serifItalic,
                  fontSize: 15,
                  color: kolmiColors.textBody,
                  lineHeight: 22,
                }}
              >
                Revenez plus tard — votre matchmaker prépare de nouvelles découvertes.
              </Text>
            </View>
          )}

          {!allEmpty && sections.map((section) => (
            <View key={section.id} style={{ gap: kolmiSpace.sm }}>
              <Text
                style={{
                  fontFamily: kolmiFonts.uiSemiBold,
                  fontSize: 11,
                  color: kolmiColors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 1.6,
                }}
              >
                {section.title}
              </Text>
              {section.profiles.length === 0 ? (
                <Text
                  style={{
                    fontFamily: kolmiFonts.serifItalic,
                    fontSize: 14,
                    color: kolmiColors.textMuted,
                    paddingVertical: kolmiSpace.sm,
                  }}
                >
                  Aucun profil dans cette section pour l&apos;instant.
                </Text>
              ) : (
                <View style={{ gap: kolmiSpace.md }}>
                  {section.profiles.map((profile) => (
                    <DiscoverCard
                      key={`${section.id}-${profile.id}`}
                      profile={profile}
                      analyzed={analyzed.has(profile.id)}
                      onAnalyze={() => handleAnalyze(profile.id)}
                      onView={() => router.push(`/matches/${profile.id}`)}
                    />
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function DiscoverCard({
  profile,
  analyzed,
  onAnalyze,
  onView,
}: {
  profile: SelectedProfile
  analyzed: boolean
  onAnalyze: () => void
  onView: () => void
}) {
  return (
    <View
      style={{
        borderRadius: kolmiRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(22,19,15,0.12)',
        backgroundColor: '#FAF8F5',
        overflow: 'hidden',
      }}
    >
      {profile.photoUrl && (
        <Image
          source={{ uri: profile.photoUrl }}
          style={{ width: '100%', height: 220, backgroundColor: kolmiColors.surfaceSoft }}
        />
      )}
      <View style={{ padding: kolmiSpace.md, gap: kolmiSpace.xs }}>
        <Text
          style={{
            fontFamily: kolmiFonts.serif,
            fontSize: 22,
            color: kolmiColors.text,
            letterSpacing: -0.3,
          }}
        >
          {profile.firstName}, {profile.age}
        </Text>
        <Text
          style={{
            fontFamily: kolmiFonts.uiMedium,
            fontSize: 12,
            color: kolmiColors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
          }}
        >
          {profile.dnaLabel} · {profile.city}
        </Text>
        <Text
          style={{
            fontFamily: kolmiFonts.serifItalic,
            fontSize: 14,
            color: kolmiColors.textBody,
            lineHeight: 20,
            marginTop: 4,
          }}
        >
          « {profile.reason} »
        </Text>

        {analyzed && (
          <Text
            style={{
              fontFamily: kolmiFonts.serifItalic,
              fontSize: 13,
              color: kolmiColors.accent,
              lineHeight: 19,
              marginTop: 6,
            }}
          >
            Votre matchmaker pense que ce profil mérite une rencontre.
          </Text>
        )}

        <View style={{ flexDirection: 'row', gap: kolmiSpace.xs, marginTop: kolmiSpace.sm }}>
          <TouchableOpacity
            onPress={analyzed ? onView : onAnalyze}
            activeOpacity={0.85}
            style={{
              flex: 1,
              height: 44,
              borderRadius: kolmiRadius.pill,
              backgroundColor: kolmiColors.text,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 14,
                color: '#FAF8F5',
              }}
            >
              {analyzed ? 'Voir le profil' : 'Demander l\'analyse'}
            </Text>
          </TouchableOpacity>
          {!analyzed && (
            <TouchableOpacity
              onPress={onView}
              activeOpacity={0.7}
              style={{
                flex: 1,
                height: 44,
                borderRadius: kolmiRadius.pill,
                borderWidth: 1,
                borderColor: kolmiColors.outline,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: kolmiFonts.uiMedium,
                  fontSize: 14,
                  color: kolmiColors.text,
                }}
              >
                Voir le profil
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}
