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
  isSubscribed,
  getHasPurchased,
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

// ─── Nudge premium — 3 variants en cycle ───────────────────────────
//
// À chaque palier de 3 décisions (3, 6, 9, …) on tire un nudge depuis
// ce tableau, en cyclant. Le contenu varie pour ne pas lasser :
// V1 = pitch global ; V2 = focus à la carte ; V3 = focus abonnement.

type NudgeVariant = 'full' | 'a-la-carte' | 'abonnement'
const NUDGE_VARIANTS: NudgeVariant[] = ['full', 'a-la-carte', 'abonnement']

type NudgeContent = {
  kicker: string
  title: string
  body: string
  // Tuiles affichées sous le body — 2 pour le pitch global, 1 pour les
  // pitches focalisés.
  tiles: { kicker: string; price: string }[]
  ctaLabel: string
}

const NUDGE_COPY: Record<NudgeVariant, NudgeContent> = {
  full: {
    kicker: 'Vous avancez',
    title: 'Encore trois portraits.',
    body: 'Continuez sans compter, ou choisissez votre rythme — packs à la pièce ou abonnement mensuel.',
    tiles: [
      { kicker: 'À la carte', price: 'dès 15 €' },
      { kicker: 'Abonnement', price: '60 € / mois' },
    ],
    ctaLabel: 'Voir les formules',
  },
  'a-la-carte': {
    kicker: 'À la pièce',
    title: 'Trois rencontres choisies.',
    body: 'Un pack de 3 tokens à 39 €, c\'est trois demandes posées sans précipitation. Le rythme reste à vous.',
    tiles: [{ kicker: 'Pack 3 tokens', price: '39 €' }],
    ctaLabel: 'Voir les packs',
  },
  abonnement: {
    kicker: 'Sans compter',
    title: 'L\'abonnement, pour les patients.',
    body: '5 tokens chaque mois, profils par jour illimités, priorité éditoriale du matchmaker.',
    tiles: [{ kicker: 'Abonnement KOLMI', price: '60 € / mois' }],
    ctaLabel: 'En savoir plus',
  },
}

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
  const [subscribed, setSubscribed] = useState<boolean>(false)
  const [hasPurchased, setHasPurchased] = useState<boolean>(false)
  const [showPremiumNudge, setShowPremiumNudge] = useState<boolean>(false)
  // Variant du popup affiché — cycle 0 → 1 → 2 → 0… à chaque
  // déclenchement pour ne pas répéter la même pitch trois fois.
  const [nudgeVariant, setNudgeVariant] = useState<NudgeVariant>('full')
  // Index dans state.events à partir duquel on doit animer. Mis à jour
  // après chaque décision pour ne ré-animer que les nouveaux events.
  const [freshFromIndex, setFreshFromIndex] = useState(0)
  // Profils du jour (selectedSlots) — figé une fois la conversation
  // construite pour la première fois.
  const profilesRef = useRef<typeof mockSelectedProfiles>([])
  const dnaRef = useRef<KolmiDnaResult | null>(null)
  // Compteur précédent de décisions — sert à détecter chaque
  // franchissement de palier de 3 (3, 6, 9…). La restauration d'état
  // initialise ce ref pour ne pas re-fire à l'ouverture.
  const prevDecisionCountRef = useRef(0)
  // Combien de fois le nudge a été tiré dans cette session — sert à
  // choisir le variant suivant (cycle de 3).
  const nudgeFireCountRef = useRef(0)

  // Charge la conversation à l'ouverture du tab + au focus.
  const load = useCallback(async () => {
    await cleanupOldConversations()
    const day = todayKey()
    const [stored, dna, passed, balance, subscribed, purchased] =
      await Promise.all([
        loadConversation(day),
        getKolmiDnaResult(),
        getPassedProfiles(),
        getTokens(),
        isSubscribed(),
        getHasPurchased(),
      ])
    dnaRef.current = dna
    setTokens(balance)
    setSubscribed(subscribed)
    setHasPurchased(purchased)

    if (stored) {
      // Conversation existante du jour — on la restaure tel quel,
      // freshFromIndex = events.length pour ne rien ré-animer.
      setState(stored)
      setFreshFromIndex(stored.events.length)
      // Initialise le compteur sur la valeur restaurée — un user qui
      // ouvre l'app avec 5 décisions déjà prises ne doit PAS recevoir
      // le nudge (il est arrivé là hier, ou il l'a déjà ignoré).
      prevDecisionCountRef.current = stored.events.filter(
        (e) => e.kind === 'user_decision',
      ).length
      // Reconstruit la liste des profils référés par la conversation
      // pour pouvoir les passer à recordDecision.
      profilesRef.current = stored.profileIds
        .map((id) => mockSelectedProfiles.find((p) => p.id === id))
        .filter((p): p is (typeof mockSelectedProfiles)[number] => p !== undefined)
      return
    }
    // Pas de stored → toute nouvelle journée, compteur à 0.
    prevDecisionCountRef.current = 0

    // Première ouverture du jour — on génère la sélection (exclut les
    // profils déjà passés). Cap : 10 par défaut, ILLIMITÉ pour les
    // abonnés (la formule "Abonnement" a comme promesse explicite "des
    // profils par jour illimités").
    const filtered = mockSelectedProfiles.filter(
      (p) => !passed.includes(p.id),
    )
    const candidates = subscribed ? filtered : filtered.slice(0, 10)
    profilesRef.current = candidates

    const fresh = buildDayConversation(candidates, dna)
    setState(fresh)
    setFreshFromIndex(0) // tout est neuf, anime tout
    saveConversation(fresh).catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Nudge premium : à chaque palier de 3 décisions (3, 6, 9…), on
  // propose une formule. JAMAIS pour les abonnés ni pour ceux qui ont
  // déjà acheté un pack au moins une fois. Cycle de 3 variants pour
  // éviter la répétition.
  useEffect(() => {
    if (!state || subscribed || hasPurchased) return
    const count = state.events.filter(
      (e) => e.kind === 'user_decision',
    ).length
    const prev = prevDecisionCountRef.current
    // Détecte un franchissement de palier de 3 (3, 6, 9, 12, …) entre
    // l'ancien et le nouveau count.
    const crossedTier =
      Math.floor(count / 3) > Math.floor(prev / 3) && count % 3 === 0
    if (crossedTier) {
      const idx = nudgeFireCountRef.current % NUDGE_VARIANTS.length
      nudgeFireCountRef.current += 1
      setNudgeVariant(NUDGE_VARIANTS[idx])
      setShowPremiumNudge(true)
    }
    prevDecisionCountRef.current = count
  }, [state, subscribed, hasPurchased])

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

  const closeNudge = useCallback(() => setShowPremiumNudge(false), [])
  const nudgeGoPremium = useCallback(() => {
    setShowPremiumNudge(false)
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

        {/* Modal "nudge premium" — apparaît à chaque palier de 3
            décisions pour les utilisateurs non abonnés et qui n'ont
            jamais acheté de tokens. Cycle de 3 variants pour éviter la
            répétition. */}
        <Modal
          visible={showPremiumNudge}
          transparent
          animationType="fade"
          onRequestClose={closeNudge}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeNudge}>
            <Pressable
              style={styles.modalCard}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalRule} />
              <Text style={styles.modalKicker}>
                {NUDGE_COPY[nudgeVariant].kicker}
              </Text>
              <Text style={styles.modalTitle}>
                {NUDGE_COPY[nudgeVariant].title}
              </Text>
              <Text style={styles.modalBody}>
                {NUDGE_COPY[nudgeVariant].body}
              </Text>

              <View style={styles.nudgeFormulas}>
                {NUDGE_COPY[nudgeVariant].tiles.map((tile, i, arr) => (
                  <React.Fragment key={tile.kicker}>
                    <View style={styles.nudgeFormula}>
                      <Text style={styles.nudgeFormulaKicker}>
                        {tile.kicker}
                      </Text>
                      <Text style={styles.nudgeFormulaPrice}>{tile.price}</Text>
                    </View>
                    {i < arr.length - 1 && (
                      <View style={styles.nudgeFormulaSeparator} />
                    )}
                  </React.Fragment>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={closeNudge}
                  activeOpacity={0.7}
                  style={styles.modalCancel}
                >
                  <Text style={styles.modalCancelText}>Plus tard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={nudgeGoPremium}
                  activeOpacity={0.85}
                  style={styles.modalConfirm}
                >
                  <Text style={styles.modalConfirmText}>
                    {NUDGE_COPY[nudgeVariant].ctaLabel}
                  </Text>
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

  // Nudge premium — bandeau "deux formules" intégré dans la modale.
  nudgeFormulas: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: kolmiSpace.md,
    paddingVertical: kolmiSpace.sm,
    borderTopWidth: 0.6,
    borderBottomWidth: 0.6,
    borderColor: 'rgba(22,19,15,0.15)',
  },
  nudgeFormula: {
    flex: 1,
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  nudgeFormulaKicker: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 10,
    color: kolmiColors.textSecondary,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  nudgeFormulaPrice: {
    fontFamily: kolmiFonts.serif,
    fontSize: 17,
    color: kolmiColors.text,
    letterSpacing: -0.2,
    marginTop: 4,
  },
  nudgeFormulaSeparator: {
    width: 0.6,
    backgroundColor: 'rgba(22,19,15,0.15)',
    marginHorizontal: kolmiSpace.md,
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
