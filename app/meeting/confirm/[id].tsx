import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Alert,
  StyleSheet,
} from 'react-native'
import { Image } from 'expo-image'
import Svg, { Path, Line, Circle, G } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
  fontScale,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { mockMeetings } from '@/data/mockMeetings'
import { getVenueById } from '@/data/mockVenues'
import { getProfileByIdSync as getSelectedProfileById } from '@/lib/kolmi/fetchProfiles'
import { getMeetingById, updateMeeting } from '@/lib/kolmi/storage'
import { KOLMI_DEMO_MODE } from '@/constants/kolmiConfig'
import type { Meeting } from '@/lib/kolmi/types'

// Format des slots produits par /meeting/schedule :
//   "Jeudi 13 mai · 20h00 · Café de Flore"
// Si le slot n'a pas de séparateurs " · ", on retombe sur affichage brut.
function parseSlot(raw: string): { date?: string; time?: string; venue?: string } {
  const parts = raw.split(' · ').map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 3) {
    return { date: parts[0], time: parts[1], venue: parts.slice(2).join(' · ') }
  }
  if (parts.length === 2) {
    return { date: parts[0], time: parts[1] }
  }
  return { date: raw }
}

export default function MeetingConfirmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const stored = id ? await getMeetingById(id) : null
      const seedFallback = KOLMI_DEMO_MODE
        ? mockMeetings.find((m) => m.id === id)
        : undefined
      const fallback = stored ?? seedFallback ?? null
      if (!cancelled) {
        setMeeting(fallback)
        setLoaded(true)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const profile = useMemo(
    () => (meeting ? getSelectedProfileById(meeting.profileId) : null),
    [meeting],
  )

  // Le venue préféré vient du `venueId` quand il existe (mocks legacy).
  // Sinon on parse depuis confirmedSlot.
  const venueFromId = useMemo(() => {
    if (!meeting?.venueId) return null
    return getVenueById(meeting.venueId) ?? null
  }, [meeting])

  const slotParsed = useMemo(
    () => (meeting?.confirmedSlot ? parseSlot(meeting.confirmedSlot) : null),
    [meeting],
  )

  const venueName = venueFromId?.name ?? slotParsed?.venue ?? null
  const venueAddress = venueFromId?.address ?? null
  const venueNote = venueFromId?.matchmakerNote ?? null

  const onOpenMaps = useCallback(() => {
    if (!venueName) return
    const query = venueAddress
      ? `${venueName}, ${venueAddress}`
      : venueName
    const url = `http://maps.apple.com/?q=${encodeURIComponent(query)}`
    Linking.openURL(url).catch(() => {})
  }, [venueName, venueAddress])

  const onAddToCalendar = useCallback(() => {
    Alert.alert(
      'Ajouter au calendrier',
      'Bientôt disponible — pour l\'instant, copiez la date depuis cet écran.',
    )
  }, [])

  const onCancel = useCallback(() => {
    if (!meeting) return
    Alert.alert(
      'Annuler le rendez-vous ?',
      "Cette action est définitive. Le créneau sera libéré et l'autre sera prévenu·e.",
      [
        { text: 'Garder', style: 'cancel' },
        {
          text: 'Annuler le rdv',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateMeeting(meeting.id, { status: 'declined' })
              router.replace('/(tabs)/encounters')
            } catch (err) {
              console.warn('[kolmi] cancel meeting failed', err)
              Alert.alert('Erreur', "L'annulation n'a pas pu aboutir.")
            }
          },
        },
      ],
    )
  }, [meeting, router])

  if (!loaded) {
    return (
      <View style={styles.root}>
        <GrainOverlay />
        <SafeAreaView style={styles.centered}>
          <Text style={styles.placeholderText}>Chargement…</Text>
        </SafeAreaView>
      </View>
    )
  }

  if (!meeting || !profile) {
    return (
      <View style={styles.root}>
        <GrainOverlay />
        <SafeAreaView style={styles.centered}>
          <Text style={styles.placeholderText}>Rendez-vous introuvable.</Text>
        </SafeAreaView>
      </View>
    )
  }

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
            <Text style={styles.headerKicker}>Carton d'invitation</Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Petit fronton SVG en tête */}
          <Animated.View entering={FadeIn.duration(420)} style={styles.glyphWrap}>
            <PedimentGlyph size={84} />
          </Animated.View>

          {slotParsed?.date && (
            <Animated.Text
              entering={FadeInDown.delay(280).duration(500)}
              style={styles.dateTitle}
            >
              {slotParsed.date}
            </Animated.Text>
          )}

          {(slotParsed?.time || slotParsed?.venue) && (
            <Animated.Text
              entering={FadeInDown.delay(420).duration(500)}
              style={styles.timeVenue}
            >
              {slotParsed?.time}
              {slotParsed?.time && slotParsed?.venue ? ' · ' : ''}
              {slotParsed?.venue}
            </Animated.Text>
          )}

          {venueAddress && (
            <Animated.Text
              entering={FadeInDown.delay(540).duration(500)}
              style={styles.address}
            >
              {venueAddress}
            </Animated.Text>
          )}

          <View style={styles.bigHairline} />

          {/* Bloc "Avec qui" */}
          <Animated.View
            entering={FadeInDown.delay(680).duration(500)}
            style={styles.withWhoBlock}
          >
            <Text style={styles.sectionLabel}>Avec qui</Text>
            <View style={styles.whoRow}>
              <View style={styles.avatarWrap}>
                {profile.photoUrl ? (
                  <Image
                    source={{ uri: profile.photoUrl }}
                    style={styles.avatar}
                    contentFit="cover"
                    transition={140}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarLetter}>
                      {profile.firstName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.whoName}>
                  {profile.firstName}, {profile.age}
                </Text>
                <Text style={styles.whoMaison}>{profile.dnaLabel}</Text>
              </View>
            </View>
          </Animated.View>

          {venueNote && (
            <Animated.View
              entering={FadeInDown.delay(820).duration(500)}
              style={styles.noteBlock}
            >
              <Text style={styles.sectionLabel}>Mot du matchmaker</Text>
              <Text style={styles.noteText}>« {venueNote} »</Text>
            </Animated.View>
          )}

          {/* Boutons secondaires */}
          <Animated.View
            entering={FadeInDown.delay(960).duration(500)}
            style={styles.secondaryActions}
          >
            <TouchableOpacity
              onPress={onOpenMaps}
              activeOpacity={0.85}
              style={styles.secondaryBtn}
              disabled={!venueName}
            >
              <Text style={[styles.secondaryBtnText, !venueName && { opacity: 0.4 }]}>
                Ouvrir dans Plans
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onAddToCalendar}
              activeOpacity={0.85}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Ajouter au calendrier</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Annulation discrète en bas */}
          <Animated.View
            entering={FadeIn.delay(1100).duration(500)}
            style={styles.cancelWrap}
          >
            <TouchableOpacity onPress={onCancel} activeOpacity={0.7} hitSlop={8}>
              <Text style={styles.cancelText}>Annuler le rendez-vous</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

