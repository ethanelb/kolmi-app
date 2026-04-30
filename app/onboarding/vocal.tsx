import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import {
  kolmiColors,
  kolmiSpace,
  kolmiRadius,
  kolmiFonts,
  kolmiPaddingX,
} from '@/constants/kolmiTheme'
import SignupHeader from '@/components/kolmi/SignupHeader'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { formatDuration } from '@/lib/utils'
import { saveKolmiProfile } from '@/lib/kolmi/storage'

const SIGNUP_TOTAL_STEPS = 11

export default function VocalScreen() {
  const router = useRouter()
  const recorder = useAudioRecorder()
  const [recorded, setRecorded] = useState(false)

  const handleStop = async () => {
    await recorder.stop()
    setRecorded(true)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const handleRedo = () => {
    recorder.reset()
    setRecorded(false)
  }

  const isRecording = recorder.state === 'recording'

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <SignupHeader
          step={10}
          total={SIGNUP_TOTAL_STEPS}
          onBack={() => router.back()}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{'Dis-nous\nqui tu es'}</Text>
          <Text style={styles.subtitle}>
            Parle librement — quelques minutes suffisent.
          </Text>

          <View style={styles.aiCard}>
            <View style={styles.cardIconWrap}>
              <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                <Path
                  d="M9 1L10.5 6.5L16 8L10.5 9.5L9 15L7.5 9.5L2 8L7.5 6.5L9 1Z"
                  stroke={kolmiColors.accent}
                  strokeWidth={1.4}
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Pour le matchmaker</Text>
              <Text style={styles.cardText}>
                Votre vocal aide Kolmi à mieux comprendre votre manière de vous présenter. Il pourra être utilisé plus tard par le matchmaker pour affiner les profils et les lieux proposés.
              </Text>
            </View>
          </View>

          <View style={styles.freeCard}>
            <View style={styles.cardIconWrap}>
              <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                <Path
                  d="M2 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6l-4 3V4Z"
                  stroke={kolmiColors.text}
                  strokeWidth={1.4}
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Raconte ta vie, librement</Text>
              <Text style={styles.cardText}>
                Ce que tu fais, ce que tu écoutes, tes passions, ce qui te fait rire… Parle comme si tu parlais à un ami.
              </Text>
            </View>
          </View>

          <View style={styles.recordArea}>
            {!recorded ? (
              <>
                {isRecording && (
                  <View style={styles.recordingInfo}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.duration}>{formatDuration(recorder.duration)}</Text>
                    <Text style={styles.durationHint}>/ 2:00 max</Text>
                  </View>
                )}

                <Text style={styles.recordHint}>
                  {isRecording ? 'Relâche pour terminer…' : 'Maintiens pour enregistrer'}
                </Text>

                <TouchableOpacity
                  onPressIn={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
                    recorder.start()
                  }}
                  onPressOut={handleStop}
                  activeOpacity={0.85}
                  style={[styles.micBtn, isRecording && styles.micBtnActive]}
                >
                  {isRecording && <View style={styles.ripple} />}
                  <Svg width={36} height={48} viewBox="0 0 36 48" fill="none">
                    <Rect
                      x={11}
                      y={4}
                      width={14}
                      height={24}
                      rx={7}
                      fill={kolmiColors.white}
                    />
                    <Path
                      d="M5 22a13 13 0 0 0 26 0 M18 35v8 M12 43h12"
                      stroke={kolmiColors.white}
                      strokeWidth={2.2}
                      strokeLinecap="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.recordedArea}>
                <View style={styles.recordedCard}>
                  <View style={styles.recordedIcon}>
                    <Svg width={20} height={26} viewBox="0 0 20 26" fill="none">
                      <Rect x={5} y={2} width={10} height={14} rx={5} fill={kolmiColors.accent} />
                      <Path
                        d="M2 13a8 8 0 0 0 16 0 M10 21v4 M6 25h8"
                        stroke={kolmiColors.accent}
                        strokeWidth={1.6}
                        strokeLinecap="round"
                      />
                    </Svg>
                  </View>
                  <View style={styles.recordedInfo}>
                    <Text style={styles.recordedTitle}>Vocal enregistré</Text>
                    <Text style={styles.recordedDuration}>
                      {formatDuration(recorder.result?.duration ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.checkBadge}>
                    <Svg width={14} height={10} viewBox="0 0 14 10" fill="none">
                      <Path
                        d="M1 5l4 4L13 1"
                        stroke={kolmiColors.white}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                </View>

                <TouchableOpacity onPress={handleRedo} activeOpacity={0.7} style={styles.redoBtn}>
                  <Text style={styles.redoBtnText}>↺  Réenregistrer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {!recorded && !isRecording && (
            <TouchableOpacity
              onPress={() => {
                router.push('/onboarding/preferences')
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Passer pour l'instant</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.cta}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              if (recorded) await saveKolmiProfile({ hasVocalIntro: true })
              router.push('/onboarding/preferences')
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Continuer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.lg,
    paddingBottom: kolmiSpace.lg,
  },
  title: {
    fontFamily: kolmiFonts.serif,
    fontSize: 36,
    color: kolmiColors.text,
    lineHeight: 42,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: kolmiFonts.ui,
    fontSize: 14,
    color: kolmiColors.textBody,
    lineHeight: 21,
    marginTop: kolmiSpace.sm,
    marginBottom: kolmiSpace.lg,
  },

  aiCard: {
    flexDirection: 'row',
    gap: kolmiSpace.md,
    padding: kolmiSpace.md,
    borderRadius: kolmiRadius.lg,
    backgroundColor: kolmiColors.bgDeep,
    borderWidth: 1,
    borderColor: kolmiColors.accent + '33',
    alignItems: 'flex-start',
    marginBottom: kolmiSpace.sm,
  },
  freeCard: {
    flexDirection: 'row',
    gap: kolmiSpace.md,
    padding: kolmiSpace.md,
    borderRadius: kolmiRadius.lg,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    alignItems: 'flex-start',
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1, gap: 3 },
  cardTitle: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 14,
    color: kolmiColors.text,
  },
  cardText: {
    fontFamily: kolmiFonts.ui,
    fontSize: 13,
    color: kolmiColors.textBody,
    lineHeight: 19,
  },

  recordArea: {
    alignItems: 'center',
    gap: kolmiSpace.md,
    paddingVertical: kolmiSpace.xxl,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: kolmiSpace.xs,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: kolmiColors.accent,
  },
  duration: {
    fontFamily: kolmiFonts.serif,
    fontSize: 22,
    color: kolmiColors.text,
  },
  durationHint: {
    fontFamily: kolmiFonts.ui,
    fontSize: 13,
    color: kolmiColors.textMuted,
  },
  recordHint: {
    fontFamily: kolmiFonts.ui,
    fontSize: 13,
    color: kolmiColors.textSecondary,
    textAlign: 'center',
  },
  micBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: kolmiColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5A0A0A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  micBtnActive: {
    transform: [{ scale: 1.06 }],
  },
  ripple: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: kolmiColors.accent + '55',
  },

  recordedArea: { width: '100%', gap: kolmiSpace.md },
  recordedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: kolmiSpace.md,
    padding: kolmiSpace.md,
    borderRadius: kolmiRadius.lg,
    backgroundColor: kolmiColors.bgDeep,
    borderWidth: 1.5,
    borderColor: kolmiColors.accent,
  },
  recordedIcon: {
    width: 32,
    alignItems: 'center',
  },
  recordedInfo: { flex: 1 },
  recordedTitle: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 15,
    color: kolmiColors.text,
  },
  recordedDuration: {
    fontFamily: kolmiFonts.ui,
    fontSize: 13,
    color: kolmiColors.textSecondary,
    marginTop: 2,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: kolmiColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redoBtn: { alignSelf: 'flex-start' },
  redoBtnText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 14,
    color: kolmiColors.accent,
  },

  footer: {
    paddingHorizontal: kolmiPaddingX,
    paddingBottom: kolmiSpace.xl,
    paddingTop: kolmiSpace.sm,
    gap: kolmiSpace.sm,
  },
  skipText: {
    fontFamily: kolmiFonts.ui,
    fontSize: 13,
    color: kolmiColors.textMuted,
    textAlign: 'center',
    paddingVertical: kolmiSpace.xs,
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
  ctaText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 16,
    color: kolmiColors.white,
    letterSpacing: 0.2,
  },
})
