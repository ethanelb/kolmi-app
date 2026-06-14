import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import {
  kolmiColors,
  kolmiFonts,
  kolmiPaddingX,
  kolmiRadius,
  kolmiSpace,
  fontScale,
} from '@/constants/kolmiTheme'
import GrainOverlay from '@/components/kolmi/GrainOverlay'
import TypingIndicator from '@/components/kolmi/TypingIndicator'
import {
  getKolmiDnaResult,
  getKolmiProfile,
  getTokens,
} from '@/lib/kolmi/storage'
import { fetchSelectableProfiles } from '@/lib/kolmi/fetchProfiles'
import { rankProfilesByAffinity } from '@/lib/kolmi/matching'
import {
  askMatchmaker,
  type MatchmakerMessage,
  type MatchmakerUserContext,
} from '@/lib/kolmi/matchmakerChat'
import type { SelectedProfile } from '@/data/mockSelectedProfiles'
import * as haptics from '@/lib/kolmi/haptics'

function ChevronLeft() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 5 L8 12 L15 19"
        stroke={kolmiColors.text}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default function MatchmakerChatScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ opening?: string }>()

  const [messages, setMessages] = useState<MatchmakerMessage[]>(() =>
    params.opening
      ? [{ role: 'assistant', content: String(params.opening) }]
      : [],
  )
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const userContextRef = useRef<MatchmakerUserContext>({})
  const profilesRef = useRef<SelectedProfile[]>([])
  const scrollRef = useRef<ScrollView>(null)

  // Contexte (profil user + profils du soir classés par affinité) pour que
  // LIA reste ancrée sur la vraie sélection.
  useEffect(() => {
    ;(async () => {
      const [profile, dna, tokens, all] = await Promise.all([
        getKolmiProfile(),
        getKolmiDnaResult(),
        getTokens(),
        fetchSelectableProfiles(),
      ])
      userContextRef.current = {
        firstName: profile.firstName,
        tokens,
      }
      profilesRef.current = rankProfilesByAffinity(all, dna).slice(0, 8)
    })()
  }, [])

  const scrollToEnd = () =>
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }))

  const send = async () => {
    const text = draft.trim()
    if (!text || sending) return
    haptics.tapLight()
    setDraft('')

    // Historique envoyé à l'API : Claude exige un premier message `user`, on
    // retire donc l'accroche d'ouverture (assistant) en tête de fil.
    const history = messages[0]?.role === 'assistant' ? messages.slice(1) : messages

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setSending(true)
    scrollToEnd()

    const reply = await askMatchmaker({
      message: text,
      history,
      userContext: userContextRef.current,
      profiles: profilesRef.current,
    })

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content:
          reply ??
          "Je n'ai pas pu répondre à l'instant. Réessayez dans un moment.",
      },
    ])
    setSending(false)
    scrollToEnd()
  }

  return (
    <View style={styles.root}>
      <GrainOverlay />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <ChevronLeft />
          </TouchableOpacity>
          <View style={styles.headerTitleRow}>
            <Image
              source={require('../../assets/gigi-avatar.png')}
              style={styles.headerAvatar}
              contentFit="cover"
            />
            <Text style={styles.headerTitle}>GIGI</Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}
          >
            {messages.map((m, i) =>
              m.role === 'assistant' ? (
                <View key={i} style={styles.liaRow}>
                  <Image
                    source={require('../../assets/gigi-avatar.png')}
                    style={styles.liaAvatar}
                    contentFit="cover"
                  />
                  <View style={styles.liaBubble}>
                    <Text style={styles.liaText}>{m.content}</Text>
                  </View>
                </View>
              ) : (
                <View key={i} style={styles.userBubble}>
                  <Text style={styles.userText}>{m.content}</Text>
                </View>
              ),
            )}
            {sending && (
              <View style={styles.liaRow}>
                <Image
                  source={require('../../assets/gigi-avatar.png')}
                  style={styles.liaAvatar}
                  contentFit="cover"
                />
                <View style={styles.liaBubble}>
                  <TypingIndicator />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Barre de saisie */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Écrire à GIGI…"
              placeholderTextColor={kolmiColors.textHint}
              multiline
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={send}
            />
            <TouchableOpacity
              onPress={send}
              disabled={!draft.trim() || sending}
              activeOpacity={0.85}
              style={[
                styles.sendBtn,
                (!draft.trim() || sending) && styles.sendBtnDisabled,
              ]}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5 12 L19 12 M13 6 L19 12 L13 18"
                  stroke={kolmiColors.white}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kolmiColors.bg },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: kolmiPaddingX - 8,
    borderBottomWidth: 1,
    borderBottomColor: kolmiColors.outline,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: kolmiSpace.xs,
  },
  headerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#16130F',
  },
  headerTitle: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: fontScale(15),
    color: kolmiColors.text,
    letterSpacing: 0.2,
  },
  scroll: {
    paddingHorizontal: kolmiPaddingX,
    paddingVertical: kolmiSpace.lg,
    gap: kolmiSpace.sm,
  },
  liaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: kolmiSpace.xs,
    alignSelf: 'flex-start',
    maxWidth: '92%',
  },
  liaAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16130F',
    marginBottom: 2,
  },
  liaBubble: {
    flexShrink: 1,
    backgroundColor: kolmiColors.surfaceSoft,
    borderRadius: kolmiRadius.lg,
    borderBottomLeftRadius: kolmiRadius.sm,
    paddingVertical: kolmiSpace.sm,
    paddingHorizontal: kolmiSpace.md,
  },
  liaText: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: fontScale(16),
    lineHeight: fontScale(23),
    color: kolmiColors.text,
  },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    backgroundColor: kolmiColors.accent,
    borderRadius: kolmiRadius.lg,
    borderTopRightRadius: kolmiRadius.sm,
    paddingVertical: kolmiSpace.sm,
    paddingHorizontal: kolmiSpace.md,
  },
  userText: {
    fontFamily: kolmiFonts.ui,
    fontSize: fontScale(15),
    lineHeight: fontScale(21),
    color: kolmiColors.white,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: kolmiSpace.sm,
    paddingHorizontal: kolmiPaddingX,
    paddingTop: kolmiSpace.sm,
    paddingBottom: kolmiSpace.sm,
    borderTopWidth: 1,
    borderTopColor: kolmiColors.outline,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: kolmiColors.white,
    borderRadius: kolmiRadius.lg,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    paddingHorizontal: kolmiSpace.md,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    fontFamily: kolmiFonts.ui,
    fontSize: fontScale(15),
    color: kolmiColors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: kolmiColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: kolmiColors.surfaceSoft,
  },
})
