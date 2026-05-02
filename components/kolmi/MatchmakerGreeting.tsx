import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { kolmiColors, kolmiFonts } from '@/constants/kolmiTheme'

type Props = {
  // Nombre de profils visibles dans le courrier du jour. À 0, on
  // n'affiche pas la greeting (l'écran utilise EmptyState à la place).
  count: number
  // Permet d'override l'heure pour les tests / preview.
  hour?: number
}

// Salutation italique du matchmaker, dépendante de l'heure :
//   • avant 11h : « Bonjour. Trois envois ce matin. »
//   • 11h-19h   : « Voici votre sélection du jour. »
//   • après 19h : « Trois lectures pour ce soir. »
// Les nombres sont écrits en toutes lettres (1→5) pour le côté éditorial.
function numberWord(n: number, feminine = false): string {
  if (n === 1) return feminine ? 'Une' : 'Un'
  if (n === 2) return 'Deux'
  if (n === 3) return 'Trois'
  if (n === 4) return 'Quatre'
  if (n === 5) return 'Cinq'
  return String(n)
}

function phraseFor(hour: number, count: number): string {
  if (hour < 11) {
    const word = count === 1 ? 'envoi' : 'envois'
    return `Bonjour. ${numberWord(count)} ${word} ce matin.`
  }
  if (hour < 19) {
    return 'Voici votre sélection du jour.'
  }
  const word = count === 1 ? 'lecture' : 'lectures'
  return `${numberWord(count, true)} ${word} pour ce soir.`
}

export default function MatchmakerGreeting({ count, hour }: Props) {
  const h = hour ?? new Date().getHours()
  const sentence = phraseFor(h, count)

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLetter}>A</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.kicker}>Votre matchmaker</Text>
        <Text style={styles.sentence}>{sentence}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2CBA8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: kolmiFonts.serif,
    fontSize: 16,
    color: '#16130F',
  },
  body: { flex: 1, gap: 6 },
  kicker: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 10,
    color: kolmiColors.textMuted,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
  sentence: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 22,
    color: kolmiColors.text,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
})
