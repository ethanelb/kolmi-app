import React, { useEffect, useState, useCallback } from 'react'
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
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
import { addTokens, getTokens } from '@/lib/kolmi/storage'

type Pack = {
  id: string
  tokens: number
  price: string
  tagline: string
  highlight?: boolean
}

const PACKS: Pack[] = [
  {
    id: 'mois-calme',
    tokens: 3,
    price: '9 €',
    tagline: 'Un mois calme',
  },
  {
    id: 'rythme-regulier',
    tokens: 10,
    price: '25 €',
    tagline: 'Le rythme régulier',
    highlight: true,
  },
  {
    id: 'annee-editoriale',
    tokens: 25,
    price: '55 €',
    tagline: "L'année éditoriale",
  },
]

export default function PremiumScreen() {
  const router = useRouter()
  const [balance, setBalance] = useState<number | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  useEffect(() => {
    getTokens()
      .then(setBalance)
      .catch((err) => {
        console.warn('[kolmi] getTokens failed', err)
        setBalance(0)
      })
  }, [])

  const onPurchase = useCallback(
    async (pack: Pack) => {
      if (submittingId) return
      setSubmittingId(pack.id)
      try {
        // Bêta privée : aucun paiement réel. On crédite localement les
        // tokens pour permettre de tester le flow rencontre.
        const next = await addTokens(pack.tokens)
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

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
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
          <Animated.Text
            entering={FadeIn.duration(420)}
            style={styles.title}
          >
            Plus de tokens.
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(180).duration(500)}
            style={styles.subtitle}
          >
            La rareté est volontaire. Achetez votre prochain élan.
          </Animated.Text>

          {balance !== null && (
            <Animated.Text
              entering={FadeIn.delay(360).duration(500)}
              style={styles.balance}
            >
              Solde actuel : {balance} token{balance > 1 ? 's' : ''}.
            </Animated.Text>
          )}

          <View style={styles.packsList}>
            {PACKS.map((pack, i) => (
              <Animated.View
                key={pack.id}
                entering={FadeInDown.delay(500 + i * 130).duration(500)}
                style={[
                  styles.pack,
                  pack.highlight && styles.packHighlight,
                ]}
              >
                {pack.highlight && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Le plus choisi</Text>
                  </View>
                )}
                <View style={styles.packHead}>
                  <View>
                    <Text style={styles.packTokens}>
                      {pack.tokens} token{pack.tokens > 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.packTagline}>{pack.tagline}</Text>
                  </View>
                  <Text style={styles.packPrice}>{pack.price}</Text>
                </View>

                <SwipeToConfirm
                  label={
                    submittingId === pack.id ? 'Crédit…' : 'Glisser pour acheter'
                  }
                  confirmedLabel="Acheté."
                  onConfirm={() => onPurchase(pack)}
                  disabled={submittingId !== null}
                />
              </Animated.View>
            ))}
          </View>

          <Text style={styles.disclaimer}>
            Bêta privée — les tokens crédités sont des tokens de test, stockés localement.
          </Text>
        </ScrollView>
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
  packsList: {
    gap: kolmiSpace.lg,
    marginTop: kolmiSpace.xl,
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
  packPrice: {
    fontFamily: kolmiFonts.serif,
    fontSize: 26,
    color: kolmiColors.text,
    letterSpacing: -0.4,
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
