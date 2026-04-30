import React from 'react'
import { Text, View } from 'react-native'
import { kolmiColors, kolmiFonts } from '@/constants/kolmiTheme'

type Props = {
  text: string
}

const ROMAN_BY_INDEX = ['I', 'II', 'III', 'IV', 'V', 'VI']

// Parses "Phase N — Title" into roman numeral + clean title.
// Falls back to the raw text if it doesn't match the pattern.
function parsePhase(raw: string): { roman: string; title: string } {
  const match = raw.match(/^Phase\s+(\d+)\s*[—-]\s*(.+)$/i)
  if (match) {
    const n = parseInt(match[1], 10)
    return { roman: ROMAN_BY_INDEX[n - 1] ?? String(n), title: match[2].trim() }
  }
  return { roman: '✦', title: raw }
}

// Chapter-break phase divider — roman numeral, ornament, small-caps title.
// Replaces the generic outline divider with editorial book-page typography.
export default function PhaseDivider({ text }: Props) {
  const { roman, title } = parsePhase(text)
  return (
    <View style={{ alignItems: 'center', marginVertical: 36, gap: 8 }}>
      <Text
        style={{
          fontFamily: kolmiFonts.serif,
          fontSize: 32,
          color: kolmiColors.text,
          lineHeight: 40,
          letterSpacing: 1,
        }}
      >
        {roman}
      </Text>
      <Text
        style={{
          fontFamily: kolmiFonts.serif,
          fontSize: 14,
          color: kolmiColors.accent,
          letterSpacing: 4,
        }}
      >
        ·   ·   ·
      </Text>
      <Text
        style={{
          fontFamily: kolmiFonts.uiMedium,
          fontSize: 11,
          letterSpacing: 2.4,
          textTransform: 'uppercase',
          color: kolmiColors.textBody,
          marginTop: 2,
        }}
      >
        {title}
      </Text>
    </View>
  )
}
