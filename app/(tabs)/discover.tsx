import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { Image } from 'expo-image'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
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
import { mockSelectedProfiles, type SelectedProfile } from '@/data/mockSelectedProfiles'
import { getPassedProfiles } from '@/lib/kolmi/storage'
import { kolmiMotion, staggerDelay } from '@/lib/kolmi/motion'

// Tab "Vos envois passés" — catalogue read-only des profils que
// l'utilisateur a passés depuis le courrier du jour. Pas de browse
// infini, pas de filtre, pas d'action — c'est un journal.
//
// Pivot délibéré : le brand manifesto interdit le swipe / l'exploration
// active. Cet écran existe juste pour que le user puisse revenir voir
// qui il a écarté, par curiosité ou regret.
export default function PastEnvoisScreen() {
  const router = useRouter()
  const [passed, setPassed] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(() => {
    getPassedProfiles().then((next) => {
      setPassed(next)
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh]),
  )

  // L'ordre est l'ordre de passage (le dernier passé en premier — le
  // tableau passed[] est append-only côté storage, on l'inverse pour
  // afficher du plus récent au plus ancien).
  const passedProfiles: SelectedProfile[] = useMemo(() => {
    const map = new Map(mockSelectedProfiles.map((p) => [p.id, p]))
    return [...passed]
      .reverse()
      .map((id) => map.get(id))
      .filter((p): p is SelectedProfile => p !== undefined)
  }, [passed])

  const handleViewProfile = useCallback(
    (id: string) => router.push(`/matches/${id}`),
    [router],
  )

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeIn.duration(kolmiMotion.duration.lg)}
            style={styles.header}
          >
            <Text style={styles.kicker}>Archive</Text>
            <Text style={styles.title}>Vos envois passés.</Text>
            <Text style={styles.subtitle}>
              Les profils que vous avez écartés. En lecture seule — la décision est définitive.
            </Text>
          </Animated.View>

          {loaded && passedProfiles.length === 0 && (
            <Animated.View
              entering={FadeIn.delay(200).duration(500)}
              style={styles.emptyBlock}
            >
              <View style={styles.emptyOrnament} />
              <Text style={styles.emptyTitle}>
                Vous n'avez encore rien passé.
              </Text>
              <Text style={styles.emptyBody}>
                Quand vous écartez un profil de votre courrier du jour, il s'archive ici.
              </Text>
            </Animated.View>
          )}

          {loaded && passedProfiles.length > 0 && (
            <View style={styles.list}>
              {passedProfiles.map((profile, i) => (
                <Animated.View
                  key={profile.id}
                  entering={FadeInDown.delay(staggerDelay(i, 80))
                    .duration(kolmiMotion.duration.md)
                    .easing(kolmiMotion.easing.soft)}
                >
                  <PastRow profile={profile} onPress={handleViewProfile} />
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const PastRow = React.memo(function PastRow({
  profile,
  onPress,
}: {
  profile: SelectedProfile
  onPress: (id: string) => void
}) {
  const handlePress = useCallback(() => onPress(profile.id), [onPress, profile.id])
  const subtitle =
    profile.occupation && profile.city
      ? `${profile.occupation} · ${profile.city}`
      : profile.occupation ?? profile.city

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={rowStyles.row}
    >
      <View style={rowStyles.thumbWrap}>
        {profile.photoUrl ? (
          <Image
            source={{ uri: profile.photoUrl }}
            style={rowStyles.thumb}
            contentFit="cover"
            transition={120}
          />
        ) : (
          <View style={rowStyles.thumbPlaceholder}>
            <Text style={rowStyles.thumbLetter}>
              {profile.firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={rowStyles.name}>
          {profile.firstName}, {profile.age}
        </Text>
        <Text style={rowStyles.maison}>{profile.dnaLabel}</Text>
        {subtitle ? (
          <Text style={rowStyles.subtitle}>{subtitle}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  scrollContent: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.md,
    paddingBottom: kolmiSpace.xxxl,
  },
  header: {
    gap: 4,
    marginBottom: kolmiSpace.xl,
  },
  kicker: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textMuted,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: kolmiFonts.serif,
    fontSize: 34,
    color: kolmiColors.text,
    lineHeight: 40,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    color: kolmiColors.textBody,
    lineHeight: 22,
    marginTop: 4,
  },

  list: {
    gap: kolmiSpace.sm,
  },

  // Empty state
  emptyBlock: {
    marginTop: kolmiSpace.xxl,
    alignItems: 'center',
    gap: kolmiSpace.sm,
    paddingHorizontal: kolmiSpace.lg,
  },
  emptyOrnament: {
    width: 48,
    height: 0.8,
    backgroundColor: kolmiColors.accent,
    marginBottom: kolmiSpace.sm,
  },
  emptyTitle: {
    fontFamily: kolmiFonts.serif,
    fontSize: 22,
    color: kolmiColors.text,
    lineHeight: 28,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 15,
    color: kolmiColors.textBody,
    lineHeight: 22,
    textAlign: 'center',
  },
})

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: kolmiSpace.md,
    padding: kolmiSpace.md,
    backgroundColor: '#FAF8F5',
    borderRadius: kolmiRadius.lg,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    alignItems: 'center',
  },
  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: kolmiColors.surfaceSoft,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    backgroundColor: '#EFE7DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLetter: {
    fontFamily: kolmiFonts.serif,
    fontSize: 26,
    color: kolmiColors.accent,
  },
  name: {
    fontFamily: kolmiFonts.serif,
    fontSize: 19,
    color: kolmiColors.text,
    letterSpacing: -0.2,
  },
  maison: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 13,
    color: kolmiColors.accent,
    letterSpacing: 0.1,
  },
  subtitle: {
    fontFamily: kolmiFonts.ui,
    fontSize: 13,
    color: kolmiColors.textBody,
    marginTop: 2,
  },
})
