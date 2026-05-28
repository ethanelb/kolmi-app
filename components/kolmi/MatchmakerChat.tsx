import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  KeyboardAvoidingView,
  Platform,
  Text,
  StyleSheet,
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
import { safeRead } from '@/lib/kolmi/safeRead'
import { calculateKolmiDna } from '@/lib/kolmi/calculateDna'
import type { KolmiAnswer } from '@/lib/kolmi/types'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import GrainOverlay from './GrainOverlay'
import TypingIndicator from './TypingIndicator'
import AnswerOptions from './AnswerOptions'
import ChapterProgress from './ChapterProgress'

// Indique au composant ChatBubble la nature éditoriale du message AI :
// Une seule question à l'écran à la fois (le state `messages` n'est plus
// rendu — il reste là pour la logique de typing/finalize même si on
// pourrait le retirer entièrement plus tard).
type ChatMessage =
  | { id: string; role: 'ai'; text: string; kind: 'preface' | 'question' | 'outro' }
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'system'; text: string }

// Délai de typing dynamique : on calque le rythme sur la longueur de la
// prochaine bulle pour que les questions courtes ne semblent pas anormalement
// lentes et que les longues aient le temps respiratoire qu'elles méritent.
// Plage 320-650 ms, 400 ms par défaut. Avant : 700 ms fixe — soit ~2,4 s
// d'attente cumulée gagnée sur le test complet.
function typingDurationFor(nextText: string | undefined, hasOutro: boolean): number {
  // Si une outro va aussi s'afficher avant la prochaine question, on reste
  // sur le bas de la fourchette pour ne pas empiler deux silences.
  if (hasOutro) return 320
  if (!nextText) return 380
  const len = nextText.length
  if (len < 60) return 340
  if (len < 110) return 420
  return 560
}

// Indices "à partir de" lesquels une frontière de phase commence —
// dérivés une fois pour la barre de progression segmentée.
const PHASE_BREAKS = (() => {
  const breaks: number[] = []
  for (let i = 1; i < kolmiQuestions.length; i++) {
    if (kolmiQuestions[i].section !== kolmiQuestions[i - 1].section) {
      breaks.push(i)
    }
  }
  return breaks
})()

const PHASE_LABEL: Record<string, string> = {
  intensity: 'Intensité',
  rhythm: 'Rythme',
  openness: 'Ouverture',
}

