import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import Svg, { Path, Circle, Ellipse } from 'react-native-svg'
import {
  kolmiColors,
  kolmiSpace,
  kolmiRadius,
  kolmiFonts,
  kolmiPaddingX,
  fontScale,
} from '@/constants/kolmiTheme'
import SignupHeader from '@/components/kolmi/SignupHeader'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { tapMedium, success, warning } from '@/lib/kolmi/haptics'
import { saveKolmiProfile } from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'

const SIGNUP_TOTAL_STEPS = 10
const { width: SCREEN_W } = Dimensions.get('window')
const PIN_W = Math.min(SCREEN_W * 0.42, 160)
const PIN_H = PIN_W * (140 / 120)

const IDF_PREFIXES = ['75', '77', '78', '91', '92', '93', '94', '95']
const isInZone = (postalCode: string | null) =>
  !!postalCode && IDF_PREFIXES.includes(postalCode.slice(0, 2))

type Resolved = {
  city: string
  postalCode: string | null
  inZone: boolean
}
type Phase = 'idle' | 'loading' | 'granted' | 'denied'

// Classic location pin — outline teardrop with inner dot + ground ellipse.
// Path traces clockwise from the top: top → smooth left arc → sharp tip → smooth right arc → top.
function PinIcon({ color, size = PIN_W, height = PIN_H }: { color: string; size?: number; height?: number }) {
  return (
    <Svg width={size} height={height} viewBox="0 0 120 140">
      <Path
        d="M 60 26 C 43 26 30 40 30 56 C 30 86 55 105 60 110 C 65 105 90 86 90 56 C 90 40 77 26 60 26 Z"
        stroke={color}
        strokeWidth={4.5}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx={60} cy={56} r={10} stroke={color} strokeWidth={4} fill="none" />
      <Ellipse cx={60} cy={125} rx={24} ry={4.5} stroke={color} strokeWidth={3.5} fill="none" />
    </Svg>
  )
}

