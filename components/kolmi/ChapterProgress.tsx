import React from 'react'
import { View } from 'react-native'
import { kolmiColors } from '@/constants/kolmiTheme'

type Props = {
  total: number
  current: number // 0-based index of the question in progress
  // Indices "à partir de" lesquels un gap élargi marque une frontière de
  // phase. Pour 8 questions split 3/3/2 → [3, 6].
  phaseBreaks?: number[]
}

// Règle de progression segmentée. Chaque tick = une question. Les gaps
// élargis matérialisent les frontières de phase pour donner du rythme
// editorial à la barre. Trois états par tick :
//   • answered    → bordeaux plein
//   • in progress → bordeaux semi-transparent
//   • todo        → outline 8% noir
function ChapterProgress({ total, current, phaseBreaks = [] }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 3 }}>
      {Array.from({ length: total }, (_, i) => {
        const fill =
          i < current
            ? kolmiColors.accent
            : i === current
              ? 'rgba(139,26,26,0.42)'
              : 'rgba(26,26,26,0.10)'
        return (
          <React.Fragment key={i}>
            <View
              style={{
                flex: 1,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: fill,
              }}
            />
            {i < total - 1 && (
              <View style={{ width: phaseBreaks.includes(i + 1) ? 12 : 4 }} />
            )}
          </React.Fragment>
        )
      })}
    </View>
  )
}

export default React.memo(ChapterProgress)
