import React from 'react'
import { Text, View } from 'react-native'
import { kolmiColors, kolmiFonts } from '@/constants/kolmiTheme'

type Props = {
  text: string
}

const ROMAN_BY_INDEX = ['I', 'II', 'III', 'IV', 'V', 'VI']

// Parse "Phase N — Title" → { roman, title }. Tolerant fallback.
function parsePhase(raw: string): { roman: string; title: string } {
  const match = raw.match(/^Phase\s+(\d+)\s*[—-]\s*(.+)$/i)
  if (match) {
    const n = parseInt(match[1], 10)
    return { roman: ROMAN_BY_INDEX[n - 1] ?? String(n), title: match[2].trim() }
  }
  return { roman: '·', title: raw }
}

// Marqueur de chapitre composé sur une seule ligne :
//   ── I ──   INTENSITÉ
// Hairline 0.6 + romain bordeaux + petit-titre tracking large.
// Rythme aéré au-dessus/dessous (40 / 28 px) pour faire respirer la page.
function PhaseDivider({ text }: Props) {
  const { roman, title } = parsePhase(text)
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 40,
        marginBottom: 28,
      }}
    >
      <View style={{ width: 28, height: 0.6, backgroundColor: kolmiColors.accent }} />
      <Text
        style={{
          fontFamily: kolmiFonts.serifItalic,
          fontSize: 22,
          color: kolmiColors.accent,
          lineHeight: 24,
          letterSpacing: 0.5,
        }}
      >
        {roman}
      </Text>
      <View style={{ flex: 1, height: 0.6, backgroundColor: 'rgba(26,26,26,0.18)' }} />
      <Text
        style={{
          fontFamily: kolmiFonts.uiMedium,
          fontSize: 10,
          letterSpacing: 2.6,
          textTransform: 'uppercase',
          color: kolmiColors.textBody,
        }}
      >
        {title}
      </Text>
    </View>
  )
}

export default React.memo(PhaseDivider)
