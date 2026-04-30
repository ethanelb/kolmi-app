import React from 'react'
import { Text, View } from 'react-native'
import { kolmiColors, kolmiFonts } from '@/constants/kolmiTheme'

type Props = {
  count: number
}

export default function MatchmakerGreeting({ count }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: '#E2CBA8',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: 'Georgia', fontSize: 16, color: '#16130F' }}>A</Text>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Text
          style={{
            fontFamily: kolmiFonts.uiSemiBold,
            fontSize: 13,
            color: kolmiColors.textSecondary,
            letterSpacing: 0.3,
          }}
        >
          Votre matchmaker
        </Text>
        <Text
          style={{
            fontFamily: kolmiFonts.serif,
            fontSize: 22,
            color: kolmiColors.text,
            lineHeight: 28,
            letterSpacing: -0.3,
          }}
        >
          {`Votre matchmaker a sélectionné ${count} ${count > 1 ? 'profils' : 'profil'} pour vous.`}
        </Text>
        <Text
          style={{
            fontFamily: kolmiFonts.ui,
            fontSize: 14,
            color: kolmiColors.textBody,
            lineHeight: 21,
          }}
        >
          Chaque profil a été choisi pour une compatibilité précise avec votre Maison.
        </Text>
      </View>
    </View>
  )
}
