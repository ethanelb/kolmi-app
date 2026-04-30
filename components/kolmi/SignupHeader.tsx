import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { kolmiColors, kolmiSpace, kolmiRadius } from '@/constants/kolmiTheme'

interface Props {
  step: number
  total: number
  onBack: () => void
}

export default function SignupHeader({ step, total, onBack }: Props) {
  const progress = Math.min(1, Math.max(0, step / total))

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={onBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.6}
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
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: kolmiSpace.lg,
    paddingTop: kolmiSpace.sm,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: kolmiSpace.xs,
    paddingHorizontal: kolmiSpace.xs,
    marginLeft: -kolmiSpace.xs,
    marginBottom: kolmiSpace.sm,
  },
  track: {
    height: 4,
    backgroundColor: kolmiColors.surfaceSoft,
    borderRadius: kolmiRadius.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: kolmiColors.accent,
    borderRadius: kolmiRadius.sm,
  },
})
