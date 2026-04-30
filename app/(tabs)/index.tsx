import React, { useEffect, useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity } from 'react-native'
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated'
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
import KolmiWordmark from '@/components/kolmi/KolmiWordmark'
import MatchmakerGreeting from '@/components/kolmi/MatchmakerGreeting'
import SelectedProfileCard from '@/components/kolmi/SelectedProfileCard'
import { mockSelectedProfiles } from '@/data/mockSelectedProfiles'
import { getPassedProfiles, passProfile } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'
import { kolmiMotion, staggerDelay } from '@/lib/kolmi/motion'
import { tapMedium } from '@/lib/kolmi/haptics'

export default function SelectionScreen() {
  const router = useRouter()
  const [passed, setPassed] = useState<string[]>([])

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

  const visible = mockSelectedProfiles
    .filter((p) => !p.isFeatured)
    .filter((p) => !passed.includes(p.id))

  async function handlePass(profileId: string) {
    tapMedium()
    const ok = await safePersist(() => passProfile(profileId))
    if (!ok) return
    setPassed((prev) => (prev.includes(profileId) ? prev : [...prev, profileId]))
  }

  return (
    <View style={{ flex: 1, backgroundColor: kolmiColors.bg }}>
      <GrainOverlay />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Animated.View
          entering={FadeIn.duration(kolmiMotion.duration.lg).easing(kolmiMotion.easing.soft)}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: kolmiPaddingX,
            paddingVertical: kolmiSpace.sm,
          }}
        >
          <KolmiWordmark size={32} color={kolmiColors.accent} />
          <TouchableOpacity
            onPress={() => router.push('/premium')}
            activeOpacity={0.7}
            style={{
              borderWidth: 1,
              borderColor: kolmiColors.outline,
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 12,
                color: kolmiColors.text,
                letterSpacing: 0.4,
              }}
            >
              Premium
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: kolmiPaddingX,
            paddingTop: kolmiSpace.lg,
            paddingBottom: kolmiSpace.xxxl,
            gap: kolmiSpace.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeIn.delay(40).duration(kolmiMotion.duration.lg).easing(kolmiMotion.easing.soft)}
            style={{
              alignSelf: 'flex-start',
              borderRadius: 999,
              borderWidth: 1,
              borderColor: 'rgba(139, 26, 26, 0.4)',
              paddingHorizontal: 12,
              paddingVertical: 5,
            }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 10,
                color: kolmiColors.accent,
                letterSpacing: 1.6,
                textTransform: 'uppercase',
              }}
            >
              Sélection du jour
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(120).duration(kolmiMotion.duration.lg).easing(kolmiMotion.easing.soft)}
          >
            <MatchmakerGreeting count={visible.length} />
          </Animated.View>

          {visible.length > 0 ? (
            <View style={{ gap: kolmiSpace.md, marginTop: kolmiSpace.sm }}>
              {visible.map((profile, i) => (
                <Animated.View
                  key={profile.id}
                  entering={FadeInDown.delay(staggerDelay(i, 200))
                    .duration(kolmiMotion.duration.lg)
                    .easing(kolmiMotion.easing.soft)}
                  style={{ gap: kolmiSpace.xs }}
                >
                  <SelectedProfileCard
                    profile={profile}
                    onPress={() => router.push(`/matches/${profile.id}`)}
                  />
                  <View style={{ flexDirection: 'row', gap: kolmiSpace.xs }}>
                    <TouchableOpacity
                      onPress={() => router.push(`/matches/${profile.id}`)}
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
                          letterSpacing: 0.2,
                        }}
                      >
                        Voir le profil
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handlePass(profile.id)}
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
                        Pas pour moi
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View
              style={{
                marginTop: kolmiSpace.xxl,
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
                Votre matchmaker prépare une nouvelle sélection.
              </Text>
              <Text
                style={{
                  fontFamily: kolmiFonts.serifItalic,
                  fontSize: 15,
                  color: kolmiColors.textBody,
                  lineHeight: 22,
                }}
              >
                Revenez bientôt pour découvrir des profils plus compatibles.
              </Text>
            </View>
          )}

          <Text
            style={{
              fontFamily: kolmiFonts.serifItalic,
              fontSize: 13,
              color: kolmiColors.textMuted,
              textAlign: 'center',
              marginTop: kolmiSpace.md,
            }}
          >
            Une nouvelle sélection chaque semaine.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
