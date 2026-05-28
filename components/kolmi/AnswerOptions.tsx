import React from 'react'
import { Pressable, Text, View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { kolmiColors, kolmiFonts } from '@/constants/kolmiTheme'
import type { QuestionOption } from '@/data/kolmiQuestions'

type Props = {
  options: QuestionOption[]
  onSelect: (optionId: string) => void
  disabled?: boolean
}

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi']

// Liste de réponses en bas d'écran. Pas de scroll : 4 options tiennent
// toujours dans la maquette, le scroll créait de la confusion d'affordance.
// Chaque ligne : numéro romain bordeaux + label italique + trait d'encre
// qui se trace de gauche à droite quand on confirme la sélection (220 ms).
function AnswerOptions({ options, onSelect, disabled }: Props) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.divider} />
      <View style={styles.list}>
        {options.map((option, idx) => (
          <AnswerRow
            key={option.id}
            roman={ROMAN[idx] ?? String(idx + 1)}
            label={option.label}
            disabled={disabled}
            onPress={() => onSelect(option.id)}
          />
        ))}
      </View>
    </SafeAreaView>
  )
}

type RowProps = {
  roman: string
  label: string
  disabled?: boolean
  onPress: () => void
}

function AnswerRow({ roman, label, disabled, onPress }: RowProps) {
  // Trace d'encre bordeaux : largeur animée 0 → 100% au tap, suivie d'un
  // léger fade pendant que le parent prépare la transition vers la
  // question suivante. La "confirmation" est la trace elle-même.
  const trace = useSharedValue(0)
  const opacity = useSharedValue(1)

  const traceStyle = useAnimatedStyle(() => ({
    width: `${trace.value * 100}%`,
  }))

  const rowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  function handlePress() {
    if (disabled) return
    // Trace bordeaux qui se dessine sous la ligne. On notifie le parent
    // quand l'animation est terminée pour qu'il ne remplace pas les
    // options pendant le tracé (sinon le composant s'unmount et le trait
    // est coupé visuellement).
    trace.value = withTiming(
      1,
      { duration: 220, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onPress)()
      },
    )
    opacity.value = withTiming(0.55, { duration: 220 })
  }

  return (
    <Animated.View style={[styles.rowWrap, rowStyle]}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.row,
          pressed && !disabled && styles.rowPressed,
          disabled && styles.rowDisabled,
        ]}
      >
        <Text style={styles.roman}>{roman}.</Text>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      <View style={styles.hairline}>
        <Animated.View style={[styles.trace, traceStyle]} />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  safe: { backgroundColor: 'transparent' },
  divider: {
    height: 0.6,
    backgroundColor: 'rgba(26,26,26,0.18)',
    marginHorizontal: 24,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 6,
  },
  rowWrap: {
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 14,
    paddingHorizontal: 2,
    gap: 14,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  roman: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 13,
    color: kolmiColors.accent,
    width: 22,
    letterSpacing: 0.4,
  },
  label: {
    flex: 1,
    fontFamily: kolmiFonts.serif,
    fontSize: 19,
    lineHeight: 24,
    color: kolmiColors.text,
    letterSpacing: -0.3,
  },
  hairline: {
    height: 0.6,
    backgroundColor: 'rgba(26,26,26,0.12)',
    marginLeft: 36, // aligné après le numéro romain
    overflow: 'hidden',
  },
  trace: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: kolmiColors.accent,
    height: 0.9,
  },
})

export default React.memo(AnswerOptions)
