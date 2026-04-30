import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native'
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
import {
  getKolmiProfile,
  saveKolmiProfile,
  type KolmiProfile,
} from '@/lib/kolmi/storage'
import { safePersist } from '@/lib/kolmi/safePersist'
import { select, success, tapMedium } from '@/lib/kolmi/haptics'

const { width } = Dimensions.get('window')
const SLOT_GAP = 10
const SLOT_SIZE = (width - kolmiPaddingX * 2 - SLOT_GAP * 2) / 3

const MOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
]

const LIFESTYLE_QUESTIONS = [
  {
    id: 'drinking',
    question: 'Alcool',
    options: ['Jamais', 'Rarement', 'En soirée', 'Régulièrement'],
  },
  {
    id: 'smoking',
    question: 'Tabac',
    options: ['Jamais', 'Occasionnellement', 'Fumeur(se)'],
  },
  {
    id: 'children',
    question: 'Enfants',
    options: [
      "J'en ai",
      "Je n'en ai pas",
      'Je veux en avoir',
      'Je ne veux pas en avoir',
      "Ouvert(e) à l'idée",
    ],
  },
  {
    id: 'religion',
    question: 'Religion',
    options: [
      'Athée',
      'Agnostique',
      'Chrétien(ne)',
      'Musulman(e)',
      'Juif(ve)',
      'Bouddhiste',
      'Autre',
    ],
  },
]