// Petit fronton triangulaire avec linteau et oculus — version compacte
// du portail palladien utilisé sur DnaReveal. Ici c'est un en-tête de
// carton d'invitation, pas une "Maison" complète.
function PedimentGlyph({ size = 80 }: { size?: number }) {
  const stroke = kolmiColors.accent
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G fill="none" stroke={stroke} strokeLinejoin="round" strokeLinecap="round">
        {/* Fronton */}
        <Path d="M 50 16 L 18 44 L 82 44 Z" strokeWidth={1.6} />
        {/* Oculus du tympan */}
        <Circle cx="50" cy="36" r="1.8" fill={stroke} />
        {/* Architrave (3 lignes superposées) */}
        <Line x1="14" y1="44" x2="86" y2="44" strokeWidth={1.6} />
        <Line x1="14" y1="56" x2="86" y2="56" strokeWidth={1.4} />
        <Line x1="20" y1="50" x2="80" y2="50" strokeWidth={0.6} />
        {/* Base/sol */}
        <Line x1="6" y1="80" x2="94" y2="80" strokeWidth={0.8} />
      </G>
    </Svg>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: kolmiPaddingX,
  },
  placeholderText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    color: kolmiColors.textMuted,
  },
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
    paddingTop: kolmiSpace.xl,
    paddingBottom: kolmiSpace.xxxl,
    alignItems: 'center',
  },
  glyphWrap: {
    marginBottom: kolmiSpace.lg,
  },
  dateTitle: {
    fontFamily: kolmiFonts.serif,
    fontSize: fontScale(32),
    color: kolmiColors.text,
    lineHeight: 38,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  timeVenue: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 22,
    color: kolmiColors.accent,
    lineHeight: 28,
    letterSpacing: -0.2,
    textAlign: 'center',
    marginTop: kolmiSpace.xs,
  },
  address: {
    fontFamily: kolmiFonts.ui,
    fontSize: 14,
    color: kolmiColors.textBody,
    textAlign: 'center',
    marginTop: kolmiSpace.xs,
  },
  bigHairline: {
    width: 96,
    height: 0.6,
    backgroundColor: 'rgba(139,26,26,0.55)',
    marginVertical: 32,
  },

  // Bloc Avec qui
  withWhoBlock: {
    width: '100%',
    alignItems: 'flex-start',
    gap: kolmiSpace.sm,
  },
  sectionLabel: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textMuted,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
  whoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: kolmiSpace.md,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: kolmiColors.surfaceSoft,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#EFE7DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: kolmiFonts.serif,
    fontSize: 24,
    color: kolmiColors.accent,
  },
  whoName: {
    fontFamily: kolmiFonts.serif,
    fontSize: 22,
    color: kolmiColors.text,
    letterSpacing: -0.3,
  },
  whoMaison: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 13,
    color: kolmiColors.accent,
    letterSpacing: 0.2,
    marginTop: 2,
  },

  // Bloc note
  noteBlock: {
    width: '100%',
    marginTop: kolmiSpace.xl,
    gap: kolmiSpace.xs,
    borderLeftWidth: 1.5,
    borderLeftColor: kolmiColors.accent,
    paddingLeft: kolmiSpace.md,
    paddingVertical: kolmiSpace.xs,
  },
  noteText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    lineHeight: 22,
    color: kolmiColors.text,
  },

  // Secondary actions
  secondaryActions: {
    width: '100%',
    flexDirection: 'row',
    gap: kolmiSpace.xs,
    marginTop: kolmiSpace.xl,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: kolmiRadius.pill,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: kolmiSpace.sm,
  },
  secondaryBtnText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 13,
    color: kolmiColors.text,
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  // Cancel
  cancelWrap: {
    marginTop: kolmiSpace.xxl,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 13,
    color: kolmiColors.accent,
    letterSpacing: 0.2,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(139,26,26,0.5)',
  },
})
