import React, { useEffect, useRef, useState } from 'react'
import { Text, View, AccessibilityInfo, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedReaction,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { kolmiColors, kolmiFonts } from '@/constants/kolmiTheme'
import type { MessageTone } from '@/lib/kolmi/conversationEngine'

type Props = {
  text: string
  tone: MessageTone
  // Si true, anime un type-in. Sinon, render immédiat (utilisé pour
  // les messages déjà persistés / réouverture de l'app).
  isFresh?: boolean
  // Callback quand le typing est terminé (ou immédiat si !isFresh).
  onComplete?: () => void
}

const CHAR_DURATION = 26 // ms / char
const MAX_DURATION = 1600 // ms total cap
const MIN_DURATION = 320 // ms total floor (pour les messages très courts)

// Bulle italique du matchmaker. Quand isFresh=true, on tape le texte
// caractère par caractère via un sharedValue progress 0→1 + une
// useAnimatedReaction qui pousse sur le state JS uniquement quand le
// nombre d'index change (évite les setState par frame).
//
// Reduce Motion : si l'OS est en mode réduit, on skip l'animation —
// le texte apparaît immédiatement, onComplete est appelé en next tick.
function MatchmakerMessage({
  text,
  tone,
  isFresh = false,
  onComplete,
}: Props) {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null)
  const [charCount, setCharCount] = useState(isFresh ? 0 : text.length)
  const [done, setDone] = useState(!isFresh)
  const progress = useSharedValue(isFresh ? 0 : 1)
  // refs pour ne pas re-fire onComplete en cas de re-render
  const completedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (!cancelled) setReduceMotion(v)
      })
      .catch(() => {
        if (!cancelled) setReduceMotion(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Lance le typing une fois reduceMotion connu.
  useEffect(() => {
    if (!isFresh) return
    if (reduceMotion === null) return // pas encore prêt
    if (reduceMotion) {
      // Skip animation
      setCharCount(text.length)
      setDone(true)
      if (!completedRef.current) {
        completedRef.current = true
        onComplete?.()
      }
      return
    }
    const duration = Math.max(
      MIN_DURATION,
      Math.min(MAX_DURATION, text.length * CHAR_DURATION),
    )
    progress.value = withTiming(
      1,
      { duration, easing: Easing.linear },
      (finished) => {
        'worklet'
        if (finished) {
          runOnJS(handleComplete)()
        }
      },
    )
    return () => {
      // si le composant unmount, on ne reset pas progress (la valeur
      // reste là où elle est, sans onComplete car runOnJS ne fire que
      // si finished est true).
    }
  }, [isFresh, reduceMotion, text, progress, onComplete])

  function handleComplete() {
    if (completedRef.current) return
    completedRef.current = true
    setCharCount(text.length)
    setDone(true)
    onComplete?.()
  }

  // Pousse charCount uniquement quand l'index change pour éviter un
  // setState par frame (60fps).
  useAnimatedReaction(
    () => Math.floor(progress.value * text.length),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setCharCount)(current)
      }
    },
    [text.length],
  )

  const displayText = isFresh ? text.slice(0, charCount) : text

  return (
    <View style={[styles.bubble, toneStyles(tone)]}>
      <Text style={[styles.text, toneTextStyle(tone)]}>
        {displayText}
        {/* curseur "blinking" léger pendant le typing — un point
            bordeaux qu'on cache une fois terminé. */}
        {isFresh && !done ? <Text style={styles.cursor}>·</Text> : null}
      </Text>
      {/* Petit ornement de fin — apparaît une fois le message complet,
          en bas à droite, signal visuel "fin de phrase". */}
      {done && tone !== 'closing' && (
        <View style={styles.endOrnament}>
          <View style={styles.endDot} />
        </View>
      )}
    </View>
  )
}

function toneStyles(tone: MessageTone) {
  switch (tone) {
    case 'closing':
      return styles.bubbleClosing
    case 'reaction':
      return styles.bubbleReaction
    case 'opening':
    case 'intro':
    case 'context':
    default:
      return null
  }
}

function toneTextStyle(tone: MessageTone) {
  switch (tone) {
    case 'closing':
      return styles.textClosing
    case 'reaction':
      return styles.textReaction
    case 'opening':
      return styles.textOpening
    case 'intro':
    case 'context':
    default:
      return styles.textDefault
  }
}

const styles = StyleSheet.create({
  bubble: {
    marginVertical: 14,
    paddingRight: 28,
  },
  bubbleReaction: {
    marginVertical: 10,
    paddingRight: 28,
    opacity: 0.85,
  },
  bubbleClosing: {
    marginTop: 28,
    marginBottom: 10,
    paddingRight: 28,
  },
  text: {
    fontFamily: kolmiFonts.serifItalic,
    letterSpacing: -0.2,
    color: kolmiColors.text,
  },
  textOpening: {
    fontSize: 24,
    lineHeight: 32,
    color: kolmiColors.text,
  },
  textDefault: {
    fontSize: 22,
    lineHeight: 30,
    color: kolmiColors.textBody,
  },
  textReaction: {
    fontSize: 18,
    lineHeight: 25,
    color: kolmiColors.textMuted,
  },
  textClosing: {
    fontSize: 20,
    lineHeight: 28,
    color: kolmiColors.textBody,
  },
  cursor: {
    fontFamily: kolmiFonts.serif,
    color: kolmiColors.accent,
    fontSize: 18,
  },
  endOrnament: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  endDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(139,26,26,0.55)',
  },
})

export default React.memo(MatchmakerMessage)
