import React from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { kolmiColors, kolmiFonts, kolmiRadius } from '@/constants/kolmiTheme'
import type { SelectedProfile } from '@/data/mockSelectedProfiles'

type Props = {
  profile: SelectedProfile
  onPress: () => void
}

export default function SelectedProfileCard({ profile, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: '#FAF8F5',
        borderRadius: kolmiRadius.lg,
        borderWidth: 1,
        borderColor: kolmiColors.outline,
        overflow: 'hidden',
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {profile.photoUrl ? (
        <Image
          source={{ uri: profile.photoUrl }}
          style={{ width: '100%', height: 240, backgroundColor: kolmiColors.surfaceSoft }}
        />
      ) : (
        <View style={{ height: 240, backgroundColor: kolmiColors.surfaceSoft }} />
      )}

      <View style={{ padding: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Text
            style={{
              fontFamily: kolmiFonts.serif,
              fontSize: 24,
              color: kolmiColors.text,
              letterSpacing: -0.3,
            }}
          >
            {profile.firstName}, {profile.age}
          </Text>
          <View
            style={{
              backgroundColor: kolmiColors.accent,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 12,
                color: kolmiColors.white,
                letterSpacing: 0.4,
              }}
            >
              {profile.compatibility}%
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontFamily: kolmiFonts.uiMedium,
            fontSize: 12,
            color: kolmiColors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {profile.dnaLabel} · {profile.city}
        </Text>

        <Text
          style={{
            fontFamily: kolmiFonts.serifItalic,
            fontSize: 14,
            color: kolmiColors.text,
            lineHeight: 20,
            marginTop: 4,
          }}
        >
          « {profile.reason} »
        </Text>
      </View>
    </Pressable>
  )
}
