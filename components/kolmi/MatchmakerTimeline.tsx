import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import MatchmakerMessage from './MatchmakerMessage'
import ProfilePresentationCard from './ProfilePresentationCard'
import ProfileMiniRecap from './ProfileMiniRecap'
import DecisionInline from './DecisionInline'
import ConversationDayHeader from './ConversationDayHeader'
import type {
  ConversationState,
  TimelineEvent,
  Choice,
} from '@/lib/kolmi/conversationEngine'
import { getSelectedProfileById } from '@/data/mockSelectedProfiles'

type Props = {
  state: ConversationState
  // Index dans state.events à partir duquel on doit animer (events
  // antérieurs sont déjà vus → render statique sans type-in / build).
  // Si non fourni, on considère que tout est nouveau (premier render).
  freshFromIndex?: number
  onDecision: (profileId: string, choice: Choice) => void
  onProfileTap?: (profileId: string) => void
  // Callback quand le dernier event "fresh" est terminé (pour persister
  // un cursorEventId mis à jour côté parent).
  onTimelineSettled?: (lastEventId: string) => void
}

// Orchestrateur de la timeline. Stratégie :
//   • events[0..freshFromIndex-1] → render statique (déjà animé avant)
//   • events[freshFromIndex..] → révélation séquentielle ; on n'affiche
//     l'event N+1 que quand l'event N a signalé sa fin (onComplete /
//     onReady selon son kind).
//
// L'event 'decision_inline' apparaît dès qu'on est rendu à son index
// (pas d'animation bloquante), et c'est lui qui "absorbe" la fin de
// la séquence : tant qu'il est là, on attend la décision utilisateur.
function MatchmakerTimeline({
  state,
  freshFromIndex,
  onDecision,
  onProfileTap,
  onTimelineSettled,
}: Props) {
  const events = state.events
  const total = events.length

  // Index "frontier" : combien d'events sont visibles actuellement.
  // Démarre à `freshFromIndex` (les events avant sont visibles d'office).
  const initialFrontier = useMemo(() => {
    return freshFromIndex ?? 0
  }, [freshFromIndex])

  const [frontier, setFrontier] = useState<number>(initialFrontier)

  // Lorsque events changent (nouveaux ajoutés après une décision),
  // on garde frontier où il est si possible — la sequence continue.
  // Si events ont raccourci (rare, ex. reset), on le clamp.
  useEffect(() => {
    setFrontier((prev) => Math.min(prev, total))
  }, [total])

  // Auto-scroll en bas quand frontier avance ou quand events changent —
  // mais SEULEMENT si l'utilisateur est déjà près du bas. Sinon il est
  // probablement en train de relire un événement précédent et on ne
  // veut pas le téléporter en bas à chaque révélation.
  const scrollRef = useRef<ScrollView | null>(null)
  const nearBottomRef = useRef(true)
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height)
      // Tolérance 120 px — on considère "près du bas" assez large pour
      // ne pas pénaliser un léger rebound.
      nearBottomRef.current = distanceFromBottom < 120
    },
    [],
  )
  useEffect(() => {
    if (!nearBottomRef.current) return
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, 80)
    return () => clearTimeout(t)
  }, [frontier, total])

  // Quand le frontier atteint la fin, on prévient le parent.
  const lastSettledIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (frontier >= total && total > 0) {
      const lastId = events[total - 1]?.id ?? null
      if (lastId && lastId !== lastSettledIdRef.current) {
        lastSettledIdRef.current = lastId
        onTimelineSettled?.(lastId)
      }
    }
  }, [frontier, total, events, onTimelineSettled])

  // Bouclage commun pour avancer le frontier d'une unité.
  const advance = useCallback(() => {
    setFrontier((prev) => Math.min(total, prev + 1))
  }, [total])

  // Pour les events "instant" (decision_inline, session_end, day_header,
  // user_decision) on avance le frontier au montage côté parent. On le
  // fait ici via un useEffect qui regarde frontier et le type de l'event
  // courant : si l'event "courant" est instant, on bump tout de suite.
  useEffect(() => {
    if (frontier >= total) return
    const ev = events[frontier]
    if (!ev) return
    if (
      ev.kind === 'day_header' ||
      ev.kind === 'user_decision' ||
      ev.kind === 'session_end' ||
      ev.kind === 'decision_inline'
    ) {
      // Petit délai pour laisser le fade-in se faire avant d'enchaîner.
      const t = setTimeout(advance, 220)
      return () => clearTimeout(t)
    }
  }, [frontier, total, events, advance])

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={120}
    >
      {events.map((ev, idx) => {
        const isVisible = idx < frontier
        const isCurrent = idx === frontier
        // Un event "fresh" est celui qui apparaît pour la 1ʳᵉ fois lors
        // de cette session — il anime. Les events antérieurs au
        // freshFromIndex sont rendus statiques même s'ils sont récents.
        const isFresh = idx >= initialFrontier && (isVisible || isCurrent)

        // On rend les events visibles + l'event courant (qui s'apprête
        // à animer). Les futurs sont cachés.
        if (!isVisible && !isCurrent) return null

        return (
          <View key={ev.id}>
            {renderEvent({
              ev,
              isFresh,
              onComplete: advance,
              state,
              onDecision,
              onProfileTap,
            })}
          </View>
        )
      })}

      {/* Si plus rien à afficher, petit ornement final */}
      {state.profileIds.length === 0 && events.length <= 2 && (
        <View style={styles.idleBlock}>
          <View style={styles.idleOrnament} />
          <Text style={styles.idleText}>· · ·</Text>
        </View>
      )}
    </ScrollView>
  )
}

