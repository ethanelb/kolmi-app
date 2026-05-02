import React, { useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Animated, {
  interpolateColor,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  type SharedValue,
} from 'react-native-reanimated'
import {
  kolmiColors,
  kolmiSpace,
  kolmiRadius,
  kolmiFonts,
  kolmiPaddingX,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import KolmiWordmark from '@/components/kolmi/KolmiWordmark'
import { tapMedium, success } from '@/lib/kolmi/haptics'
import { saveKolmiProgress, getTokens, setTokens } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'

// Manifeste : trois phrases courtes qui se succèdent en crossfade.
// Pas de "petit guide d'usage" — le ton est tranchant, anti-small talk,
// et l'animation porte la communication plus que le texte.
const MANIFESTO = [
  'Pas de swipe.',
  'Pas de small talk.',
  'Juste des rencontres choisies.',
] as const

// Timing par phrase (ms). À chaque slot, la phrase fade-in, son trait
// bordeaux se trace dessous, elle "respire" un instant, puis fade-out
// pendant que la suivante prend sa place.
const SLOT_MS = 1400

export default function ReadyScreen() {
  const router = useRouter()

  // Une SharedValue d'opacité + une de "trace" par phrase.
  const op0 = useSharedValue(0)
  const op1 = useSharedValue(0)
  const op2 = useSharedValue(0)
  const tr0 = useSharedValue(0)
  const tr1 = useSharedValue(0)
  const tr2 = useSharedValue(0)

  // Final reveal : wordmark + CTA.
  const wordmarkOpacity = useSharedValue(0)
  const wordmarkScale = useSharedValue(0.92)
  const wordmarkFloat = useSharedValue(0)
  const ctaOpacity = useSharedValue(0)
  const ctaTranslate = useSharedValue(24)
  const ctaPulse = useSharedValue(1)
  // Encre du tampon — 0 = outline seul, 1 = pleine bordeaux.
  const ctaInk = useSharedValue(0)
  // Dérive subtile de la flèche à droite (invitation au tap).
  const arrowDrift = useSharedValue(0)

  useEffect(() => {
    success()

    // ── Manifeste ────────────────────────────────────────────────
    const phrases: { op: SharedValue<number>; tr: SharedValue<number> }[] = [
      { op: op0, tr: tr0 },
      { op: op1, tr: tr1 },
      { op: op2, tr: tr2 },
    ]
    phrases.forEach((p, i) => {
      const start = 200 + i * SLOT_MS
      // Fade-in
      p.op.value = withDelay(
        start,
        withSequence(
          withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }),
          // Hold pendant ≈ SLOT_MS - in - out
          withDelay(
            SLOT_MS - 280 - 280,
            // Fade-out (sauf dernière phrase qui reste à 1)
            i < phrases.length - 1
              ? withTiming(0, { duration: 280, easing: Easing.in(Easing.cubic) })
              : withTiming(1, { duration: 1 }),
          ),
        ),
      )
      // Trait d'encre bordeaux qui se trace de gauche à droite
      p.tr.value = withDelay(
        start + 220,
        withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }),
      )
    })

    // ── Sortie du manifeste : on cache la dernière phrase au moment
    //    où le wordmark prend la relève ──────────────────────────
    const finalStart = 200 + MANIFESTO.length * SLOT_MS
    op2.value = withDelay(
      finalStart - 200,
      withTiming(0, { duration: 360, easing: Easing.in(Easing.cubic) }),
    )

    // ── Final : wordmark + CTA + verif ──────────────────────────
    wordmarkOpacity.value = withDelay(
      finalStart + 100,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
    )
    wordmarkScale.value = withDelay(
      finalStart + 100,
      withSpring(1, { damping: 14, stiffness: 110 }),
    )
    // Flottement infini ±3px
    wordmarkFloat.value = withDelay(
      finalStart + 1000,
      withRepeat(
        withSequence(
          withTiming(-3, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
          withTiming(3, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    )

    ctaOpacity.value = withDelay(
      finalStart + 800,
      withTiming(1, { duration: 500 }),
    )
    ctaTranslate.value = withDelay(
      finalStart + 800,
      withSpring(0, { damping: 16, stiffness: 110 }),
    )
    // Pulse subtil infini ±2 % scale pour inviter au tap
    ctaPulse.value = withDelay(
      finalStart + 1500,
      withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    )
    // Dérive infinie de la flèche : 0 → 4px → 0. Plus rapide que le pulse,
    // pour donner l'impression que la porte appelle.
    arrowDrift.value = withDelay(
      finalStart + 1500,
      withRepeat(
        withSequence(
          withTiming(4, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    )
  }, [])

  const onContinue = async () => {
    tapMedium()
    const ok = await safePersist(() =>
      saveKolmiProgress({ hasCompletedBaseOnboarding: true }),
    )
    if (!ok) return

    // 3 tokens offerts à la fin de l'onboarding — uniquement si le solde
    // est actuellement à 0 pour ne pas écraser un solde existant après
    // un reset partiel ou un re-passage de l'onboarding.
    try {
      const balance = await getTokens()
      if (balance === 0) {
        await setTokens(3)
      }
    } catch (err) {
      console.warn('[kolmi] initial token grant failed', err)
    }

    router.replace('/matchmaker')
  }

  // Styles animés. Chaque phrase a son propre couple (opacity / trace).
  const phrase0Style = useAnimatedStyle(() => ({
    opacity: op0.value,
    transform: [{ translateY: (1 - op0.value) * 10 }],
  }))
  const phrase1Style = useAnimatedStyle(() => ({
    opacity: op1.value,
    transform: [{ translateY: (1 - op1.value) * 10 }],
  }))
  const phrase2Style = useAnimatedStyle(() => ({
    opacity: op2.value,
    transform: [{ translateY: (1 - op2.value) * 10 }],
  }))
  const trace0Style = useAnimatedStyle(() => ({
    transform: [{ scaleX: tr0.value }],
    opacity: op0.value,
  }))
  const trace1Style = useAnimatedStyle(() => ({
    transform: [{ scaleX: tr1.value }],
    opacity: op1.value,
  }))
  const trace2Style = useAnimatedStyle(() => ({
    transform: [{ scaleX: tr2.value }],
    opacity: op2.value,
  }))

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [
      { scale: wordmarkScale.value },
      { translateY: wordmarkFloat.value },
    ],
  }))

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [
      { translateY: ctaTranslate.value },
      { scale: ctaPulse.value },
    ],
  }))

  // Tampon bordeaux : transition continue de outline → fill au press.
  const ctaInkStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      ctaInk.value,
      [0, 1],
      ['rgba(139,26,26,0)', kolmiColors.accent],
    ),
  }))
  const ctaTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      ctaInk.value,
      [0, 1],
      [kolmiColors.accent, kolmiColors.bg],
    ),
  }))
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowDrift.value }],
  }))

  const handlePressIn = () => {
    ctaInk.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) })
  }
  const handlePressOut = () => {
    ctaInk.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) })
  }

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Scène centrale : les 3 phrases sont stackées en absolute pour
            qu'elles partagent exactement le même point d'ancrage et que
            le crossfade soit propre. Le wordmark reprend la même zone
            une fois le manifeste terminé. */}
        <View style={styles.stage}>
          <PhraseLine text={MANIFESTO[0]} phraseStyle={phrase0Style} traceStyle={trace0Style} />
          <PhraseLine text={MANIFESTO[1]} phraseStyle={phrase1Style} traceStyle={trace1Style} />
          <PhraseLine text={MANIFESTO[2]} phraseStyle={phrase2Style} traceStyle={trace2Style} />

          <Animated.View style={[styles.wordmarkWrap, wordmarkStyle]} pointerEvents="none">
            <KolmiWordmark size={72} color={kolmiColors.accent} />
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Animated.View style={ctaStyle}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={onContinue}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              accessibilityRole="button"
              accessibilityLabel="Pousser la porte — entrer dans Kolmi"
            >
              {/* Tampon : cadre bordeaux fin, pas de fill au repos. Le
                  fill bordeaux apparaît au press en tween continu, comme
                  une pression de cachet. */}
              <Animated.View style={[styles.cta, ctaInkStyle]}>
                <Animated.Text style={[styles.ctaText, ctaTextStyle]}>
                  Pousser la porte
                </Animated.Text>
                <Animated.Text style={[styles.ctaArrow, ctaTextStyle, arrowStyle]}>
                  →
                </Animated.Text>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  )
}

