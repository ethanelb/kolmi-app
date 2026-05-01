import React from 'react'
import { Pressable, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { kolmiFonts } from '@/constants/kolmiTheme'
import type { QuestionOption } from '@/data/kolmiQuestions'

type Props = {
  options: QuestionOption[]
  onSelect: (optionId: string) => void
  disabled?: boolean
}

// Each option = a small paper slip with a sepia rule above and below.
// Tapping it returns the slip across the page (echoes UserSlip).
function AnswerOptions({ options, onSelect, disabled }: Props) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {options.map((option, idx) => (
          <Pressable
            key={option.id}
            onPress={() => !disabled && onSelect(option.id)}
            // Style fonctionnel pour gérer l'état pressed sans recréer
            // d'objet entier — top border conditionnel sur le 1er item,
            // opacité conditionnelle si disabled.
            style={({ pressed }) => [
              styles.option,
              idx === 0 && styles.firstOption,
              pressed && styles.optionPressed,
              disabled && styles.optionDisabled,
            ]}
          >
            <Text style={styles.label}>{option.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { backgroundColor: 'transparent' },
  scroll: { maxHeight: 380 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  option: {
    borderTopWidth: 0,
    borderBottomWidth: 0.6,
    borderColor: 'rgba(58,40,20,0.22)',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  firstOption: { borderTopWidth: 0.6 },
  optionPressed: { backgroundColor: '#EDE3CB' },
  optionDisabled: { opacity: 0.45 },
  label: {
    color: '#16130F',
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
})

export default React.memo(AnswerOptions)