type RenderArgs = {
  ev: TimelineEvent
  isFresh: boolean
  onComplete: () => void
  state: ConversationState
  onDecision: (profileId: string, choice: Choice) => void
  onProfileTap?: (profileId: string) => void
}

function renderEvent({
  ev,
  isFresh,
  onComplete,
  state,
  onDecision,
  onProfileTap,
}: RenderArgs): React.ReactNode {
  switch (ev.kind) {
    case 'day_header':
      return (
        <Animated.View entering={FadeIn.duration(280)}>
          <ConversationDayHeader label={ev.label} isToday />
        </Animated.View>
      )

    case 'matchmaker_message':
      return (
        <MatchmakerMessage
          text={ev.text}
          tone={ev.tone}
          isFresh={isFresh}
          onComplete={onComplete}
        />
      )

    case 'profile_presentation': {
      const profile = getSelectedProfileById(ev.profileId)
      if (!profile) return null
      // Si decided → on affiche le MiniRecap (le user a déjà tranché)
      if (ev.stage === 'decided') {
        // Cherche la décision associée pour savoir le choix
        const decision = state.events.find(
          (e) => e.kind === 'user_decision' && e.profileId === ev.profileId,
        )
        const choice =
          decision && decision.kind === 'user_decision'
            ? decision.choice
            : 'pass'
        return (
          <ProfileMiniRecap
            profile={profile}
            decision={choice}
            onPress={onProfileTap}
          />
        )
      }
      return (
        <ProfilePresentationCard
          profile={profile}
          stage={ev.stage}
          onReady={isFresh ? onComplete : undefined}
          onPress={onProfileTap ? () => onProfileTap(profile.id) : undefined}
        />
      )
    }

    case 'decision_inline': {
      // Quand on rend ce noeud, ça veut dire que tout ce qui précède est
      // visible. L'utilisateur peut décider. Si déjà décidé (pas
      // possible avec notre engine — le decision_inline est remplacé
      // par user_decision — mais par sécurité), on ne rend rien.
      return (
        <Animated.View entering={FadeIn.duration(380)}>
          <DecisionInline
            // Pulse uniquement si c'est la 1ʳᵉ décision du jour (pas
            // encore d'user_decision dans la timeline).
            pulse={
              !state.events.some((e) => e.kind === 'user_decision')
            }
            onChoice={(choice) => onDecision(ev.profileId, choice)}
          />
        </Animated.View>
      )
    }

    case 'user_decision':
      // L'event est conservé dans la timeline mais non rendu — le
      // MiniRecap (issu de profile_presentation 'decided') porte la
      // visualisation de la décision.
      return null

    case 'session_end':
      return (
        <Animated.View entering={FadeIn.duration(420)} style={styles.endBlock}>
          <Text style={styles.endText}>{ev.text}</Text>
        </Animated.View>
      )

    default:
      return null
  }
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: kolmiPaddingX,
    // Pas de paddingTop — le contenu colle au header pour ramener la
    // première carte vers le haut de l'écran. Le day_header se charge
    // de la respiration courte.
    paddingTop: 0,
    paddingBottom: kolmiSpace.xxxl * 2,
  },
  endBlock: {
    alignItems: 'center',
    marginTop: kolmiSpace.xxl,
    marginBottom: kolmiSpace.xxxl,
  },
  endText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 18,
    color: kolmiColors.accent,
    letterSpacing: 1,
  },
  idleBlock: {
    alignItems: 'center',
    marginTop: kolmiSpace.xxxl,
    gap: kolmiSpace.sm,
  },
  idleOrnament: {
    width: 32,
    height: 0.6,
    backgroundColor: 'rgba(139,26,26,0.55)',
  },
  idleText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 22,
    color: kolmiColors.textMuted,
    letterSpacing: 4,
  },
})

export default React.memo(MatchmakerTimeline)
