import React, { useEffect, useState, useCallback, useRef } from 'react'
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import MatchmakerTimeline from '@/components/kolmi/MatchmakerTimeline'
import { mockSelectedProfiles } from '@/data/mockSelectedProfiles'
import {
  getKolmiDnaResult,
  getPassedProfiles,
  passProfile,
  getTokens,
  getMeetings,
} from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'
import {
  buildDayConversation,
  loadConversation,
  saveConversation,
  recordDecision,
  cleanupOldConversations,
  todayKey,
  type ConversationState,
  type Choice,
} from '@/lib/kolmi/conversationEngine'
import type { KolmiDnaResult } from '@/lib/kolmi/types'

// Le tab central — la conversation du jour avec le matchmaker.
// À l'ouverture, on charge la conversation du jour (build depuis 0
// si rien n'est persisté). À chaque décision, on patche le state +
// on persiste, et la timeline ré-anime juste les nouveaux events.
export default function ConversationTabScreen() {
  const router = useRouter()
  const [state, setState] = useState<ConversationState | null>(null)
  const [tokens, setTokens] = useState<number>(0)
  const [showTokenAlert, setShowTokenAlert] = useState(false)
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null)
  // Index dans state.events à partir duquel on doit animer. Mis à jour
  // après chaque décision pour ne ré-animer que les nouveaux events.
  const [freshFromIndex, setFreshFromIndex] = useState(0)
  // Profils du jour (selectedSlots) — figé une fois la conversation
  // construite pour la première fois.
  const profilesRef = useRef<typeof mockSelectedProfiles>([])
  const dnaRef = useRef<KolmiDnaResult | null>(null)

  // Charge la conversation à l'ouverture du tab + au focus.
  const load = useCallback(async () => {
    await cleanupOldConversations()
    const day = todayKey()
    const [stored, dna, passed, balance] = await Promise.all([
      loadConversation(day),
      getKolmiDnaResult(),
      getPassedProfiles(),
      getTokens(),
    ])
    dnaRef.current = dna
    setTokens(balance)

    if (stored) {
      // Conversation existante du jour — on la restaure tel quel,
      // freshFromIndex = events.length pour ne rien ré-animer.
      setState(stored)
      setFreshFromIndex(stored.events.length)
      // Reconstruit la liste des profils référés par la conversation
      // pour pouvoir les passer à recordDecision.
      profilesRef.current = stored.profileIds
        .map((id) => mockSelectedProfiles.find((p) => p.id === id))
        .filter((p): p is (typeof mockSelectedProfiles)[number] => p !== undefined)
      return
    }

    // Première ouverture du jour — on génère la sélection (cap 10,
    // exclut featured et passés) puis on construit la conversation.
    // Le cap est volontairement large : avec ~7 profils non-featured
    // dans le mock, tout passe ; au-delà, on évite une journée trop
    // longue.
    const candidates = mockSelectedProfiles
      .filter((p) => !p.isFeatured)
      .filter((p) => !passed.includes(p.id))
      .slice(0, 10)
    profilesRef.current = candidates

    const fresh = buildDayConversation(candidates, dna)
    setState(fresh)
    setFreshFromIndex(0) // tout est neuf, anime tout
    saveConversation(fresh).catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useFocusEffect(
    useCallback(() => {
      // À chaque retour sur le tab, refresh tokens (peut avoir changé
      // depuis Premium ou meeting/request) — mais on ne re-load PAS la
      // conversation pour ne pas perdre le state d'animation.
      getTokens().then(setTokens).catch(() => {})

      // Day rollover : si l'app est restée ouverte et qu'on a passé
      // minuit, le state encore en mémoire reste sur dayKey d'hier. On
      // détecte ici et on reload pour que la nouvelle journée prenne
      // la place — sans ça le user ne voit jamais le nouveau courrier.
      setState((prev) => {
        if (prev && prev.dayKey !== todayKey()) {
          load()
          return null
        }
        return prev
      })

      // Réconciliation décision « Demander » : si on est rentré dans la
      // page /meeting/request mais qu'on en est ressorti sans confirmer,
      // on ne doit PAS marquer le profil comme demandé. À l'inverse, si
      // un meeting existe vraiment pour ce profileId, on patche la
      // timeline avec le user_decision approprié.
      if (!pendingProfileId) return
      const profileId = pendingProfileId
      ;(async () => {
        try {
          const meetings = await getMeetings()
          const hasMeeting = meetings.some(
            (m) => m.profileId === profileId && m.status !== 'declined',
          )
          setPendingProfileId(null)
          if (!hasMeeting) return
          // Le meeting existe → on enregistre la décision et on persiste.
          setState((prev) => {
            if (!prev) return prev
            // Si déjà enregistré (e.g. user a rebondi 2 fois), no-op.
            const already = prev.events.some(
              (e) =>
                e.kind === 'user_decision' &&
                e.profileId === profileId &&
                e.choice === 'request',
            )
            if (already) return prev
            const next = recordDecision(
              prev,
              profileId,
              'request',
              profilesRef.current,
              dnaRef.current,
            )
            setFreshFromIndex(prev.events.length)
            saveConversation(next).catch(() => {})
            return next
          })
        } catch {
          // Au pire, on laisse l'utilisateur réessayer — pas de signal
          // utile à pousser ici.
          setPendingProfileId(null)
        }
      })()
    }, [load, pendingProfileId]),
  )

  const handleDecision = useCallback(
    async (profileId: string, choice: Choice) => {
      if (!state) return

      if (choice === 'request') {
        // Token guard : si 0 tokens, on bloque ici. Si OK, on navigue
        // vers /meeting/request/[id] qui se charge du SwipeToConfirm
        // final. On NE record PAS la décision tout de suite — sinon un
        // user qui back out de la confirmation verrait son MiniRecap
        // « Demandé » alors qu'aucun meeting n'a été créé. La timeline
        // est patchée au retour si on détecte un meeting effectif.
        if (tokens <= 0) {
          setShowTokenAlert(true)
          return
        }
        setPendingProfileId(profileId)
        router.push(`/meeting/request/${profileId}`)
        return
      }

      // Pass : persiste passProfile, patch la conversation.
      await safePersist(() => passProfile(profileId))
      const next = recordDecision(
        state,
        profileId,
        'pass',
        profilesRef.current,
        dnaRef.current,
      )
      setState(next)
      setFreshFromIndex(state.events.length)
      saveConversation(next).catch(() => {})
    },
    [state, tokens, router],
  )

  const handleProfileTap = useCallback(
    (profileId: string) => router.push(`/matches/${profileId}`),
    [router],
  )

  const handleTimelineSettled = useCallback(
    (lastId: string) => {
      if (!state) return
      if (state.cursorEventId === lastId) return
      const next = { ...state, cursorEventId: lastId }
      setState(next)
      saveConversation(next).catch(() => {})
    },
    [state],
  )

  const closeTokenAlert = useCallback(() => setShowTokenAlert(false), [])
  const goPremium = useCallback(() => {
    setShowTokenAlert(false)
    router.push('/premium')
  }, [router])

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header minimal en haut — kicker + indicateur de tokens */}
        <View style={styles.header}>
          <Text style={styles.kicker}>Correspondance du jour</Text>
          <TouchableOpacity
            onPress={() => router.push('/premium')}
            activeOpacity={0.7}
            style={[styles.tokenIndicator, tokens === 0 && styles.tokenIndicatorEmpty]}
            hitSlop={8}
            accessibilityLabel={
              tokens > 0
                ? `${tokens} tokens disponibles, voir les recharges`
                : 'Aucun token, voir les recharges'
            }
            accessibilityRole="button"
          >
            <View style={[styles.tokenDot, tokens === 0 && styles.tokenDotEmpty]} />
            <Text style={[styles.tokenCount, tokens === 0 && styles.tokenCountEmpty]}>
              {tokens}
            </Text>
          </TouchableOpacity>
        </View>

        {state && (
          <MatchmakerTimeline
            state={state}
            freshFromIndex={freshFromIndex}
            onDecision={handleDecision}
            onProfileTap={handleProfileTap}
            onTimelineSettled={handleTimelineSettled}
          />
        )}

        {/* Modal "rareté" */}
        <Modal
          visible={showTokenAlert}
          transparent
          animationType="fade"
          onRequestClose={closeTokenAlert}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeTokenAlert}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalRule} />
              <Text style={styles.modalKicker}>Plus de tokens</Text>
              <Text style={styles.modalTitle}>La rareté est volontaire.</Text>
              <Text style={styles.modalBody}>
                Un token offert par envoi de demande. Recharger se fait depuis l'écran Premium.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={closeTokenAlert}
                  activeOpacity={0.7}
                  style={styles.modalCancel}
                >
                  <Text style={styles.modalCancelText}>Plus tard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={goPremium}
                  activeOpacity={0.85}
                  style={styles.modalConfirm}
                >
                  <Text style={styles.modalConfirmText}>Voir les recharges</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.sm,
    paddingBottom: kolmiSpace.xs,
  },
  kicker: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textMuted,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
  tokenIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tokenIndicatorEmpty: {
    opacity: 0.55,
  },
  tokenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: kolmiColors.accent,
  },
  tokenDotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: kolmiColors.textMuted,
  },
  tokenCount: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 14,
    color: kolmiColors.text,
    letterSpacing: 0.4,
  },
  tokenCountEmpty: {
    color: kolmiColors.textMuted,
  },

  // Modal "rareté"
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,10,10,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: kolmiPaddingX,
  },
  modalCard: {
    width: '100%',
    backgroundColor: kolmiColors.bg,
    borderRadius: kolmiRadius.lg,
    paddingHorizontal: kolmiSpace.xl,
    paddingTop: kolmiSpace.xl,
    paddingBottom: kolmiSpace.lg,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    gap: kolmiSpace.sm,
  },
  modalRule: {
    width: 32,
    height: 0.8,
    backgroundColor: kolmiColors.accent,
    marginBottom: kolmiSpace.xs,
  },
  modalKicker: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textMuted,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontFamily: kolmiFonts.serif,
    fontSize: 26,
    color: kolmiColors.text,
    lineHeight: 32,
    letterSpacing: -0.4,
    marginTop: kolmiSpace.xxs,
  },
  modalBody: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    lineHeight: 22,
    color: kolmiColors.textBody,
    marginTop: kolmiSpace.xs,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: kolmiSpace.sm,
    marginTop: kolmiSpace.lg,
  },
  modalCancel: {
    paddingHorizontal: kolmiSpace.md,
    paddingVertical: kolmiSpace.sm,
  },
  modalCancelText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 14,
    color: kolmiColors.textBody,
  },
  modalConfirm: {
    backgroundColor: kolmiColors.accent,
    borderRadius: kolmiRadius.pill,
    paddingHorizontal: kolmiSpace.lg,
    paddingVertical: kolmiSpace.sm,
  },
  modalConfirmText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 14,
    color: kolmiColors.white,
    letterSpacing: 0.2,
  },
})