export default function LocalisationScreen() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [resolved, setResolved] = useState<Resolved | null>(null)

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then((p) => {
      if (p.status === Location.PermissionStatus.DENIED) setPhase('denied')
    })
  }, [])

  const ask = async () => {
    setPhase('loading')
    tapMedium()
    try {
      const perm = await Location.requestForegroundPermissionsAsync()
      if (perm.status !== Location.PermissionStatus.GRANTED) {
        setPhase('denied')
        warning()
        return
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      const places = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      })
      const place = places[0]
      const city = place?.city || place?.subregion || place?.region || 'Inconnu'
      const postalCode = place?.postalCode ?? null
      const inZone = isInZone(postalCode)
      setResolved({ city, postalCode, inZone })
      setPhase('granted')
      if (inZone) success()
      else warning()
    } catch (err) {
      console.warn('[kolmi] location failed', err)
      setPhase('idle')
      warning()
    }
  }

  const reset = () => {
    setResolved(null)
    setPhase('idle')
  }

  const openSettings = () => {
    if (Platform.OS === 'ios') Linking.openURL('app-settings:')
    else Linking.openSettings()
  }

  const onContinue = async () => {
    if (!resolved?.inZone) return
    tapMedium()
    const ok = await safePersist(() =>
      saveKolmiProfile({ locationCity: resolved.city }),
    )
    if (!ok) return
    router.push('/onboarding/gender')
  }

  // ─── Phase-driven content ──────────────────────────────────────────
  const isResolved = phase === 'granted' && resolved !== null
  const isInZoneResolved = isResolved && resolved!.inZone
  const isMuted = phase === 'denied' || (isResolved && !isInZoneResolved)
  const pinColor = isMuted ? kolmiColors.outline : kolmiColors.accent

  const subtitleText = (() => {
    if (phase === 'idle')
      return 'On utilise ta position pour te présenter des profils proches de toi.'
    if (phase === 'loading') return 'On regarde où tu es…'
    if (phase === 'denied')
      return 'Active la localisation dans les Réglages pour continuer.'
    if (isInZoneResolved) return 'On te déverrouille la suite.'
    if (isResolved && !isInZoneResolved)
      return "Pour l'instant, Kolmi est uniquement à Paris. On t'écrit dès qu'on arrive chez toi."
    return ''
  })()

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <SignupHeader step={3} total={SIGNUP_TOTAL_STEPS} onBack={() => router.back()} />

        <View style={styles.body}>
          {/* Top: editorial title block */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Tu es où ?</Text>
            <Text style={styles.subtitle}>{subtitleText}</Text>
          </View>

          {/* Center: pin icon + resolved label */}
          <View style={styles.heroSlot}>
            {phase === 'loading' ? (
              <View style={styles.loadingWrap}>
                <PinIcon color={kolmiColors.outline} />
                <ActivityIndicator
                  color={kolmiColors.accent}
                  size="large"
                  style={styles.spinnerOverlay}
                />
              </View>
            ) : (
              <PinIcon color={pinColor} />
            )}

            {isResolved && (
              <View style={styles.resolveBlock}>
                <Text style={styles.resolveLabel}>Tu es à</Text>
                <Text
                  style={[
                    styles.resolveCity,
                    isMuted && styles.resolveCityMuted,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {resolved!.city.toUpperCase()}
                </Text>
                {resolved!.postalCode && (
                  <Text style={styles.resolvePostal}>{resolved!.postalCode}</Text>
                )}
              </View>
            )}
          </View>

          {/* Privacy note (idle only) */}
          {phase === 'idle' && (
            <Text style={styles.privacy}>
              Ta position exacte n'est jamais affichée. On ne montre que ta ville sur ton profil.
            </Text>
          )}
        </View>

        {/* Footer: CTA stack */}
        <View style={styles.footer}>
          {phase === 'idle' && (
            <TouchableOpacity style={styles.cta} onPress={ask} activeOpacity={0.85}>
              <Text style={styles.ctaText}>Activer ma localisation</Text>
            </TouchableOpacity>
          )}

          {phase === 'loading' && (
            <View style={[styles.cta, styles.ctaBusy]}>
              <ActivityIndicator color={kolmiColors.white} />
            </View>
          )}

          {phase === 'denied' && (
            <>
              <TouchableOpacity style={styles.cta} onPress={openSettings} activeOpacity={0.85}>
                <Text style={styles.ctaText}>Ouvrir les Réglages</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn} onPress={ask} activeOpacity={0.7}>
                <Text style={styles.ghostText}>Réessayer</Text>
              </TouchableOpacity>
            </>
          )}

          {isInZoneResolved && (
            <TouchableOpacity style={styles.cta} onPress={onContinue} activeOpacity={0.85}>
              <Text style={styles.ctaText}>Continuer</Text>
            </TouchableOpacity>
          )}

          {isResolved && !isInZoneResolved && (
            <TouchableOpacity style={styles.ghostBtn} onPress={reset} activeOpacity={0.7}>
              <Text style={styles.ghostText}>Refaire la vérification</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.md,
  },
  titleBlock: {
    paddingTop: kolmiSpace.lg,
  },
  title: {
    fontFamily: kolmiFonts.serif,
    fontSize: fontScale(40),
    color: kolmiColors.text,
    lineHeight: 46,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    color: kolmiColors.textBody,
    lineHeight: 24,
    marginTop: kolmiSpace.sm,
    paddingRight: kolmiSpace.lg,
  },
  heroSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: kolmiSpace.lg,
  },
  loadingWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerOverlay: {
    position: 'absolute',
  },
  resolveBlock: {
    alignItems: 'center',
    gap: kolmiSpace.xxs,
  },
  resolveLabel: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 11,
    color: kolmiColors.textSecondary,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  resolveCity: {
    fontFamily: kolmiFonts.serif,
    fontSize: fontScale(32),
    color: kolmiColors.text,
    letterSpacing: -0.4,
    lineHeight: 36,
    paddingHorizontal: kolmiSpace.md,
  },
  resolveCityMuted: {
    color: kolmiColors.textSecondary,
  },
  resolvePostal: {
    fontFamily: kolmiFonts.serifLegacy,
    fontSize: 13,
    color: kolmiColors.textSecondary,
    letterSpacing: 1.6,
    marginTop: 2,
  },
  privacy: {
    fontFamily: kolmiFonts.ui,
    fontSize: 12,
    color: kolmiColors.textMuted,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: kolmiSpace.md,
    marginBottom: kolmiSpace.md,
  },
  footer: {
    paddingHorizontal: kolmiPaddingX,
    paddingBottom: kolmiSpace.xl,
    gap: kolmiSpace.xs,
  },
  cta: {
    height: 56,
    borderRadius: kolmiRadius.pill,
    backgroundColor: kolmiColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5A0A0A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  ctaBusy: { opacity: 0.9 },
  ctaText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 16,
    color: kolmiColors.white,
    letterSpacing: 0.2,
  },
  ghostBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 14,
    color: kolmiColors.textBody,
  },
})
