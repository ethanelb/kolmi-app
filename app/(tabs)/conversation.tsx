import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  Share,
  TouchableOpacity,
} from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import Animated, { FadeInUp } from 'react-native-reanimated'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
  fontScale,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import KolmiWordmark from '@/components/kolmi/KolmiWordmark'
import { mockSelectedProfiles } from '@/data/mockSelectedProfiles'
import { rankProfilesByAffinity } from '@/lib/kolmi/matching'
import { fetchSelectableProfiles } from '@/lib/kolmi/fetchProfiles'
import { askMatchmaker } from '@/lib/kolmi/matchmakerChat'
import {
  getKolmiDnaResult,
  getKolmiProfile,
  getGigiIntroduced,
  setGigiIntroduced,
  getPassedProfiles,
  passProfile,
  getTokens,
  getMeetings,
  isSubscribed,
  getHasPurchased,
  type KolmiProfile,
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
  type TimelineEvent,
} from '@/lib/kolmi/conversationEngine'
import { kolmiMotion, staggerDelay } from '@/lib/kolmi/motion'
import type { Meeting } from '@/lib/kolmi/types'
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

// Trois pitches émotionnels — on vend la rencontre, pas le token. Cycle
// 0 → 1 → 2 → 0 ; chaque palier de 3 décisions tire le suivant.
//   V1 (full) — la promesse universelle : une rencontre change tout.
//   V2 (à la carte) — l'unité du choix : un token = une histoire.
//   V3 (abonnement) — la liberté : arrêter de compter.
const NUDGE_COPY: Record<NudgeVariant, NudgeContent> = {
  full: {
    kicker: 'Tout commence ici',
    title: 'Une rencontre peut changer une vie.',
    body: 'GIGI continue à lire pour vous. La prochaine personne qui compte est peut-être déjà dans le courrier — à vous de tendre la main.',
    tiles: [
      { kicker: 'À la pièce', price: 'dès 15 €' },
      { kicker: 'Sans compter', price: '60 € / mois' },
    ],
    ctaLabel: 'Choisir mon rythme',
  },
  'a-la-carte': {
    kicker: 'Un token, une histoire',
    title: 'Tout commence avec un seul token.',
    body: 'Trois demandes posées sans précipitation, c\'est trois conversations qui n\'auraient peut-être jamais eu lieu. Choisissez moins, mais mieux.',
    tiles: [{ kicker: 'Pack 3 tokens', price: '39 €' }],
    ctaLabel: 'Voir les packs',
  },
  abonnement: {
    kicker: 'Arrêter de compter',
    title: 'Et si vous laissiez le hasard de côté ?',
    body: '5 tokens chaque mois, profils illimités, GIGI en alerte permanente. Pour ceux qui ne veulent plus laisser passer la bonne personne par flemme du compteur.',
    tiles: [{ kicker: 'Abonnement KOLMI', price: '60 € / mois' }],
    ctaLabel: 'Découvrir l\'abonnement',
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
  // Photo de profil pour l'avatar header — lue au focus.
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(undefined)
  // Meetings actifs — affichés sous "Mes rencontres" dans le feed.
  const [meetings, setMeetings] = useState<Meeting[]>([])
  // Profils déjà passés — récupéré au focus pour filtrer le feed
  // « Mes intros » après une décision prise sur /matches/[id].
  const [passedProfileIds, setPassedProfileIds] = useState<string[]>([])
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
    const [stored, dna, passed, balance, subscribed, purchased, allProfiles, profile, meetingsList] =
      await Promise.all([
        loadConversation(day),
        getKolmiDnaResult(),
        getPassedProfiles(),
        getTokens(),
        isSubscribed(),
        getHasPurchased(),
        fetchSelectableProfiles(),
        getKolmiProfile(),
        getMeetings(),
      ])
    dnaRef.current = dna
    setTokens(balance)
    setSubscribed(subscribed)
    setHasPurchased(purchased)
    setMeetings(meetingsList)

    if (stored) {
      // Conversation existante du jour — on la restaure tel quel.
      setState(stored)
      // Initialise le compteur sur la valeur restaurée — un user qui
      // ouvre l'app avec 5 décisions déjà prises ne doit PAS recevoir
      // le nudge (il est arrivé là hier, ou il l'a déjà ignoré).
      prevDecisionCountRef.current = stored.events.filter(
        (e) => e.kind === 'user_decision',
      ).length
      // Reconstruit la liste des profils référés par la conversation
      // pour pouvoir les passer à recordDecision. On essaie d'abord en
      // DB (fetched) puis en mock pour les ids qui n'existent pas en DB.
      profilesRef.current = stored.profileIds
        .map(
          (id) =>
            allProfiles.find((p) => p.id === id) ??
            mockSelectedProfiles.find((p) => p.id === id),
        )
        .filter((p): p is (typeof mockSelectedProfiles)[number] => p !== undefined)
      return
    }
    // Pas de stored → toute nouvelle journée, compteur à 0.
    prevDecisionCountRef.current = 0

    // Première ouverture du jour — on génère la sélection (exclut les
    // profils déjà passés). Cap : 10 par défaut, ILLIMITÉ pour les
    // abonnés (la formule "Abonnement" a comme promesse explicite "des
    // profils par jour illimités").
    const notPassed = allProfiles.filter((p) => !passed.includes(p.id))
    // Matching DNA : on classe par affinité avec la Maison du user
    // (mêmes axes → score haut, opposés totaux → filtrés). Si le user
    // n'a pas encore fait le matchmaker, `dna === null` → rankProfilesByAffinity
    // retourne tout dans l'ordre d'origine.
    const ranked = rankProfilesByAffinity(notPassed, dna)
    const candidates = subscribed ? ranked : ranked.slice(0, 10)
    profilesRef.current = candidates

    const fresh = buildDayConversation(candidates, dna)
    setState(fresh)
    saveConversation(fresh).catch(() => {})

    // LIA (matchmaker Claude) réécrit l'accroche d'ouverture à partir des
    // profils du soir. La conversation locale s'affiche déjà — on remplace
    // juste le texte d'ouverture quand LIA répond (~2-3 s). Si l'appel
    // échoue, on garde le texte local : aucune régression.
    // Appel de phare contextuel : l'accroche s'adapte à l'état des
    // rencontres de l'utilisateur (rdv passé, à venir, en attente, ou
    // simple découverte) — une relance pour donner envie de taper.
    const resolveName = (id: string) =>
      (allProfiles.find((p) => p.id === id) ??
        mockSelectedProfiles.find((p) => p.id === id))?.firstName
    const HOOK_BASE =
      "(Directive système — bulle d'accueil, PAS une vraie conversation. UNE phrase max, vouvoiement, légère et chaleureuse, qui donne envie de taper pour lancer la discussion. Pas de présentation de profil détaillée, pas de question d'interview.) "

    const completed = meetingsList.find(
      (m) => m.status === 'completed' && m.feedbackByMe === undefined,
    )
    const confirmed = meetingsList.find((m) => m.status === 'confirmed')
    const waiting = meetingsList.find(
      (m) => m.status === 'requested_by_me' || m.status === 'waiting_for_other',
    )

    // Tout premier contact de la vie de l'utilisateur avec GIGI → mot de
    // bienvenue chaleureux (présentation), pas une relance.
    const introduced = await getGigiIntroduced()
    let hookMessage =
      HOOK_BASE +
      'Écrivez un appel de phare "découverte", ex : "Prêt à découvrir de nouveaux profils ?".'
    if (!introduced) {
      hookMessage =
        "(Directive système — TOUT PREMIER message de la vie de cette personne avec vous. Présentez-vous chaleureusement, façon \"moi c'est GIGI\", dites avec un enthousiasme sincère que vous êtes son matchmaker et que vous allez apprendre à la connaître pour lui présenter les bonnes personnes. Vouvoyez. 2 phrases max, chaleureux et vivant. AUCUNE mention de tokens, pas de profil encore.)"
      setGigiIntroduced().catch(() => {})
    } else if (completed) {
      const n = resolveName(completed.profileId)
      hookMessage =
        HOOK_BASE +
        `Demandez avec curiosité, comme une amie, comment s'est passé son rendez-vous${n ? ` avec ${n}` : ''}.`
    } else if (confirmed) {
      const n = resolveName(confirmed.profileId)
      hookMessage =
        HOOK_BASE +
        `Évoquez avec un enthousiasme léger son rendez-vous à venir${n ? ` avec ${n}` : ''}.`
    } else if (waiting) {
      const n = resolveName(waiting.profileId)
      hookMessage =
        HOOK_BASE +
        `Glissez que vous attendez encore la réponse${n ? ` de ${n}` : ''}, et proposez d'en voir d'autres en attendant.`
    }

    askMatchmaker({
      message: hookMessage,
      userContext: {
        firstName: profile.firstName,
        tokens: balance,
      },
      profiles: candidates.slice(0, 3),
    })
      .then((reply) => {
        if (!reply) return
        const withLia: ConversationState = {
          ...fresh,
          events: fresh.events.map((e) =>
            e.kind === 'matchmaker_message' && e.tone === 'opening'
              ? { ...e, text: reply }
              : e,
          ),
        }
        setState(withLia)
        saveConversation(withLia).catch(() => {})
      })
      .catch(() => {})
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
      // conversation pour ne pas perdre l'ordre/contenu de la sélection.
      getTokens().then(setTokens).catch(() => {})

      // Refresh meetings — l'utilisateur peut avoir confirmé / décliné
      // une rencontre depuis /meeting/* et on veut que le feed reflète
      // ces changements quand il revient sur l'accueil.
      getMeetings().then(setMeetings).catch(() => {})
      // Refresh passed profiles — l'utilisateur peut avoir tapé « Pas
      // pour moi » sur /matches/[id], la liste « Mes intros » doit
      // immédiatement exclure ce profil.
      getPassedProfiles().then(setPassedProfileIds).catch(() => {})

      // La photo d'avatar du header peut avoir été modifiée dans
      // profile/edit-photos — on relit à chaque focus.
      getKolmiProfile()
        .then((p: KolmiProfile) => setProfilePhoto(p.photoUrls?.[0]))
        .catch(() => {})

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
            saveConversation(next).catch(() => {})
            return next
          })
          // Update local meetings list so the new request shows up
          // immediately in « Mes rencontres ».
          getMeetings().then(setMeetings).catch(() => {})
        } catch {
          // Au pire, on laisse l'utilisateur réessayer — pas de signal
          // utile à pousser ici.
          setPendingProfileId(null)
        }
      })()
    }, [load, pendingProfileId]),
  )

  const handleProfileTap = useCallback(
    (profileId: string) => router.push(`/matches/${profileId}`),
    [router],
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

  // ─── Dérivés pour le feed ───────────────────────────────────────────
  // « Mes intros » = profils du jour pas encore décidés (ni request, ni
  // pass) et qui n'ont pas non plus été passés depuis /matches/[id].
  const decidedFromEvents = new Set(
    state?.events
      .filter((e): e is Extract<TimelineEvent, { kind: 'user_decision' }> => e.kind === 'user_decision')
      .map((e) => e.profileId) ?? [],
  )
  const passedSet = new Set(passedProfileIds)
  // On filtre aussi les profils pour lesquels un meeting est en cours
  // (request envoyée mais user_decision pas encore patché par focus).
  const meetingProfileIds = new Set(
    meetings.filter((m) => m.status !== 'declined').map((m) => m.profileId),
  )
  const introProfiles = profilesRef.current.filter(
    (p) =>
      !decidedFromEvents.has(p.id) &&
      !passedSet.has(p.id) &&
      !meetingProfileIds.has(p.id),
  )

  // Greeting du matchmaker — premier message d'ouverture dans la
  // conversation du jour. Si rien (cas edge), fallback générique.
  const openingMessage = state?.events.find(
    (e): e is Extract<TimelineEvent, { kind: 'matchmaker_message' }> =>
      e.kind === 'matchmaker_message',
  )
  const openingText =
    openingMessage?.text ?? 'Voici votre sélection du jour.'
  const openingTime = formatHourMinute(openingMessage?.at)

  // Rencontres en cours — actives = ni declined ni completed.
  const activeMeetings = meetings.filter(
    (m) => m.status !== 'declined' && m.status !== 'completed',
  )

  // Partage natif — inviter des amis sur Kolmi.
  const handleShareApp = async () => {
    try {
      await Share.share({
        message:
          "Je suis sur Kolmi — un matchmaker te présente des gens vraiment choisis, pas de swipe à l'infini. Rejoins-moi : https://kolmi.app",
      })
    } catch {
      // L'utilisateur a annulé le partage — rien à faire.
    }
  }

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header : avatar profil (gauche) — wordmark kolmi (centre) —
            icône Rencontres (droite). Le pill tokens a migré dans le
            tab profil. */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
            style={styles.avatarButton}
            hitSlop={10}
            accessibilityLabel="Mon profil"
            accessibilityRole="button"
          >
            {profilePhoto ? (
              <Image
                source={{ uri: profilePhoto }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 12.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM4.5 20c0-3.5 3.36-6.25 7.5-6.25S19.5 16.5 19.5 20"
                    stroke={kolmiColors.text}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    fill="none"
                  />
                </Svg>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.wordmarkSlot} pointerEvents="none">
            <KolmiWordmark size={28} color={kolmiColors.accent} />
          </View>

          <TouchableOpacity
            onPress={handleShareApp}
            activeOpacity={0.7}
            style={styles.headerIconButton}
            hitSlop={10}
            accessibilityLabel="Inviter des amis sur Kolmi"
            accessibilityRole="button"
          >
            {/* Icône partage — trois nœuds reliés (inviter des gens). */}
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Circle cx={6} cy={12} r={2.6} stroke={kolmiColors.text} strokeWidth={1.6} fill="none" />
              <Circle cx={18} cy={6} r={2.6} stroke={kolmiColors.text} strokeWidth={1.6} fill="none" />
              <Circle cx={18} cy={18} r={2.6} stroke={kolmiColors.text} strokeWidth={1.6} fill="none" />
              <Path d="M8.3 10.8 L15.7 7.2 M8.3 13.2 L15.7 16.8" stroke={kolmiColors.text} strokeWidth={1.6} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Carte matchmaker — l'IA comme entité passive, pas comme
              chat actif. Avatar à gauche, mot du jour à droite. */}
          {state && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/matchmaker-chat',
                  params: { opening: openingText ?? '' },
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Discuter avec GIGI"
            >
            <Animated.View
              entering={FadeInUp.duration(kolmiMotion.duration.lg).easing(
                kolmiMotion.easing.soft,
              )}
              style={styles.matchmakerCard}
            >
              <View style={styles.matchmakerAvatar}>
                <Image
                  source={require('../../assets/gigi-avatar.png')}
                  style={styles.matchmakerAvatarImg}
                  contentFit="cover"
                />
              </View>
              <View style={styles.matchmakerBody}>
                <View style={styles.matchmakerHeaderRow}>
                  <Text style={styles.matchmakerName}>GIGI</Text>
                  {openingTime && (
                    <Text style={styles.matchmakerTime}>{openingTime}</Text>
                  )}
                </View>
                <Text style={styles.matchmakerText}>{openingText}</Text>
              </View>
            </Animated.View>
            </Pressable>
          )}

          {/* Section « Mes intros » — profils du jour non décidés. */}
          {introProfiles.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Mes intros</Text>
              <View style={styles.list}>
                {introProfiles.map((profile, i) => (
                  <ProfileRow
                    key={profile.id}
                    profile={profile}
                    index={i}
                    onPress={() => handleProfileTap(profile.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Section « Mes rencontres » — meetings actifs. */}
          {activeMeetings.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Mes rencontres</Text>
              <View style={styles.list}>
                {activeMeetings.map((meeting, i) => {
                  const profile =
                    profilesRef.current.find((p) => p.id === meeting.profileId) ??
                    mockSelectedProfiles.find((p) => p.id === meeting.profileId)
                  if (!profile) return null
                  return (
                    <MeetingRow
                      key={meeting.id}
                      profile={profile}
                      meeting={meeting}
                      index={i}
                      onPress={() => {
                        if (meeting.status === 'confirmed') {
                          router.push(`/meeting/confirm/${meeting.id}`)
                        } else if (
                          meeting.status === 'accepted_waiting_slots' ||
                          meeting.status === 'slots_submitted'
                        ) {
                          router.push(`/meeting/schedule/${meeting.id}`)
                        } else {
                          router.push(`/matches/${profile.id}`)
                        }
                      }}
                    />
                  )
                })}
              </View>
            </View>
          )}

          {/* Empty state — le user a tout décidé et n'a pas de rencontre
              en cours. Petit mot du matchmaker pour ne pas laisser de
              vide. */}
          {state &&
            introProfiles.length === 0 &&
            activeMeetings.length === 0 && (
              <Animated.View
                entering={FadeInUp.delay(120)
                  .duration(kolmiMotion.duration.lg)
                  .easing(kolmiMotion.easing.soft)}
                style={styles.emptyState}
              >
                <Text style={styles.emptyKicker}>Plus tard</Text>
                <Text style={styles.emptyTitle}>
                  La sélection est complète pour aujourd'hui.
                </Text>
                <Text style={styles.emptyBody}>
                  GIGI reprend demain. En attendant, vous pouvez
                  relire vos rencontres en cours.
                </Text>
              </Animated.View>
            )}
        </ScrollView>

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
              <Text style={styles.modalKicker}>Pas pressé</Text>
              <Text style={styles.modalTitle}>Cette personne mérite un token.</Text>
              <Text style={styles.modalBody}>
                Vous êtes à zéro pour l'instant. Choisissez votre rythme — un seul token suffit pour ouvrir la prochaine conversation.
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
                  <Text style={styles.modalConfirmText}>Choisir mon rythme</Text>
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
  headerIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkSlot: {
    // Le wordmark a beaucoup de padding interne (paddingTop = 0.45 *
    // size pour gérer l'overhang du script). On compense avec un
    // marginTop négatif pour centrer visuellement avec les boutons.
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -12,
    marginBottom: -4,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: kolmiColors.outline,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: kolmiColors.surfaceSoft,
  },

  // ─── Feed scrollable ────────────────────────────────────────────────
  feedContent: {
    paddingHorizontal: kolmiPaddingX,
    paddingBottom: kolmiSpace.xxxl,
    gap: kolmiSpace.xl,
  },

  // ─── Carte matchmaker — feel iOS notification ────────────────────────
  // Fond clair surélevé, radius doux, hairline + ombre légère pour
  // l'impression "un ami vient de m'écrire, je vois sa notif".
  matchmakerCard: {
    flexDirection: 'row',
    gap: kolmiSpace.md,
    alignItems: 'flex-start',
    padding: kolmiSpace.md,
    borderRadius: kolmiRadius.lg,
    backgroundColor: '#FAF8F5',
    borderWidth: 0.6,
    borderColor: 'rgba(22,19,15,0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  matchmakerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16130F',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  matchmakerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  matchmakerBody: {
    flex: 1,
    gap: 6,
  },
  matchmakerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  matchmakerName: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 14,
    color: kolmiColors.text,
    letterSpacing: 0.2,
  },
  matchmakerTime: {
    fontFamily: kolmiFonts.ui,
    fontSize: 11,
    color: kolmiColors.textMuted,
    letterSpacing: 0.3,
  },
  matchmakerText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    lineHeight: 22,
    color: kolmiColors.textBody,
  },

  // ─── Sections "Mes intros" / "Mes rencontres" ───────────────────────
  section: {
    gap: kolmiSpace.sm,
  },
  sectionLabel: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 11,
    color: kolmiColors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  list: {
    gap: kolmiSpace.sm,
  },

  // ─── Ligne profil (intro) ───────────────────────────────────────────
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: kolmiSpace.md,
    padding: kolmiSpace.sm,
    borderRadius: kolmiRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(22,19,15,0.12)',
    backgroundColor: '#FAF8F5',
  },
  rowAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: kolmiColors.surfaceSoft,
  },
  rowAvatarImage: {
    width: '100%',
    height: '100%',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontFamily: kolmiFonts.serif,
    fontSize: fontScale(18),
    color: kolmiColors.text,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  rowMeta: {
    fontFamily: kolmiFonts.ui,
    fontSize: 12,
    color: kolmiColors.textBody,
    lineHeight: 16,
  },
  rowMaison: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 12,
    color: kolmiColors.accent,
    lineHeight: 16,
  },
  rowStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: kolmiRadius.pill,
    borderWidth: 0.6,
    borderColor: kolmiColors.outline,
  },
  rowStatusText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: kolmiColors.textSecondary,
    textTransform: 'uppercase',
  },

  // ─── Empty state ────────────────────────────────────────────────────
  emptyState: {
    paddingVertical: kolmiSpace.xxl,
    paddingHorizontal: kolmiSpace.sm,
    gap: kolmiSpace.sm,
  },
  emptyKicker: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 11,
    color: kolmiColors.textMuted,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  emptyTitle: {
    fontFamily: kolmiFonts.serif,
    fontSize: 22,
    color: kolmiColors.text,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  emptyBody: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 14,
    color: kolmiColors.textBody,
    lineHeight: 20,
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

// ─── Helpers ──────────────────────────────────────────────────────────

function formatHourMinute(iso: string | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

// ─── Sous-composants : lignes du feed ─────────────────────────────────

type SelectedProfile = (typeof mockSelectedProfiles)[number]

function ProfileRow({
  profile,
  index,
  onPress,
}: {
  profile: SelectedProfile
  index: number
  onPress: () => void
}) {
  const photo = profile.photoUrls?.[0] ?? profile.photoUrl
  return (
    <Animated.View
      entering={FadeInUp.delay(staggerDelay(index, 60))
        .duration(kolmiMotion.duration.md)
        .easing(kolmiMotion.easing.soft)}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={styles.rowCard}
        accessibilityRole="button"
        accessibilityLabel={`Découvrir ${profile.firstName}`}
      >
        <View style={styles.rowAvatar}>
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={styles.rowAvatarImage}
              contentFit="cover"
              transition={200}
            />
          ) : null}
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowName} numberOfLines={1}>
            {profile.firstName}, {profile.age}
          </Text>
          <Text style={styles.rowMaison} numberOfLines={1}>
            {profile.dnaLabel}
          </Text>
          {(profile.occupation || profile.city) && (
            <Text style={styles.rowMeta} numberOfLines={1}>
              {[profile.occupation, profile.city].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function MeetingRow({
  profile,
  meeting,
  index,
  onPress,
}: {
  profile: SelectedProfile
  meeting: Meeting
  index: number
  onPress: () => void
}) {
  const photo = profile.photoUrls?.[0] ?? profile.photoUrl
  const statusLabel = meetingStatusLabel(meeting.status)
  return (
    <Animated.View
      entering={FadeInUp.delay(staggerDelay(index, 60))
        .duration(kolmiMotion.duration.md)
        .easing(kolmiMotion.easing.soft)}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={styles.rowCard}
        accessibilityRole="button"
        accessibilityLabel={`Rencontre avec ${profile.firstName} — ${statusLabel}`}
      >
        <View style={styles.rowAvatar}>
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={styles.rowAvatarImage}
              contentFit="cover"
              transition={200}
            />
          ) : null}
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowName} numberOfLines={1}>
            {profile.firstName}, {profile.age}
          </Text>
          <Text style={styles.rowMaison} numberOfLines={1}>
            {profile.dnaLabel}
          </Text>
        </View>
        <View style={styles.rowStatusPill}>
          <Text style={styles.rowStatusText}>{statusLabel}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function meetingStatusLabel(status: Meeting['status']): string {
  switch (status) {
    case 'requested_by_me':
      return 'Demandé'
    case 'waiting_for_other':
      return 'En attente'
    case 'accepted_waiting_slots':
      return 'Choisir créneaux'
    case 'slots_submitted':
      return 'Proposé'
    case 'confirmed':
      return 'Confirmé'
    case 'completed':
      return 'Terminé'
    case 'declined':
      return 'Décliné'
    case 'expired':
      return 'Expiré'
    default:
      return status
  }
}
