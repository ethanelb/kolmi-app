import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { kolmiColors, kolmiFonts, kolmiSpace } from '@/constants/kolmiTheme'

type Props = {
  label: string
  isToday?: boolean
}

// Séparateur de jour dans la timeline. Hairline bordeaux 96 px gauche
// + label italique serif centré + petit ornement (·) à droite. Aéré
// au-dessus / dessous (marginVertical 32). Toujours visible — c'est
// l'ancre temporelle du thread.
function ConversationDayHeader({ label, isToday }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.leftLine} />
      <Text style={[styles.label, isToday && styles.labelToday]}>
        {label}
      </Text>
      <View style={styles.dot} />
      <View style={styles.rightLine} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    // Resserrement éditorial : la fiche du jour vient pratiquement
    // toucher le kicker du tab — on n'a pas besoin de respirer 32 px
    // au-dessus pour signaler une nouvelle journée.
    marginTop: kolmiSpace.xs,
    marginBottom: kolmiSpace.sm,
  },
  leftLine: {
    width: 96,
    height: 0.6,
    backgroundColor: 'rgba(139,26,26,0.55)',
  },
  label: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 14,
    color: kolmiColors.textBody,
    letterSpacing: 0.2,
  },
  labelToday: {
    color: kolmiColors.text,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: kolmiColors.accent,
  },
  rightLine: {
    flex: 1,
    height: 0.6,
    backgroundColor: 'rgba(26,26,26,0.18)',
  },
})

export default React.memo(ConversationDayHeader)