// Une phrase + son trait bordeaux qui se trace dessous. Position absolute
// pour que les 3 phrases se superposent à la même hauteur (crossfade clean).
function PhraseLine({
  text,
  phraseStyle,
  traceStyle,
}: {
  text: string
  phraseStyle: ReturnType<typeof useAnimatedStyle>
  traceStyle: ReturnType<typeof useAnimatedStyle>
}) {
  return (
    <Animated.View style={[styles.phraseWrap, phraseStyle]}>
      <Text style={styles.phraseText}>{text}</Text>
      <View style={styles.traceTrack}>
        <Animated.View
          style={[
            styles.traceBar,
            traceStyle,
            { transformOrigin: 'left' as const },
          ]}
        />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  stage: {
    flex: 1,
    paddingHorizontal: kolmiPaddingX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phraseWrap: {
    position: 'absolute',
    left: kolmiPaddingX,
    right: kolmiPaddingX,
    alignItems: 'center',
    gap: 18,
  },
  phraseText: {
    fontFamily: kolmiFonts.serif,
    fontSize: 34,
    lineHeight: 42,
    color: kolmiColors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  traceTrack: {
    width: 96,
    height: 1.4,
    overflow: 'hidden',
  },
  traceBar: {
    width: '100%',
    height: '100%',
    backgroundColor: kolmiColors.accent,
  },
  wordmarkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: kolmiPaddingX,
    paddingBottom: kolmiSpace.xl,
    paddingTop: kolmiSpace.sm,
    gap: kolmiSpace.md,
  },
  // Tampon éditorial : cadre bordeaux fin, fond transparent au repos.
  // Le press déclenche un fill bordeaux progressif (cf ctaInkStyle).
  cta: {
    height: 60,
    borderRadius: kolmiRadius.pill,
    borderWidth: 1.2,
    borderColor: kolmiColors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: kolmiSpace.lg,
  },
  ctaText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 18,
    letterSpacing: 0.2,
    // color est piloté par ctaTextStyle (interpolation reanimated)
  },
  ctaArrow: {
    fontFamily: kolmiFonts.serif,
    fontSize: 18,
    letterSpacing: 0,
    marginLeft: 2,
  },
})
