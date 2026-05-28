import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
  fontScale,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import DnaReveal from '@/components/kolmi/DnaReveal'
import { getKolmiDnaResult } from '@/lib/kolmi/storage'
import type { KolmiDnaResult } from '@/lib/kolmi/types'

export default function MatchmakerResultScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ instant?: string }>()
  const [result, setResult] = useState<KolmiDnaResult | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getKolmiDnaResult()
      .then(setResult)
      .finally(() => setLoaded(true))
  }, [])

  const isRevisit = params.instant === '1'
  const handleContinue = () => {
    if (isRevisit) {
      router.back()
    } else {
      router.replace('/(tabs)')
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: kolmiColors.bg }}>
      <GrainOverlay />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {!loaded && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                fontFamily: kolmiFonts.serifItalic,
                fontSize: 16,
                color: kolmiColors.textMuted,
              }}
            >
              Préparation de votre lecture…
            </Text>
          </View>
        )}

        {loaded && result && (
          <DnaReveal
            result={result}
            onContinue={handleContinue}
            instant={isRevisit}
          />
        )}

        {loaded && !result && (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: kolmiPaddingX,
              gap: kolmiSpace.lg,
            }}
          >
            <Text
              style={{
                fontFamily: kolmiFonts.serif,
                fontSize: fontScale(28),
                color: kolmiColors.text,
                textAlign: 'center',
                lineHeight: 34,
                letterSpacing: -0.4,
              }}
            >
              Aucune Maison enregistrée
            </Text>
            <Text
              style={{
                fontFamily: kolmiFonts.serifItalic,
                fontSize: 16,
                color: kolmiColors.textBody,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              Lancez le matchmaker pour découvrir votre signature.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/matchmaker')}
              activeOpacity={0.85}
              style={{
                marginTop: kolmiSpace.md,
                height: 56,
                borderRadius: kolmiRadius.pill,
                backgroundColor: kolmiColors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: kolmiSpace.xl,
              }}
            >
              <Text
                style={{
                  fontFamily: kolmiFonts.uiSemiBold,
                  fontSize: 16,
                  color: kolmiColors.white,
                  letterSpacing: 0.2,
                }}
              >
                Commencer le matchmaker
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  )
}