export default function ProfileScreen() {
  const router = useRouter()
  const [loaded, setLoaded] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [photos, setPhotos] = useState<(string | null)[]>([
    null, null, null, null, null, null,
  ])
  const [lifestyle, setLifestyle] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getKolmiProfile()
      .then((p: KolmiProfile) => {
        setFirstName(p.firstName ?? '')
        const slots: (string | null)[] = [null, null, null, null, null, null]
        ;(p.photoUrls ?? []).forEach((url, i) => {
          if (i < 6) slots[i] = url
        })
        setPhotos(slots)
        setLifestyle(p.lifestyle ?? {})
      })
      .catch((err) => {
        console.warn('[kolmi] profile load failed', err)
      })
      .finally(() => {
        setLoaded(true)
      })
  }, [])

  const filledCount = photos.filter(Boolean).length
  const isValid = firstName.trim().length >= 2 && filledCount >= 4

  const cyclePhotoSlot = (index: number) => {
    const current = photos[index]
    if (current && photos.filter(Boolean).length <= 4) {
      Alert.alert(
        'Photo requise',
        "Tu dois garder au moins 4 photos sur ton profil. Ajoute une autre photo avant de retirer celle-ci.",
      )
      return
    }
    try {
      select()
      setPhotos((prev) => {
        const next = [...prev]
        const slot = next[index]
        if (!slot) {
          const used = new Set(next.filter((p): p is string => Boolean(p)))
          const candidate = MOCK_PHOTOS.find((u) => !used.has(u)) ?? MOCK_PHOTOS[index % MOCK_PHOTOS.length]
          next[index] = candidate
        } else {
          next[index] = null
        }
        return next
      })
      setDirty(true)
    } catch (err) {
      console.warn('[kolmi] photo slot update failed', err)
      Alert.alert(
        'Action impossible',
        "La modification de cette photo n'a pas pu être appliquée. Réessaie dans un instant.",
      )
    }
  }

  const setLifestyleAnswer = (qid: string, opt: string) => {
    select()
    setLifestyle((prev) => ({ ...prev, [qid]: opt }))
    setDirty(true)
  }

  const handleSave = async () => {
    if (!isValid || saving) return
    tapMedium()
    setSaving(true)
    try {
      const ok = await safePersist(
        () =>
          saveKolmiProfile({
            firstName: firstName.trim(),
            photoUrls: photos.filter((p): p is string => Boolean(p)),
            lifestyle,
          }),
        "Impossible d'enregistrer votre profil. Vérifiez l'espace disponible et réessayez.",
      )
      if (!ok) return
      success()
      setDirty(false)
      router.back()
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
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
          <Text style={styles.headerTitle}>Mon profil</Text>
          <View style={{ width: 18 }} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!loaded ? (
              <Text style={styles.loadingText}>Chargement…</Text>
            ) : (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Prénom</Text>
                  <Pressable style={styles.inputWrap}>
                    <TextInput
                      value={firstName}
                      onChangeText={(v) => {
                        setFirstName(v)
                        setDirty(true)
                      }}
                      placeholder="Prénom"
                      placeholderTextColor={kolmiColors.textGhost}
                      autoCapitalize="words"
                      maxLength={30}
                      style={styles.input}
                    />
                  </Pressable>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Photos</Text>
                  <Text style={styles.sectionHint}>
                    Touchez une case pour ajouter, touchez-la encore pour retirer · 4 minimum
                  </Text>
                  <View style={styles.grid}>
                    {photos.map((photo, i) => {
                      const isRequired = i < 4
                      return (
                        <TouchableOpacity
                          key={i}
                          activeOpacity={0.85}
                          onPress={() => cyclePhotoSlot(i)}
                          style={[
                            styles.slot,
                            !photo && isRequired && styles.slotRequired,
                            !photo && !isRequired && styles.slotOptional,
                            photo && styles.slotFilled,
                          ]}
                        >
                          {photo ? (
                            <>
                              <Image source={{ uri: photo }} style={styles.slotImage} />
                              <View style={styles.slotRemove}>
                                <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                                  <Path
                                    d="M1 1L9 9 M9 1L1 9"
                                    stroke={kolmiColors.white}
                                    strokeWidth={1.6}
                                    strokeLinecap="round"
                                  />
                                </Svg>
                              </View>
                            </>
                          ) : (
                            <Text
                              style={[
                                styles.plus,
                                isRequired ? styles.plusRequired : styles.plusOptional,
                              ]}
                            >
                              +
                            </Text>
                          )}
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Style de vie</Text>
                  {LIFESTYLE_QUESTIONS.map((q) => (
                    <View key={q.id} style={styles.lifestyleQuestion}>
                      <Text style={styles.lifestyleQuestionLabel}>{q.question}</Text>
                      <View style={styles.chips}>
                        {q.options.map((opt) => {
                          const active = lifestyle[q.id] === opt
                          return (
                            <TouchableOpacity
                              key={opt}
                              onPress={() => setLifestyleAnswer(q.id, opt)}
                              activeOpacity={0.75}
                              style={[styles.chip, active && styles.chipActive]}
                            >
                              <Text
                                style={[
                                  styles.chipText,
                                  active && styles.chipTextActive,
                                ]}
                              >
                                {opt}
                              </Text>
                            </TouchableOpacity>
                          )
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!isValid || !dirty || saving}
              activeOpacity={isValid && dirty && !saving ? 0.85 : 1}
              style={[
                styles.cta,
                (!isValid || !dirty) && styles.ctaDisabled,
              ]}
            >
              {saving ? (
                <View style={styles.ctaSavingRow}>
                  <ActivityIndicator size="small" color={kolmiColors.white} />
                  <Text style={styles.ctaText}>Enregistrement…</Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.ctaText,
                    (!isValid || !dirty) && styles.ctaTextDisabled,
                  ]}
                >
                  {dirty ? 'Enregistrer' : 'À jour'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: kolmiPaddingX,
    paddingVertical: kolmiSpace.sm,
  },
  headerTitle: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 14,
    color: kolmiColors.text,
    letterSpacing: 0.4,
  },
  scroll: {
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.md,
    paddingBottom: kolmiSpace.xxxl,
    gap: kolmiSpace.xl,
  },
  loadingText: {
    textAlign: 'center',
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    color: kolmiColors.textMuted,
    marginTop: kolmiSpace.xxxl,
  },
  section: { gap: kolmiSpace.sm },
  sectionLabel: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: kolmiColors.textSecondary,
    textTransform: 'uppercase',
  },
  sectionHint: {
    fontFamily: kolmiFonts.ui,
    fontSize: 12,
    color: kolmiColors.textMuted,
    lineHeight: 18,
  },
  inputWrap: {
    borderBottomWidth: 1.5,
    borderBottomColor: kolmiColors.text,
  },
  input: {
    height: 48,
    fontFamily: kolmiFonts.serif,
    fontSize: 22,
    color: kolmiColors.text,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SLOT_GAP,
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE * 1.25,
    borderRadius: kolmiRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slotRequired: {
    borderWidth: 1.5,
    borderColor: kolmiColors.text,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  slotOptional: {
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  slotFilled: {
    backgroundColor: kolmiColors.surfaceSoft,
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  slotRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(10,10,10,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontFamily: kolmiFonts.serif,
    fontSize: 30,
  },
  plusRequired: {
    color: kolmiColors.text,
  },
  plusOptional: {
    color: kolmiColors.textHint,
  },
  lifestyleQuestion: {
    gap: kolmiSpace.xs,
    marginTop: kolmiSpace.sm,
  },
  lifestyleQuestionLabel: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 14,
    color: kolmiColors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: kolmiSpace.xs,
  },
  chip: {
    paddingHorizontal: kolmiSpace.md,
    paddingVertical: kolmiSpace.xs + 2,
    borderRadius: kolmiRadius.pill,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
  },
  chipActive: {
    borderColor: kolmiColors.accent,
    borderWidth: 1.5,
    backgroundColor: kolmiColors.bgDeep,
  },
  chipText: {
    fontFamily: kolmiFonts.ui,
    fontSize: 13,
    color: kolmiColors.text,
  },
  chipTextActive: {
    fontFamily: kolmiFonts.uiSemiBold,
    color: kolmiColors.accent,
  },
  footer: {
    paddingHorizontal: kolmiPaddingX,
    paddingBottom: kolmiSpace.xl,
    paddingTop: kolmiSpace.sm,
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
  ctaDisabled: {
    backgroundColor: kolmiColors.surfaceSoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 16,
    color: kolmiColors.white,
    letterSpacing: 0.2,
  },
  ctaTextDisabled: {
    color: kolmiColors.textMuted,
  },
  ctaSavingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: kolmiSpace.xs + 2,
  },
})
