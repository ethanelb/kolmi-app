import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated'
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
import { addTokens, getTokens } from '@/lib/kolmi/storage'
import { kolmiMotion, staggerDelay } from '@/lib/kolmi/motion'

type Pack = {
  id: string
  name: string
  tokens: number
  perks: string[]
  highlight?: boolean
}

const packs: Pack[] = [
  {
    id: 'decouverte',
    name: 'Découverte',
    tokens: 3,
    perks: ['3 demandes de rencontre', 'Lecture de votre Maison'],
  },
  {
    id: 'serieux',
    name: 'Sérieux',
    tokens: 8,
    perks: [
      '8 demandes de rencontre',
      'Sélection priorisée par le matchmaker',
      'Lecture détaillée de votre Maison',
    ],
    highlight: true,
  },
  {
    id: 'concierge',
    name: 'Concierge',
    tokens: 20,
    perks: [
      '20 demandes de rencontre',
      'Lieux confidentiels (hôtels particuliers, clubs privés)',
      'Accompagnement personnalisé du matchmaker',
    ],
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

  const onPurchase = async (pack: Pack) => {
    if (submittingId) return
    setSubmittingId(pack.id)
    try {
      // Bêta privée : aucun paiement réel. On crédite localement les tokens
      // pour permettre de tester le flow rencontre. À remplacer par un
      // checkout serveur (Stripe) avant la sortie publique.
      const next = await addTokens(pack.tokens)
      setBalance(next)
      Alert.alert(
        'Tokens de test crédités',
        `+${pack.tokens} token${pack.tokens > 1 ? 's' : ''}. Solde : ${next}.\n\nAucun paiement n'a été effectué.`,
        [{ text: 'Parfait', onPress: () => router.back() }],
      )
    } catch (err) {
      console.warn('[kolmi] addTokens failed', err)
      Alert.alert(
        'Crédit impossible',
        "Vos tokens n'ont pas pu être crédités. Vérifiez l'espace de stockage de l'appareil et réessayez.",
        [{ text: 'Réessayer' }],
      )
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: kolmiColors.bg }}>
      <GrainOverlay />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View
          style={{
            paddingHorizontal: kolmiPaddingX,
            paddingTop: kolmiSpace.xs,
            paddingBottom: kolmiSpace.sm,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ paddingVertical: 4 }}
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
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: kolmiPaddingX,
            paddingBottom: kolmiSpace.xxxl,
            gap: kolmiSpace.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: kolmiSpace.sm }}>
            <Text
              style={{
                fontFamily: kolmiFonts.uiSemiBold,
                fontSize: 11,
                color: kolmiColors.accent,
                textTransform: 'uppercase',
                letterSpacing: 1.6,
              }}
            >
              Bêta privée · Tokens de test
            </Text>
            <Text
              style={{
                fontFamily: kolmiFonts.serif,
                fontSize: 34,
                color: kolmiColors.text,
                lineHeight: 40,
                letterSpacing: -0.4,
              }}
            >
              Chaque token finance une rencontre organisée pour vous.
            </Text>
            <Text
              style={{
                fontFamily: kolmiFonts.serifItalic,
                fontSize: 16,
                color: kolmiColors.textBody,
                lineHeight: 22,
              }}
            >
              Solde actuel : {balance === null ? '…' : `${balance} token${balance > 1 ? 's' : ''}`}.
            </Text>
            <View
              style={{
                marginTop: kolmiSpace.xs,
                padding: kolmiSpace.sm,
                borderRadius: kolmiRadius.md,
                backgroundColor: kolmiColors.bgDeep,
                borderWidth: 1,
                borderColor: kolmiColors.outline,
              }}
            >
              <Text
                style={{
                  fontFamily: kolmiFonts.ui,
                  fontSize: 13,
                  color: kolmiColors.textBody,
                  lineHeight: 19,
                }}
              >
                Pendant la bêta, les tokens sont simulés. Aucun paiement n&apos;est effectué.
              </Text>
            </View>
          </View>

          <View style={{ gap: kolmiSpace.md, marginTop: kolmiSpace.sm }}>
            {packs.map((pack, i) => (
              <Animated.View
                key={pack.id}
                entering={FadeInDown.delay(staggerDelay(i, 200))
                  .duration(kolmiMotion.duration.lg)
                  .easing(kolmiMotion.easing.soft)}
                style={{
                  borderWidth: pack.highlight ? 1.5 : 1,
                  borderColor: pack.highlight
                    ? kolmiColors.accent
                    : kolmiColors.outline,
                  backgroundColor: pack.highlight
                    ? kolmiColors.bgDeep
                    : '#FAF8F5',
                  borderRadius: kolmiRadius.lg,
                  padding: kolmiSpace.lg,
                  gap: kolmiSpace.sm,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                  }}
                >
                  <View style={{ gap: 2 }}>
                    <Text
                      style={{
                        fontFamily: kolmiFonts.serif,
                        fontSize: 24,
                        color: kolmiColors.text,
                        letterSpacing: -0.3,
                      }}
                    >
                      {pack.name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: kolmiFonts.uiMedium,
                        fontSize: 13,
                        color: kolmiColors.accent,
                        textTransform: 'uppercase',
                        letterSpacing: 1.2,
                      }}
                    >
                      {pack.tokens} tokens
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: kolmiFonts.uiSemiBold,
                      fontSize: 13,
                      color: kolmiColors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: 1.2,
                    }}
                  >
                    Achat simulé
                  </Text>
                </View>

                <View style={{ gap: 6, marginTop: 4 }}>
                  {pack.perks.map((perk, i) => (
                    <View
                      key={`${pack.id}-perk-${i}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: kolmiColors.accent,
                          fontFamily: kolmiFonts.uiSemiBold,
                          fontSize: 14,
                          lineHeight: 21,
                        }}
                      >
                        ·
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: kolmiFonts.ui,
                          fontSize: 14,
                          color: kolmiColors.textBody,
                          lineHeight: 21,
                        }}
                      >
                        {perk}
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => onPurchase(pack)}
                  activeOpacity={0.85}
                  disabled={submittingId !== null}
                  style={{
                    marginTop: kolmiSpace.sm,
                    height: 50,
                    borderRadius: kolmiRadius.pill,
                    backgroundColor: pack.highlight
                      ? kolmiColors.accent
                      : kolmiColors.text,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: submittingId === pack.id ? 0.6 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: kolmiFonts.uiSemiBold,
                      fontSize: 15,
                      color: pack.highlight ? kolmiColors.white : '#FAF8F5',
                      letterSpacing: 0.2,
                    }}
                  >
                    {submittingId === pack.id
                      ? 'Crédit en cours…'
                      : `Créditer ${pack.tokens} tokens de test`}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          <Text
            style={{
              fontFamily: kolmiFonts.serifItalic,
              fontSize: 13,
              color: kolmiColors.textMuted,
              textAlign: 'center',
              marginTop: kolmiSpace.md,
              lineHeight: 19,
            }}
          >
            Bêta privée — les tokens crédités sont des tokens de test, stockés localement sur cet appareil.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
