import React, { useEffect, useState, useCallback } from 'react'
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native'
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import SwipeToConfirm from '@/components/kolmi/SwipeToConfirm'
import {
  addTokens,
  getTokens,
  getSubscription,
  setSubscription,
  markPurchased,
  type KolmiSubscription,
} from '@/lib/kolmi/storage'
import { select } from '@/lib/kolmi/haptics'

// ─── Données — deux formules ────────────────────────────────────────

type Pack = {
  id: string
  tokens: number
  priceLabel: string
  unitPriceLabel?: string
  tagline: string
  highlight?: boolean
}

const PACKS: Pack[] = [
  {
    id: 'token-unite',
    tokens: 1,
    priceLabel: '15 €',
    tagline: 'Une demande, à la pièce.',
  },
  {
    id: 'pack-trois',
    tokens: 3,
    priceLabel: '39 €',
    unitPriceLabel: '13 € / token',
    tagline: 'Trois rencontres choisies.',
    highlight: true,
  },
  {
    id: 'pack-dix',
    tokens: 10,
    priceLabel: '100 €',
    unitPriceLabel: '10 € / token',
    tagline: 'Pour qui prend le temps.',
  },
]

const SUBSCRIPTION_PRICE = '60 € / mois'
const SUBSCRIPTION_TOKENS = 5

type Formula = 'a-la-carte' | 'abonnement'

// ─── Écran ──────────────────────────────────────────────────────────

export default function PremiumScreen() {
  const router = useRouter()
  const [balance, setBalance] = useState<number | null>(null)
  const [subscription, setSubState] = useState<KolmiSubscription | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [formula, setFormula] = useState<Formula>('a-la-carte')

  useEffect(() => {
    Promise.all([getTokens(), getSubscription()])
      .then(([t, s]) => {
        setBalance(t)
        setSubState(s)
      })
      .catch((err) => {
        console.warn('[kolmi] premium load failed', err)
        setBalance(0)
      })
  }, [])

  const onPurchasePack = useCallback(
    async (pack: Pack) => {
      if (submittingId) return
      setSubmittingId(pack.id)
      try {
        const next = await addTokens(pack.tokens)
        await markPurchased()
        setBalance(next)
        Alert.alert(
          'Tokens crédités',
          `+${pack.tokens} token${pack.tokens > 1 ? 's' : ''}. Solde : ${next}.\n\nBêta privée — aucun paiement n'a été effectué.`,
          [{ text: 'Parfait', onPress: () => router.back() }],
        )
      } catch (err) {
        console.warn('[kolmi] addTokens failed', err)
        Alert.alert(
          'Crédit impossible',
          "Vos tokens n'ont pas pu être crédités. Réessayez dans un instant.",
        )
      } finally {
        setSubmittingId(null)
      }
    },
    [submittingId, router],
  )

  const onSubscribe = useCallback(async () => {
    if (submittingId) return
    setSubmittingId('abonnement')
    try {
      const now = new Date().toISOString()
      const sub = await setSubscription({
        isActive: true,
        startedAt: now,
        lastTokenGrant: now,
      })
      const nextBalance = await addTokens(SUBSCRIPTION_TOKENS)
      await markPurchased()
      setSubState(sub)
      setBalance(nextBalance)
      Alert.alert(
        'Abonnement actif',
        `+${SUBSCRIPTION_TOKENS} tokens crédités. Profils par jour : illimités.\n\nBêta privée — aucun paiement n'a été effectué.`,
        [{ text: 'Parfait', onPress: () => router.back() }],
      )
    } catch (err) {
      console.warn('[kolmi] subscribe failed', err)
      Alert.alert(
        'Souscription impossible',
        "L'abonnement n'a pas pu être activé. Réessayez dans un instant.",
      )
    } finally {
      setSubmittingId(null)
    }
  }, [submittingId, router])

  const onUnsubscribe = useCallback(() => {
    Alert.alert(
      'Résilier ?',
      "Vos tokens restants ne sont pas reprises. Vous pourrez vous réabonner plus tard.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Résilier',
          style: 'destructive',
          onPress: async () => {
            try {
              const sub = await setSubscription({ isActive: false })
              setSubState(sub)
            } catch (err) {
              console.warn('[kolmi] unsubscribe failed', err)
            }
          },
        },
      ],
    )
  }, [])

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backBtn}
            accessibilityLabel="Retour"
            accessibilityRole="button"
          >
            <Svg width={10} height={18} viewBox="0 0 10 18" fill="none">
              <Path
                d="M9 1L1 9L9 17"
                stroke={kolmiColors.text}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerKicker}>Tokens</Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.Text entering={FadeIn.duration(420)} style={styles.title}>
            Choisissez votre rythme.
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(180).duration(500)}
            style={styles.subtitle}
          >
            La rareté est volontaire. Deux façons d'avancer.
          </Animated.Text>

          {balance !== null && (
            <Animated.Text
              entering={FadeIn.delay(360).duration(500)}
              style={styles.balance}
            >
              Solde actuel : {balance} token{balance > 1 ? 's' : ''}
              {subscription?.isActive ? ' · Abonné' : ''}.
            </Animated.Text>
          )}

          <FormulaSegmented value={formula} onChange={setFormula} />

          {formula === 'a-la-carte' ? (
            <View style={styles.packsList}>
              {PACKS.map((pack, i) => (
                <Animated.View
                  key={pack.id}
                  entering={FadeInDown.delay(120 + i * 110).duration(460)}
                  style={[styles.pack, pack.highlight && styles.packHighlight]}
                >
                  {pack.highlight && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Le plus choisi</Text>
                    </View>
                  )}
                  <View style={styles.packHead}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.packTokens}>
                        {pack.tokens} token{pack.tokens > 1 ? 's' : ''}
                      </Text>
                      <Text style={styles.packTagline}>{pack.tagline}</Text>
                      {pack.unitPriceLabel && (
                        <Text style={styles.packUnit}>{pack.unitPriceLabel}</Text>
                      )}
                    </View>
                    <Text style={styles.packPrice}>{pack.priceLabel}</Text>
                  </View>

                  <SwipeToConfirm
                    label={
                      submittingId === pack.id
                        ? 'Crédit…'
                        : 'Glisser pour acheter'
                    }
                    confirmedLabel="Acheté."
                    onConfirm={() => onPurchasePack(pack)}
                    disabled={submittingId !== null}
                  />
                </Animated.View>
              ))}
            </View>
          ) : (
            <Animated.View
              entering={FadeInDown.duration(460)}
              style={[styles.pack, styles.subscriptionCard]}
            >
              <View style={styles.subBadge}>
                <Text style={styles.badgeText}>Formule continue</Text>
              </View>

              <View style={styles.subTitleRow}>
                <Text style={styles.subTitle}>Abonnement KOLMI</Text>
                <Text style={styles.subPrice}>{SUBSCRIPTION_PRICE}</Text>
              </View>

              <View style={styles.subRule} />

              <SubBullet
                kicker="01"
                text={`${SUBSCRIPTION_TOKENS} tokens chaque mois`}
              />
              <SubBullet
                kicker="02"
                text="Profils proposés chaque jour : illimités"
              />
              <SubBullet
                kicker="03"
                text="Priorité éditoriale du matchmaker"
              />

              {subscription?.isActive ? (
                <View style={{ gap: kolmiSpace.sm, marginTop: kolmiSpace.md }}>
                  <View style={styles.activePill}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>Abonnement actif</Text>
                  </View>
                  <TouchableOpacity
                    onPress={onUnsubscribe}
                    activeOpacity={0.7}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelText}>Résilier l'abonnement</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginTop: kolmiSpace.md }}>
                  <SwipeToConfirm
                    label={
                      submittingId === 'abonnement'
                        ? 'Activation…'
                        : 'Glisser pour souscrire'
                    }
                    confirmedLabel="Abonné."
                    onConfirm={onSubscribe}
                    disabled={submittingId !== null}
                  />
                </View>
              )}
            </Animated.View>
          )}

          <Text style={styles.disclaimer}>
            Bêta privée — les paiements ne sont pas réels. Tokens et
            abonnement sont stockés localement pour test.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────

