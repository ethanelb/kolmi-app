import React from 'react'
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
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

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const profile = getSelectedProfileById(id ?? '')

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: kolmiColors.bg }}>
        <GrainOverlay />
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: kolmiPaddingX }}>
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
          {profile.photoUrl && (
            <Image
              source={{ uri: profile.photoUrl }}
              style={{
                width: '100%',
                height: 380,
                borderRadius: kolmiRadius.lg,
                backgroundColor: kolmiColors.surfaceSoft,
              }}
            />
          )}

          <View style={{ gap: kolmiSpace.xs }}>
            <Text
              style={{
                fontFamily: kolmiFonts.serif,
                fontSize: 36,
                color: kolmiColors.text,
                letterSpacing: -0.4,
              }}
            >
              {profile.firstName}, {profile.age}
            </Text>
            <Text
              style={{
                fontFamily: kolmiFonts.uiMedium,
                fontSize: 13,
                color: kolmiColors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
              }}
            >
              {profile.dnaLabel} · {profile.city}
            </Text>
          </View>

          <View
            style={{
              borderWidth: 1,
              borderColor: kolmiColors.accent + '40',
              backgroundColor: kolmiColors.bgDeep,
              borderRadius: kolmiRadius.lg,
              padding: kolmiSpace.md,
              gap: 6,
            }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 11,
                color: kolmiColors.accent,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
              }}
            >
              Compatibilité {profile.compatibility}%
            </Text>
            <Text
              style={{
                fontFamily: kolmiFonts.serifItalic,
                fontSize: 16,
                color: kolmiColors.text,
                lineHeight: 23,
              }}
            >
              « {profile.reason} »
            </Text>
          </View>

          <View style={{ gap: kolmiSpace.sm, marginTop: kolmiSpace.sm }}>
            <TouchableOpacity
              onPress={() => router.push(`/meeting/request/${profile.id}`)}
              activeOpacity={0.85}
              style={{
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
                Demander une rencontre
              </Text>
            </TouchableOpacity>

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
                Pas pour moi
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