export default function MatchmakerChat() {
  const router = useRouter()
  const [questionIndex, setQuestionIndex] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [answers, setAnswers] = useState<KolmiAnswer[]>([])
  const [locked, setLocked] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)

  const currentQuestion =
    questionIndex !== null ? kolmiQuestions[questionIndex] : undefined

  const total = kolmiQuestions.length
  // Pour l'affichage "01/08" : on indique la question en cours (1-based).
  // Si on a fini, on saute au total.
  const displayIndex = useMemo(() => {
    if (questionIndex === null) return 1
    return Math.min(questionIndex + 1, total)
  }, [questionIndex, total])

  const phaseLabel = currentQuestion
    ? PHASE_LABEL[currentQuestion.section] ?? currentQuestion.section
    : ''

  // Resume from saved answers if user re-enters mid-flow. `safeRead` garantit
  // qu'un AsyncStorage défaillant ne laisse pas l'écran figé sur un état
  // d'init silencieux.
  useEffect(() => {
    let cancelled = false
    safeRead(() => getKolmiAnswers(), [] as KolmiAnswer[]).then((saved) => {
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
            role: 'ai',
            kind: 'preface',
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

  // Garde contre la duplication : un questionIndex donné ne pousse ses
  // messages (divider + préface + question) qu'une seule fois.
  const renderedQuestionsRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (!currentQuestion || questionIndex === null) return
    if (renderedQuestionsRef.current.has(questionIndex)) return
    renderedQuestionsRef.current.add(questionIndex)

    const next: ChatMessage[] = []

    // Préface AVANT le divider de phase : la voix du matchmaker pose le
    // contexte d'abord, puis le marqueur "I · INTENSITÉ" annonce le
    // chapitre. L'inverse donnait l'impression d'un sommaire technique
    // qui s'imposait avant la première parole.
    if (currentQuestion.preface) {
      next.push({
        id: `preface-${currentQuestion.id}`,
        role: 'ai',
        kind: 'preface',
        text: currentQuestion.preface,
      })
    }

    const previous = kolmiQuestions[questionIndex - 1]
    const isNewPhase = !previous || previous.section !== currentQuestion.section
    if (isNewPhase) {
      next.push({
        id: `phase-${currentQuestion.section}-${questionIndex}`,
        role: 'system',
        text: currentQuestion.phaseTitle,
      })
    }

    next.push({
      id: `question-${currentQuestion.id}`,
      role: 'ai',
      kind: 'question',
      text: currentQuestion.text,
    })

    setMessages((prev) => [...prev, ...next])
  }, [questionIndex, currentQuestion])

  // Le scroll se déclenche désormais via `onContentSizeChange` du ScrollView
  // (cf. plus bas) — déclenchement garanti après layout, plus de race avec
  // la mesure des bulles.

  async function finalize(allAnswers: KolmiAnswer[]) {
    setIsFinalizing(true)
    // Petite respiration éditoriale avant le replace : on laisse l'outro
    // s'inscrire visuellement, puis on affiche un statut italique pour que
    // le silence pendant les writes AsyncStorage ne soit pas perçu comme
    // un freeze. ~520 ms total — assez pour être lu, assez court pour ne
    // pas frustrer.
    setMessages((prev) => [
      ...prev,
      {
        id: 'finalize-status',
        role: 'ai',
        kind: 'preface',
        text: 'Lecture des résultats…',
      },
    ])
    const startedAt = Date.now()
    const result = calculateKolmiDna(allAnswers)
    try {
      await saveKolmiDnaResult(result)
      await saveKolmiProgress({ hasCompletedMatchmaker: true })
    } catch (err) {
      console.warn('[kolmi] finalize failed', err)
      setIsFinalizing(false)
      return
    }
    // Dwell minimum pour que la phrase de statut soit perçue comme un acte
    // de lecture, pas comme un freeze. Si la persistance a déjà pris ce
    // temps (devices lents), on navigue immédiatement.
    const wait = Math.max(0, 520 - (Date.now() - startedAt))
    setTimeout(() => router.replace('/matchmaker/result'), wait)
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

    const nextQuestion = kolmiQuestions[questionIndex + 1]
    const typingMs = typingDurationFor(nextQuestion?.text, !!currentQuestion.outro)

    setTimeout(() => {
      setIsTyping(false)
      if (currentQuestion.outro) {
        setMessages((prev) => [
          ...prev,
          {
            id: `outro-${currentQuestion.id}`,
            role: 'ai',
            kind: 'outro',
            text: currentQuestion.outro!,
          },
        ])
      }

      const isLast = questionIndex >= kolmiQuestions.length - 1
      if (isLast) {
        finalize(finalAnswers)
        return
      }

      setQuestionIndex((prev) => (prev ?? 0) + 1)
      setLocked(false)
    }, typingMs)
  }

  return (
    <View style={{ flex: 1, backgroundColor: kolmiColors.bg }}>
      <GrainOverlay />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header sticky compact : compteur 01/08, label de phase, barre. */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.counter}>
              {String(displayIndex).padStart(2, '0')}
              <Text style={styles.counterMuted}>/{String(total).padStart(2, '0')}</Text>
            </Text>
            <View style={styles.headerCenter}>
              <Text style={styles.kicker}>Correspondance</Text>
            </View>
            <Text style={[styles.counter, styles.phasePill]}>{phaseLabel}</Text>
          </View>
          <View style={styles.progressWrap}>
            <ChapterProgress
              total={total}
              current={questionIndex ?? 0}
              phaseBreaks={PHASE_BREAKS}
            />
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Une seule question à la fois, top-left. Pas d'historique
              visible — quand l'utilisateur répond, la question est
              remplacée par la suivante (avec un court typing entre les
              deux). Préface / outro / divider de phase sont retirés du
              rendu pour garder l'écran focus. */}
          <View style={styles.questionStage}>
            {isTyping ? (
              <TypingIndicator />
            ) : currentQuestion ? (
              <Text style={styles.questionText}>{currentQuestion.text}</Text>
            ) : isFinalizing ? (
              <Text style={styles.finalizingText}>Lecture des résultats…</Text>
            ) : null}
          </View>

          {/* Pavé de réponses : reste monté pendant le typing pour éviter le
              démontage brutal après tap. Désactivé tant que la prochaine
              question n'est pas servie. Démonté seulement à la finalisation
              (la dernière question est répondue, on est en transition). */}
          {currentQuestion && !isFinalizing && (
            <AnswerOptions
              options={currentQuestion.options}
              onSelect={handleSelectOption}
              disabled={locked || isTyping}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.xs,
    paddingBottom: kolmiSpace.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  counter: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 12,
    color: kolmiColors.text,
    letterSpacing: 1.6,
    minWidth: 72,
  },
  counterMuted: {
    color: kolmiColors.textMuted,
    fontFamily: kolmiFonts.uiMedium,
  },
  kicker: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 9.5,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: kolmiColors.textMuted,
  },
  phasePill: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 13,
    color: kolmiColors.accent,
    letterSpacing: 0.2,
    minWidth: 72,
    textAlign: 'right',
  },
  progressWrap: {
    paddingHorizontal: 2,
  },
  scrollContent: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.lg,
    paddingBottom: kolmiSpace.xl,
  },
  questionStage: {
    flex: 1,
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.lg,
    // Top-left : la question s'aligne en haut, sans centrage vertical.
    // Quand il n'y a que le TypingIndicator, on garde le même padding
    // pour éviter un déplacement vertical au switch typing → question.
    alignItems: 'flex-start',
  },
  questionText: {
    fontFamily: kolmiFonts.serif,
    fontSize: 30,
    lineHeight: 38,
    color: kolmiColors.text,
    letterSpacing: -0.4,
    textAlign: 'left',
  },
  finalizingText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 17,
    color: kolmiColors.textBody,
  },
})
