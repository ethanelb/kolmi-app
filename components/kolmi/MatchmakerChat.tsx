import React, { useEffect, useRef, useState } from 'react'
import {
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { kolmiQuestions } from '@/data/kolmiQuestions'
import {
  getKolmiAnswers,
  saveKolmiAnswer,
  saveKolmiDnaResult,
  saveKolmiProgress,
} from '@/lib/kolmi/storage'
import { calculateKolmiDna } from '@/lib/kolmi/calculateDna'
import type { KolmiAnswer } from '@/lib/kolmi/types'
import {
  kolmiColors,
  kolmiFonts,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import GrainOverlay from './GrainOverlay'
import ChatBubble from './ChatBubble'
import TypingIndicator from './TypingIndicator'
import AnswerOptions from './AnswerOptions'
import PhaseDivider from './PhaseDivider'

type ChatMessage =
  | { id: string; role: 'ai' | 'user'; text: string }
  | { id: string; role: 'system'; text: string }

const TYPING_MS = 700

export default function MatchmakerChat() {
  const router = useRouter()
  const scrollRef = useRef<ScrollView | null>(null)
  const [questionIndex, setQuestionIndex] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [answers, setAnswers] = useState<KolmiAnswer[]>([])
  const [locked, setLocked] = useState(false)

  const currentQuestion =
    questionIndex !== null ? kolmiQuestions[questionIndex] : undefined

  // Resume from saved answers if user re-enters mid-flow. Old-format answers
  // (16-question system) won't match any current id and are silently ignored —
  // the user just restarts the new 8-question flow.
  useEffect(() => {
    let cancelled = false
    getKolmiAnswers().then((saved) => {
      if (cancelled) return
      const validSaved = saved.filter((a) =>
        kolmiQuestions.some((q) => q.id === a.questionId),
      )

      if (validSaved.length >= kolmiQuestions.length) {
        router.replace('/matchmaker/result')
        return
      }

      setAnswers(validSaved)

      if (validSaved.length > 0) {
        setMessages([
          {
            id: 'resume',
            role: 'system',
            text: 'On reprend où vous en étiez.',
          },
        ])
      }
      setQuestionIndex(validSaved.length)
    })
    return () => {
      cancelled = true
    }
  }, [router])

  // Guards against duplicate-key warnings: messages for a given questionIndex
  // are appended once. Without this ref, the effect re-runs when answers
  // changes and re-pushes the intro/divider/preface/question.
  const renderedQuestionsRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (!currentQuestion || questionIndex === null) return
    if (renderedQuestionsRef.current.has(questionIndex)) return
    renderedQuestionsRef.current.add(questionIndex)

    const next: ChatMessage[] = []

    const previous = kolmiQuestions[questionIndex - 1]
    const isNewPhase = !previous || previous.section !== currentQuestion.section
    if (isNewPhase) {
      next.push({
        id: `phase-${currentQuestion.section}-${questionIndex}`,
        role: 'system',
        text: currentQuestion.phaseTitle,
      })
    }

    if (currentQuestion.preface) {
      next.push({
        id: `preface-${currentQuestion.id}`,
        role: 'ai',
        text: currentQuestion.preface,
      })
    }

    next.push({
      id: `question-${currentQuestion.id}`,
      role: 'ai',
      text: currentQuestion.text,
    })

    setMessages((prev) => [...prev, ...next])
  }, [questionIndex, currentQuestion])

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
    return () => clearTimeout(t)
  }, [messages, isTyping])

  async function finalize(allAnswers: KolmiAnswer[]) {
    const result = calculateKolmiDna(allAnswers)
    try {
      await saveKolmiDnaResult(result)
      await saveKolmiProgress({ hasCompletedMatchmaker: true })
      router.replace('/matchmaker/result')
    } catch (err) {
      console.warn('[kolmi] finalize failed', err)
    }
  }

  function handleSelectOption(optionId: string) {
    if (!currentQuestion || locked || questionIndex === null) return
    const option = currentQuestion.options.find((item) => item.id === optionId)
    if (!option) return

    setLocked(true)

    const answer: KolmiAnswer = {
      questionId: currentQuestion.id,
      optionId: option.id,
      value: option.value,
      answeredAt: new Date().toISOString(),
    }

    setMessages((prev) => [
      ...prev,
      { id: `answer-${currentQuestion.id}`, role: 'user', text: option.label },
    ])
    const finalAnswers = [...answers, answer]
    setAnswers(finalAnswers)
    setIsTyping(true)

    saveKolmiAnswer(answer).catch((err) => {
      console.warn('[kolmi] saveKolmiAnswer failed', err)
    })

    setTimeout(() => {
      setIsTyping(false)
      if (currentQuestion.outro) {
        setMessages((prev) => [
          ...prev,
          { id: `outro-${currentQuestion.id}`, role: 'ai', text: currentQuestion.outro! },
        ])
      }

      const isLast = questionIndex >= kolmiQuestions.length - 1
      if (isLast) {
        finalize(finalAnswers)
        return
      }

      setQuestionIndex((prev) => (prev === null ? null : prev + 1))
      setLocked(false)
    }, TYPING_MS)
  }

  return (
    <View style={{ flex: 1, backgroundColor: kolmiColors.bg }}>
      <GrainOverlay />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 20, paddingTop: kolmiSpace.md, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', marginBottom: 24, gap: 4 }}>
            <Text
              style={{
                fontFamily: kolmiFonts.uiMedium,
                fontSize: 10,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: kolmiColors.textMuted,
              }}
            >
              Correspondance privée
            </Text>
            <Text
              style={{
                fontFamily: kolmiFonts.serifItalic,
                fontSize: 16,
                color: kolmiColors.textBody,
                marginTop: 2,
              }}
            >
              avec votre matchmaker
            </Text>
            <View
              style={{
                width: 32,
                height: 0.6,
                backgroundColor: kolmiColors.outline,
                marginTop: 10,
              }}
            />
          </View>
          {messages.map((m) =>
            m.role === 'system' ? (
              <PhaseDivider key={m.id} text={m.text} />
            ) : (
              <ChatBubble key={m.id} role={m.role} text={m.text} />
            )
          )}
          {isTyping && <TypingIndicator />}
        </ScrollView>

        {currentQuestion && !isTyping && (
          <AnswerOptions
            options={currentQuestion.options}
            onSelect={handleSelectOption}
            disabled={locked}
          />
        )}
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}
