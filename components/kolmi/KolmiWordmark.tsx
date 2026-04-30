import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { kolmiColors, kolmiFonts } from '@/constants/kolmiTheme'

interface Props {
  size?: number
  color?: string
}

export default function KolmiWordmark({ size = 52, color = kolmiColors.text }: Props) {
  return (
    <Text
      style={[
        styles.wordmark,
        {
          fontSize: size,
          color,
          lineHeight: size * 1.7,
          paddingTop: size * 0.45,
          paddingBottom: size * 0.15,
        },
      ]}
    >
      kolmi
    </Text>
  )
}

const styles = StyleSheet.create({
  wordmark: {
    fontFamily: kolmiFonts.wordmark,
    letterSpacing: -0.5,
    textAlign: 'center',
    includeFontPadding: false,
  },
})
