// KOLMI design tokens — cream paper editorial direction.
// Bordeaux red wordmark + accents, high-contrast serif titles,
// outline secondary CTA, subtle grain on every screen.

export const kolmiColors = {
  bg: '#F5F1EA',           // cream paper
  bgDeep: '#EFEAE0',       // slightly deeper cream — used for gradient/grain
  text: '#0A0A0A',         // deep black for titles + body emphasis
  textBody: '#2A2A2A',     // body copy
  textSecondary: '#5A544C',
  textMuted: '#8A8378',
  textHint: '#9C8F85',
  textGhost: '#CCC3BA',
  accent: '#8B1A1A',       // bordeaux — wordmark, primary CTA, strike
  accentDeep: '#6E1313',   // pressed-state bordeaux
  outline: 'rgba(26,26,26,0.2)', // 20% black outline for secondary CTA
  divider: '#0A0A0A',
  surfaceSoft: '#E8E2D6',  // disabled CTA
  surfaceWheel: '#EBE5D9', // wheel-picker selection band
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
