import React, { useEffect, useState, useCallback } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native'
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  kolmiColors,
  kolmiSpace,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import MatchmakerGreeting from '@/components/kolmi/MatchmakerGreeting'
import SelectedProfileCard from '@/components/kolmi/SelectedProfileCard'
import { mockSelectedProfiles } from '@/data/mockSelectedProfiles'
import { getPassedProfiles, passProfile, getTokens } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'
import { kolmiMotion, staggerDelay } from '@/lib/kolmi/motion'
import { tapMedium, select } from '@/lib/kolmi/haptics'

// Le courrier du jour : 3 profils maximum, choisis par le matchmaker.
// Tap sur la carte → écran détail. Tap sur "Demander" → flow de demande
// (avec gardien sur les tokens). Tap sur "Passer" → le profil disparaît.
const DAILY_LIMIT = 3

const FRENCH_DAYS = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
] as const

const FRENCH_MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const

function formatToday(d: Date): string {
  const day = FRENCH_DAYS[d.getDay()]
  const month = FRENCH_MONTHS[d.getMonth()]
  return `${day} ${d.getDate()} ${month}`
}

export default function SelectionScreen() {
  const router = useRouter()
  const [passed, setPassed] = useState<string[]>([])
  const [tokens, setTokens] = useState<number>(0)
  const [showTokenAlert, setShowTokenAlert] = useState(false)

  const refresh = useCallback(() => {
    getPassedProfiles().then(setPassed)
    getTokens().then(setTokens)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh]),
  )

  // 3 profils max — anti feed infini. Les "isFeatured" sont volontairement
  // exclus du courrier du jour (ils servent ailleurs dans l'app).
  const visible = mockSelectedProfiles
    .filter((p) => !p.isFeatured)
    .filter((p) => !passed.includes(p.id))
    .slice(0, DAILY_LIMIT)

  const handleViewProfile = useCallback(
    (id: string) => router.push(`/matches/${id}`),
    [router],
  )

  const handlePass = useCallback(
    async (profileId: string) => {
      select()
      const ok = await safePersist(() => passProfile(profileId))
      if (!ok) return
      setPassed((prev) => (prev.includes(profileId) ? prev : [...prev, profileId]))
    },
    [],
  )

  const handleRequest = useCallback(
    (profileId: string) => {
      tapMedium()
      if (tokens <= 0) {
        setShowTokenAlert(true)
        return
      }
      router.push(`/meeting/request/${profileId}`)
    },
    [router, tokens],
  )

  const closeTokenAlert = useCallback(() => setShowTokenAlert(false), [])
  const goPremium = useCallback(() => {
    setShowTokenAlert(false)
    router.push('/premium')
  }, [router])

  const todayLabel = formatToday(new Date())

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header éditorial sticky */}
        <Animated.View
          entering={FadeIn.duration(kolmiMotion.duration.lg).easing(kolmiMotion.easing.soft)}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>Le courrier du jour</Text>
              <Text style={styles.dateLabel}>{todayLabel}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/premium')}
              activeOpacity={0.7}
              style={styles.tokenIndicator}
              hitSlop={8}
            >
              <View style={styles.tokenDot} />
              <Text style={styles.tokenCount}>{tokens}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerHairline} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInUp.delay(120)
              .duration(kolmiMotion.duration.lg)
              .easing(kolmiMotion.easing.soft)}
          >
            <MatchmakerGreeting count={visible.length} />
          </Animated.View>

          {visible.length > 0 ? (
            <View style={styles.cardsList}>
              {visible.map((profile, i) => (
                <Animated.View
                  key={profile.id}
                  entering={FadeInDown.delay(staggerDelay(i, 180))
                    .duration(kolmiMotion.duration.lg)
                    .easing(kolmiMotion.easing.soft)}
                  style={styles.cardWrap}
                >
                  <SelectedProfileCard
                    profile={profile}
                    onPress={handleViewProfile}
                  />
                  <View style={styles.ctaRow}>
                    <TouchableOpacity
                      onPress={() => handleRequest(profile.id)}
                      activeOpacity={0.85}
                      style={styles.ctaPrimary}
                    >
                      <Text style={styles.ctaPrimaryText}>Demander un rendez-vous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handlePass(profile.id)}
                      activeOpacity={0.7}
                      style={styles.ctaSecondary}
                    >
                      <Text style={styles.ctaSecondaryText}>Passer</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : (
            <EmptyState onSeePast={() => router.push('/(tabs)/discover')} />
          )}
        </ScrollView>

        {/* Modal "rareté" — 0 tokens */}
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

function EmptyState({ onSeePast }: { onSeePast: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyOrnament} />
      <Text style={styles.emptyTitle}>Vos prochains envois demain matin.</Text>
      <Text style={styles.emptyBody}>
        Le matchmaker prépare déjà votre prochaine sélection.
      </Text>
      <TouchableOpacity
        onPress={onSeePast}
        activeOpacity={0.7}
        style={styles.emptyCta}
        hitSlop={8}
      >
        <Text style={styles.emptyCtaText}>Voir mes envois passés</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.sm,
    paddingBottom: kolmiSpace.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textMuted,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dateLabel: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 18,
    color: kolmiColors.text,
    letterSpacing: -0.2,
  },
  tokenIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tokenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: kolmiColors.accent,
  },
  tokenCount: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 14,
    color: kolmiColors.text,
    letterSpacing: 0.4,
  },
  headerHairline: {
    height: 0.6,
    backgroundColor: 'rgba(26,26,26,0.18)',
    marginTop: kolmiSpace.sm,
  },
  scrollContent: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.lg,
    paddingBottom: kolmiSpace.xxxl,
    gap: kolmiSpace.lg,
  },
  cardsList: {
    gap: kolmiSpace.xl,
    marginTop: kolmiSpace.sm,
  },
  cardWrap: {
    gap: kolmiSpace.sm,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: kolmiSpace.xs,
  },
  ctaPrimary: {
    flex: 1,
    height: 48,
    borderRadius: kolmiRadius.pill,
    backgroundColor: kolmiColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: kolmiSpace.md,
    shadowColor: '#5A0A0A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  ctaPrimaryText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 14,
    color: kolmiColors.white,
    letterSpacing: 0.2,
  },
  ctaSecondary: {
    paddingHorizontal: kolmiSpace.lg,
    height: 48,
    borderRadius: kolmiRadius.pill,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSecondaryText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 14,
    color: kolmiColors.text,
  },

  // ─── Empty state ────────────────────────────────────────────
  emptyWrap: {
    marginTop: kolmiSpace.xxxl,
    alignItems: 'center',
    paddingHorizontal: kolmiSpace.lg,
    gap: kolmiSpace.sm,
  },
  emptyOrnament: {
    width: 48,
    height: 0.8,
    backgroundColor: kolmiColors.accent,
    marginBottom: kolmiSpace.md,
  },
  emptyTitle: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 22,
    color: kolmiColors.text,
    lineHeight: 28,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 12,
    color: kolmiColors.textMuted,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: kolmiSpace.lg,
    paddingHorizontal: kolmiSpace.md,
    paddingVertical: kolmiSpace.xs,
  },
  emptyCtaText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 13,
    color: kolmiColors.accent,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // ─── Modal "rareté" ─────────────────────────────────────────
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
