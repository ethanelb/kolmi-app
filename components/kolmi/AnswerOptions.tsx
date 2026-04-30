import React from 'react'
import { Pressable, Text, ScrollView } from 'react-native'
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
export default function AnswerOptions({ options, onSelect, disabled }: Props) {
  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: 'transparent' }}>
      <ScrollView
        style={{ maxHeight: 380 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
          gap: 0,
        }}
        showsVerticalScrollIndicator={false}
      >
        {options.map((option, idx) => (
          <Pressable
            key={option.id}
            onPress={() => !disabled && onSelect(option.id)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#EDE3CB' : 'transparent',
              borderTopWidth: idx === 0 ? 0.6 : 0,
              borderBottomWidth: 0.6,
              borderColor: 'rgba(58,40,20,0.22)',
              paddingVertical: 16,
              paddingHorizontal: 4,
              opacity: disabled ? 0.45 : 1,
            })}
          >
            <Text
              style={{
                color: '#16130F',
                fontFamily: kolmiFonts.serifItalic,
                fontSize: 18,
                lineHeight: 24,
                letterSpacing: -0.2,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