function FormulaSegmented({
  value,
  onChange,
}: {
  value: Formula
  onChange: (next: Formula) => void
}) {
  // Indicateur bordeaux qui glisse entre les 2 segments. Width 50 %,
  // translateX 0 ou 100 % selon la sélection.
  const progress = useSharedValue(value === 'a-la-carte' ? 0 : 1)

  useEffect(() => {
    progress.value = withSpring(value === 'a-la-carte' ? 0 : 1, {
      damping: 18,
      stiffness: 180,
    })
  }, [value, progress])

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${progress.value * 100}%` }],
  }))

  const handle = (next: Formula) => {
    if (next !== value) {
      select()
      onChange(next)
    }
  }

  return (
    <View style={styles.segmentsWrap}>
      <View style={styles.segmentsTrack}>
        <Animated.View style={[styles.segmentsIndicator, indicatorStyle]} />
        <TouchableOpacity
          style={styles.segmentBtn}
          activeOpacity={0.85}
          onPress={() => handle('a-la-carte')}
        >
          <Text
            style={[
              styles.segmentText,
              value === 'a-la-carte' && styles.segmentTextActive,
            ]}
          >
            À la carte
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.segmentBtn}
          activeOpacity={0.85}
          onPress={() => handle('abonnement')}
        >
          <Text
            style={[
              styles.segmentText,
              value === 'abonnement' && styles.segmentTextActive,
            ]}
          >
            Abonnement
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function SubBullet({ kicker, text }: { kicker: string; text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletKicker}>{kicker}</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.xs,
    paddingBottom: kolmiSpace.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerKicker: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textMuted,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.lg,
    paddingBottom: kolmiSpace.xxxl,
  },
  title: {
    fontFamily: kolmiFonts.serif,
    fontSize: 32,
    color: kolmiColors.text,
    lineHeight: 38,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 17,
    lineHeight: 25,
    color: kolmiColors.textBody,
    marginTop: kolmiSpace.xs,
  },
  balance: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 12,
    color: kolmiColors.textMuted,
    letterSpacing: 0.4,
    marginTop: kolmiSpace.lg,
  },

  // Segmented control
  segmentsWrap: {
    marginTop: kolmiSpace.xl,
    marginBottom: kolmiSpace.md,
  },
  segmentsTrack: {
    flexDirection: 'row',
    backgroundColor: '#F1EBE0',
    borderRadius: kolmiRadius.pill,
    padding: 4,
    position: 'relative',
  },
  segmentsIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    width: '50%',
    backgroundColor: kolmiColors.bg,
    borderRadius: kolmiRadius.pill,
    shadowColor: '#5A0A0A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 13,
    color: kolmiColors.textMuted,
    letterSpacing: 0.4,
  },
  segmentTextActive: {
    fontFamily: kolmiFonts.uiSemiBold,
    color: kolmiColors.text,
  },

  // Packs (à la carte)
  packsList: {
    gap: kolmiSpace.lg,
    marginTop: kolmiSpace.sm,
  },
  pack: {
    backgroundColor: '#FAF8F5',
    borderRadius: kolmiRadius.lg,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    padding: kolmiSpace.lg,
    gap: kolmiSpace.md,
    position: 'relative',
  },
  packHighlight: {
    borderColor: kolmiColors.accent,
    borderWidth: 1.5,
    backgroundColor: '#FFFAF4',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: kolmiSpace.lg,
    backgroundColor: kolmiColors.accent,
    paddingHorizontal: kolmiSpace.sm,
    paddingVertical: 4,
    borderRadius: kolmiRadius.pill,
  },
  badgeText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 10,
    color: kolmiColors.white,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  packHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: kolmiSpace.md,
  },
  packTokens: {
    fontFamily: kolmiFonts.serif,
    fontSize: 28,
    color: kolmiColors.text,
    letterSpacing: -0.4,
  },
  packTagline: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 14,
    color: kolmiColors.accent,
    marginTop: 4,
  },
  packUnit: {
    fontFamily: kolmiFonts.ui,
    fontSize: 12,
    color: kolmiColors.textMuted,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  packPrice: {
    fontFamily: kolmiFonts.serif,
    fontSize: 26,
    color: kolmiColors.text,
    letterSpacing: -0.4,
  },

  // Subscription
  subscriptionCard: {
    marginTop: kolmiSpace.sm,
    borderColor: kolmiColors.accent,
    borderWidth: 1.2,
  },
  subBadge: {
    position: 'absolute',
    top: -10,
    left: kolmiSpace.lg,
    backgroundColor: kolmiColors.text,
    paddingHorizontal: kolmiSpace.sm,
    paddingVertical: 4,
    borderRadius: kolmiRadius.pill,
  },
  subTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: kolmiSpace.md,
    marginTop: kolmiSpace.xs,
  },
  subTitle: {
    fontFamily: kolmiFonts.serif,
    fontSize: 26,
    color: kolmiColors.text,
    letterSpacing: -0.4,
    flex: 1,
  },
  subPrice: {
    fontFamily: kolmiFonts.serif,
    fontSize: 20,
    color: kolmiColors.accent,
    letterSpacing: -0.2,
  },
  subRule: {
    height: 0.6,
    backgroundColor: 'rgba(139,26,26,0.35)',
    width: 48,
    marginTop: kolmiSpace.xs,
    marginBottom: kolmiSpace.sm,
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: kolmiSpace.md,
    paddingVertical: 6,
  },
  bulletKicker: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 10,
    color: kolmiColors.accent,
    letterSpacing: 1.6,
    paddingTop: 4,
  },
  bulletText: {
    flex: 1,
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    color: kolmiColors.text,
    lineHeight: 22,
  },

  // Active subscription state
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: kolmiSpace.md,
    paddingVertical: 10,
    borderRadius: kolmiRadius.pill,
    backgroundColor: kolmiColors.accent,
    alignSelf: 'flex-start',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: kolmiColors.white,
  },
  activeText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 12,
    color: kolmiColors.white,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cancelBtn: {
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  cancelText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 13,
    color: kolmiColors.textMuted,
    textDecorationLine: 'underline',
  },

  disclaimer: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 12,
    color: kolmiColors.textMuted,
    textAlign: 'center',
    marginTop: kolmiSpace.xl,
    lineHeight: 18,
    paddingHorizontal: kolmiSpace.lg,
  },
})
