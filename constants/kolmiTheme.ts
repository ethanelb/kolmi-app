// KOLMI design tokens — cream paper editorial direction.
// Bordeaux red wordmark + accents, high-contrast serif titles,
// outline secondary CTA, subtle grain on every screen.

import { Dimensions, PixelRatio } from 'react-native'

// Responsive scaling — base = iPhone 13/14/15 (390 × 844 logical px).
// Pour les écrans plus petits (SE = 375) ou plus grands (Pro Max = 430),
// les helpers ajustent dimensions et typographie sans casser le design.
//
// - scale(n) : largeur — utiliser pour widths, paddings horizontaux, icônes
// - vScale(n) : hauteur — utiliser pour heights, paddings verticaux
// - mScale(n, factor=0.5) : modéré — utiliser pour fontSize et radius (évite
//   le sur-dimensionnement sur grands écrans, le sous-dimensionnement sur petits)
// - fontScale(n) : alias mScale pour la typographie
//
// Note : Dimensions.get est lu une fois au boot (suffit pour sizing initial).
// Pour des layouts qui doivent réagir à la rotation ou au multitâche iPad,
// utiliser useWindowDimensions() côté composant.

const BASE_WIDTH = 390
const BASE_HEIGHT = 844

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

export const scale = (size: number) => (SCREEN_W / BASE_WIDTH) * size
export const vScale = (size: number) => (SCREEN_H / BASE_HEIGHT) * size
export const mScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor
export const fontScale = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel(mScale(size, 0.5)))

// Breakpoints — basés sur la largeur logique iOS.
// small : SE / mini (≤ 375)
// medium : 13/14/15 standard (390)
// large : Plus / Pro Max (≥ 414)
// tablet : iPad (≥ 768) — l'app n'est pas pensée tablette mais le flag permet
// de désactiver des éléments qui cassent à grande largeur.
export const isSmallDevice = SCREEN_W <= 375
export const isLargeDevice = SCREEN_W >= 414
export const isTablet = SCREEN_W >= 768

export const screenWidth = SCREEN_W
export const screenHeight = SCREEN_H

export const kolmiColors = {
  bg: '#FBF8F3',           // cream paper — éclairci pour un rendu plus vif
  bgDeep: '#F4EFE7',       // deeper cream — gradient/grain
  text: '#0A0A0A',         // deep black for titles + body emphasis
  textBody: '#2A2A2A',     // body copy
  textSecondary: '#5A544C',
  textMuted: '#8A8378',
  textHint: '#9C8F85',
  textGhost: '#CCC3BA',
  accent: '#8B1A1A',       // bordeaux — wordmark, primary CTA, strike
  accentDeep: '#6E1313',   // pressed-state bordeaux
  accentSoft: 'rgba(139,26,26,0.08)', // teinte bordeaux très légère — fonds/détails
  outline: 'rgba(26,26,26,0.2)', // 20% black outline for secondary CTA
  divider: '#0A0A0A',
  surfaceSoft: '#EFE8DB',  // disabled CTA — éclairci
  surfaceWheel: '#F1EBDF', // wheel-picker selection band — éclairci
  white: '#FFFFFF',
}

export const kolmiSpace = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
}

export const kolmiRadius = {
  sm: 4,
  md: 8,
  lg: 14,
  pill: 999,
}

// Padding lateral standard pour tous les écrans (per spec).
export const kolmiPaddingX = 24

// Font family names — match @expo-google-fonts package exports.
export const kolmiFonts = {
  serif: 'DMSerifDisplay_400Regular',
  serifItalic: 'DMSerifDisplay_400Regular_Italic',
  serifLegacy: 'Fraunces_500Medium',         // kept for the wheel picker tonal continuity
  serifLegacyRegular: 'Fraunces_400Regular', // kept for the wheel picker
  script: 'Caveat_600SemiBold',
  wordmark: 'HomemadeApple_400Regular',
  ui: 'Inter_400Regular',
  uiMedium: 'Inter_500Medium',
  uiSemiBold: 'Inter_600SemiBold',
}
