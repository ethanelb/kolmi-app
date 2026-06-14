import { Easing } from 'react-native-reanimated'

// Tokens de motion KOLMI — cream paper editorial.
// Pas de spring bouncy : on est sur une app premium, le motion doit
// se poser doucement (out-cubic / out-expo / soft bezier).

export const kolmiMotion = {
  duration: {
    xs: 180,
    sm: 280,
    md: 420,
    lg: 600,
    xl: 900,
  },
  easing: {
    out: Easing.out(Easing.cubic),
    expoOut: Easing.out(Easing.exp),
    // Bezier "Apple soft" — settling très naturel.
    soft: Easing.bezier(0.22, 1, 0.36, 1),
    // Bezier rapide pour les press feedback.
    snappy: Easing.bezier(0.4, 0, 0.2, 1),
  },
  // Décalage entre items consécutifs (ms) pour les listes en stagger.
  stagger: 70,
  // Délai d'entrée par défaut pour laisser respirer après une nav.
  enterDelay: 60,
}

// Helper pour générer un délai stagger : `staggerDelay(i)` →
// 60, 130, 200, 270, …
export function staggerDelay(index: number, base = kolmiMotion.enterDelay): number {
  return base + index * kolmiMotion.stagger
}
