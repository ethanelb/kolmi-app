import React, { useEffect, useRef, useState } from 'react'
import {
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { kolmiQuestions, bonusDnaQuestions } from '@/data/kolmiQuestions'
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
  kolmiPaddingX,
  kolmiRadius,
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

type Phase = 'main' | 'bonus_offer' | 'bonus'

const TYPING_MS = 700

export default function MatchmakerChat() {
  const router = useRouter()
  const scrollRef = useRef<ScrollView | null>(null)
  const [phase, setPhase] = useState<Phase | null>(null)
  const [questionIndex, setQuestionIndex] = useState<number>(0)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [answers, setAnswers] = useState<KolmiAnswer[]>([])
  const [locked, setLocked] = useState(false)

  const activeQuestions =
    phase === 'bonus' ? bonusDnaQuestions : kolmiQuestions
  const currentQuestion =
    phase === 'main' || phase === 'bonus' ? activeQuestions[questionIndex] : undefined

  // Resume from saved answers if user re-enters mid-flow.
  useEffect(() => {
    let cancelled = false
    getKolmiAnswers().then((saved) => {
      if (cancelled) return
      const mainSaved = saved.filter((a) =>
        kolmiQuestions.some((q) => q.id === a.questionId),
      )
      const bonusSaved = saved.filter((a) =>
        bonusDnaQuestions.some((q) => q.id === a.questionId),
      )

      if (
        mainSaved.length >= kolmiQuestions.length &&
        bonusSaved.length >= bonusDnaQuestions.length
      ) {
        router.replace('/matchmaker/result')
        return
      }

      setAnswers([...mainSaved, ...bonusSaved])

      if (mainSaved.length >= kolmiQuestions.length && bonusSaved.length > 0) {
        // Bonus run already started — resume.
        setMessages([
          {
            id: 'resume',
            role: 'system',
            text: 'On reprend où vous en étiez.',
          },
        ])
        setPhase('bonus')
        setQuestionIndex(bonusSaved.length)
        return
      }

      if (mainSaved.length >= kolmiQuestions.length) {
        // Main done, bonus not yet attempted — show the offer.
        setPhase('bonus_offer')
        return
      }

      if (mainSaved.length > 0) {
        setMessages([
          {
            id: 'resume',
            role: 'system',
            text: 'On reprend où vous en étiez.',
          },
        ])
      }
      setPhase('main')
      setQuestionIndex(mainSaved.length)
    })
    return () => {
      cancelled = true
    }
  }, [router])

  // Guards against duplicate-key warnings: the question messages are
  // appended once per (phase, questionIndex). Without this ref, the effect
  // re-runs when answers.length changes (because answers is part of the
  // capture) and re-pushes the same intro/divider/preface/question.
  const renderedQuestionsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!currentQuestion || questionIndex === null) return
    const cacheKey = `${phase}-${questionIndex}`
    if (renderedQuestionsRef.current.has(cacheKey)) return
    renderedQuestionsRef.current.add(cacheKey)

    const next: ChatMessage[] = []

    if (phase === 'main' && questionIndex === 0 && answers.length === 0) {
      next.push({
        id: 'intro',
        role: 'ai',
        text:
          'Je vais vous poser quelques questions pour découvrir votre Maison relationnelle. Répondez simplement, sans chercher la bonne réponse.',
      })
    }

    const previous = activeQuestions[questionIndex - 1]
    const isNewPhase = !previous || previous.section !== currentQuestion.section
    if (isNewPhase) {
      next.push({
        id: `phase-${currentQuestion.section}-${phase}-${questionIndex}`,
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
  }, [phase, questionIndex, currentQuestion, activeQuestions, answers.length])

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
      // L'utilisateur peut toujours réessayer en relançant le matchmaker.
      // On évite de naviguer vers /matchmaker/result si le DNA n'a pas été
      // persisté — sinon il atterrit sur l'écran "Aucune Maison enregistrée".
    }
  }

  async function handleSelectOption(optionId: string) {
    if (!currentQuestion || phase === 'bonus_offer' || locked) return
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
    await saveKolmiAnswer(answer)

    setIsTyping(true)
    setTimeout(async () => {
      setIsTyping(false)
      if (currentQuestion.outro) {
        setMessages((prev) => [
          ...prev,
          { id: `outro-${currentQuestion.id}`, role: 'ai', text: currentQuestion.outro! },
        ])
      }

      const isLastInPhase = questionIndex >= activeQuestions.length - 1

      if (isLastInPhase && phase === 'main') {
        // Switch into bonus offer instead of finalizing.
        setPhase('bonus_offer')
        setLocked(false)
        return
      }

      if (isLastInPhase && phase === 'bonus') {
        await finalize(finalAnswers)
        return
      }

      setQuestionIndex((prev) => prev + 1)
      setLocked(false)
    }, TYPING_MS)
  }

  function handleAcceptBonus() {
    setMessages((prev) => [
      ...prev,
      {
        id: `bonus-accept-${Date.now()}`,
        role: 'system',
        text: 'On affine votre lecture.',
      },
    ])
    setPhase('bonus')
    setQuestionIndex(0)
  }

  async function handleDeclineBonus() {
    setMessages((prev) => [
      ...prev,
      {
        id: `bonus-decline-${Date.now()}`,
        role: 'system',
        text: 'On finalise votre lecture.',
      },
    ])
    await finalize(answers)
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

          {phase === 'bonus_offer' && !isTyping && (
            <BonusOfferCard
              onAccept={handleAcceptBonus}
              onDecline={handleDeclineBonus}
            />
          )}
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

function BonusOfferCard({
  onAccept,
  onDecline,
}: {
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <SafeAreaView edges={[]} style={{ marginHorizontal: kolmiPaddingX - 20 }}>
      <View
        style={{
          marginTop: kolmiSpace.md,
          padding: kolmiSpace.lg,
          borderRadius: kolmiRadius.lg,
          backgroundColor: '#FAF8F5',
          borderWidth: 1,
          borderColor: 'rgba(139, 26, 26, 0.4)',
          gap: kolmiSpace.sm,
        }}
      >
        <Text
          style={{
            fontFamily: kolmiFonts.uiSemiBold,
            fontSize: 11,
            color: kolmiColors.accent,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          Bonus · Lecture approfondie
        </Text>
        <Text
          style={{
            fontFamily: kolmiFonts.serif,
            fontSize: 22,
            color: '#16130F',
            lineHeight: 28,
            letterSpacing: -0.3,
          }}
        >
          Voulez-vous affiner votre Maison avec 8 questions bonus ?
        </Text>
        <Text
          style={{
            fontFamily: kolmiFonts.ui,
            fontSize: 13,
            color: kolmiColors.textBody,
            lineHeight: 19,
          }}
        >
          Quelques minutes de plus pour préciser votre Maison et nuancer la
          sélection que je vous proposerai.
        </Text>

        <View style={{ gap: kolmiSpace.xs, marginTop: kolmiSpace.sm }}>
          <TouchableOpacity
            onPress={onAccept}
            activeOpacity={0.85}
            style={{
              height: 50,
              borderRadius: kolmiRadius.pill,
              backgroundColor: kolmiColors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 15,
                color: kolmiColors.white,
                letterSpacing: 0.2,
              }}
            >
              Continuer (8 questions)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDecline}
            activeOpacity={0.7}
            style={{
              height: 50,
              borderRadius: kolmiRadius.pill,
              borderWidth: 1,
              borderColor: kolmiColors.outline,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.uiMedium,
                fontSize: 15,
                color: kolmiColors.text,
              }}
            >
              Voir ma Maison maintenant
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}
