import React from 'react'
import { View } from 'react-native'
import { kolmiColors } from '@/constants/kolmiTheme'
import MatchmakerChat from '@/components/kolmi/MatchmakerChat'

export default function MatchmakerScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: kolmiColors.bg }}>
      <MatchmakerChat />
    </View>
  )
}
