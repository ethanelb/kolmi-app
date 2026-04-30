import React, { useEffect } from 'react'
import { Text, View, type ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { kolmiColors, kolmiFonts, kolmiRadius } from '@/constants/kolmiTheme'
import KolmiWordmark from '@/components/kolmi/KolmiWordmark'

type Props = {
  height: number
  initial?: string
  borderRadius?: number
  style?: ViewStyle
  // Optional identifier surfaced in console.error when the placeholder has
  // no usable initial — signals that the profile data is incomplete.
  profileId?: string
}

export default function ProfilePhotoPlaceholder({
  height,
  initial,
  borderRadius = 0,
  style,
  profileId,
}: Props) {
  const letter = (initial ?? '').trim().charAt(0).toUpperCase()

  useEffect(() => {
    if (!letter) {
      console.error(
        `[ProfilePhotoPlaceholder] No usable initial for profile${
          profileId ? ` "${profileId}"` : ''
        } — falling back to wordmark. Check that firstName is populated.`
      )
    }
  }, [letter, profileId])

  return (
    <View
      style={[
        {
          width: '100%',
          height,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: kolmiColors.surfaceSoft,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['#EFEAE0', '#E8E2D6', '#DCD2BE']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        {letter ? (
          <View
            style={{
              width: Math.min(height * 0.42, 132),
              height: Math.min(height * 0.42, 132),
              borderRadius: kolmiRadius.pill,
              borderWidth: 1,
              borderColor: 'rgba(139,26,26,0.25)',
              backgroundColor: 'rgba(250,248,245,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.serif,
                fontSize: Math.min(height * 0.22, 64),
                color: kolmiColors.accent,
                letterSpacing: -0.5,
                includeFontPadding: false,
                textAlign: 'center',
              }}
            >
              {letter}
            </Text>
          </View>
        ) : (
          <KolmiWordmark size={Math.min(height * 0.18, 52)} color={kolmiColors.accent} />
        )}
      </LinearGradient>
    </View>
  )
}
