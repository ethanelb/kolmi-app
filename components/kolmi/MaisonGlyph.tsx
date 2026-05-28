import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { G, Line, Path, Circle } from 'react-native-svg'
import { kolmiColors, kolmiFonts } from '@/constants/kolmiTheme'

type Props = {
  size?: number
  numeral?: string
  strokeColor?: string
}

// Portail classique — fronton triangulaire, entablature, deux colonnes,
// le chiffre romain de la Maison au centre. Inspiration : seuil de villa
// palladienne, frontispice de livre. Tout est en strokes bordeaux pour
// rester sur le registre gravure éditoriale.
//
// On laisse le chiffre romain dans le SDK Text RN (et non `<SvgText>`)
// pour pouvoir utiliser DM Serif Display Italic sans frictions de
// chargement de font côté SVG.
function MaisonGlyph({
  size = 180,
  numeral = 'I',
  strokeColor = kolmiColors.accent,
}: Props) {
  const W = 180
  const H = 180
  const stroke = strokeColor

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${W} ${H}`}>
        <G fill="none" stroke={stroke} strokeLinejoin="round" strokeLinecap="round">
          {/* Fronton triangulaire */}
          <Path
            d="M 90 16 L 30 46 L 150 46 Z"
            strokeWidth={1.6}
          />

          {/* Petite ornement central dans le fronton (tympan) */}
          <Circle cx="90" cy="40" r="1.6" fill={stroke} />

          {/* Architrave / linteau — bande horizontale sous le fronton */}
          <Line x1="26" y1="46" x2="154" y2="46" strokeWidth={1.6} />
          <Line x1="26" y1="58" x2="154" y2="58" strokeWidth={1.6} />
          <Line x1="32" y1="52" x2="148" y2="52" strokeWidth={0.6} />

          {/* Chapiteau gauche — flange juste sous l'entablature */}
          <Line x1="34" y1="58" x2="58" y2="58" strokeWidth={1.4} />
          <Line x1="36" y1="62" x2="56" y2="62" strokeWidth={0.7} />

          {/* Chapiteau droit */}
          <Line x1="122" y1="58" x2="146" y2="58" strokeWidth={1.4} />
          <Line x1="124" y1="62" x2="144" y2="62" strokeWidth={0.7} />

          {/* Colonne gauche — fût */}
          <Line x1="40" y1="62" x2="40" y2="148" strokeWidth={1.2} />
          <Line x1="52" y1="62" x2="52" y2="148" strokeWidth={1.2} />
          {/* Cannelure centrale très fine */}
          <Line x1="46" y1="64" x2="46" y2="146" strokeWidth={0.4} />

          {/* Colonne droite — fût */}
          <Line x1="128" y1="62" x2="128" y2="148" strokeWidth={1.2} />
          <Line x1="140" y1="62" x2="140" y2="148" strokeWidth={1.2} />
          <Line x1="134" y1="64" x2="134" y2="146" strokeWidth={0.4} />

          {/* Base gauche */}
          <Line x1="34" y1="148" x2="58" y2="148" strokeWidth={1.4} />
          <Line x1="32" y1="152" x2="60" y2="152" strokeWidth={1.4} />

          {/* Base droite */}
          <Line x1="122" y1="148" x2="146" y2="148" strokeWidth={1.4} />
          <Line x1="120" y1="152" x2="148" y2="152" strokeWidth={1.4} />

          {/* Stylobate / sol — ligne d'ancrage longue et fine */}
          <Line x1="14" y1="160" x2="166" y2="160" strokeWidth={0.7} />
        </G>
      </Svg>

      {/* Chiffre romain de la Maison — centré dans le seuil */}
      <View pointerEvents="none" style={[styles.numeralWrap, { width: size, height: size }]}>
        <Text
          style={[
            styles.numeralText,
            {
              fontSize: size * 0.34,
              lineHeight: size * 0.34,
              color: stroke,
            },
          ]}
        >
          {numeral}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  numeralWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // Décalage léger vers le bas pour que le chiffre se cale dans le
    // tiers inférieur du portail (entre les colonnes), pas au centre.
    paddingTop: '12%',
  },
  numeralText: {
    fontFamily: kolmiFonts.serifItalic,
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
})

export default React.memo(MaisonGlyph)
