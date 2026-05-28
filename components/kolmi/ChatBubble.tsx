import React from 'react'
import { Text, View } from 'react-native'
import { kolmiColors, kolmiFonts } from '@/constants/kolmiTheme'

// Variantes éditoriales du message AI. Chaque kind a son propre poids
// typographique pour donner du rythme à la page :
//   • preface  → italique secondaire, plus petit (didascalie)
//   • question → serif romain large, dominant — la voix qui interroge
//   • outro    → italique secondaire, comme la préface (clôt l'acte)
//   • ai       → fallback (même traitement que question)
export type AiKind = 'preface' | 'question' | 'outro' | 'ai'

type Props = {
  role: 'ai' | 'user'
  text: string
  kind?: AiKind
}

function ChatBubble({ role, text, kind = 'ai' }: Props) {
  if (role === 'ai') return <AiLine text={text} kind={kind} />
  return <UserSlip text={text} />
}

export default React.memo(ChatBubble)

function AiLine({ text, kind }: { text: string; kind: AiKind }) {
  if (kind === 'preface' || kind === 'outro') {
    return (
      <View style={{ marginTop: 4, marginBottom: 22, paddingRight: 24 }}>
        <Text
          style={{
            fontFamily: kolmiFonts.serifItalic,
            fontSize: 17,
            lineHeight: 25,
            color: kolmiColors.textBody,
            letterSpacing: -0.1,
          }}
        >
          {text}
        </Text>
      </View>
    )
  }

  // question / ai par défaut — la voix dominante de la page.
  return (
    <View style={{ marginTop: 6, marginBottom: 18, paddingRight: 12 }}>
      <Text
        style={{
          fontFamily: kolmiFonts.serif,
          fontSize: 26,
          lineHeight: 34,
          color: kolmiColors.text,
          letterSpacing: -0.4,
        }}
      >
        {text}
      </Text>
    </View>
  )
}

// Réponse utilisateur = note manuscrite glissée en marge droite.
// Pas de rotation (le tilt -0.6deg crispait le rendu) ; à la place,
// un trait bordeaux court en haut + hairline sépia bas pour ancrer la
// note à la page sans la coller à une bulle ronde.
function UserSlip({ text }: { text: string }) {
  return (
    <View
      style={{
        alignSelf: 'flex-end',
        maxWidth: '80%',
        marginTop: 6,
        marginBottom: 18,
        paddingTop: 10,
        paddingBottom: 12,
        paddingHorizontal: 4,
      }}
    >
      <View
        style={{
          width: 22,
          height: 1.2,
          backgroundColor: kolmiColors.accent,
          marginBottom: 8,
          alignSelf: 'flex-end',
        }}
      />
      <Text
        style={{
          fontFamily: kolmiFonts.serifItalic,
          fontSize: 17,
          lineHeight: 24,
          color: kolmiColors.text,
          textAlign: 'right',
        }}
      >
        — {text}
      </Text>
    </View>
  )
}
