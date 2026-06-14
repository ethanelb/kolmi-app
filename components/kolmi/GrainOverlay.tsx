import React from 'react'
import { View, StyleSheet } from 'react-native'

interface Props {
  opacity?: number
  // density: kept for API compatibility — l'ancien rendu SVG l'utilisait
  // pour générer N <Rect>. Le rendu actuel l'ignore (cf. note ci-dessous).
  density?: number
}

// Couche de fond crème.
//
// L'implémentation précédente dessinait un grain de papier via un Svg avec
// 1200+ <Rect>. Même avec un cache module-level + React.memo, le simple
// fait de monter / démonter ce sous-arbre à chaque navigation entre écrans
// faisait perdre 40-80ms sur le JS thread (react-native-svg ne bénéficie
// pas du GPU et batch mal le démontage).
//
// On garde la même API (`<GrainOverlay />` sur chaque écran) pour ne pas
// toucher tous les écrans, mais on ne rend qu'un View plein crème — ça
// supprime l'intégralité du coût SVG. Si on veut récupérer la texture
// papier plus tard, le bon chemin est un asset PNG statique chargé via
// `expo-image` (un seul élément GPU-accéléré, cache natif).
function GrainOverlay({ opacity = 1 }: Props) {
  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { opacity, backgroundColor: '#F5F2EC' },
      ]}
      pointerEvents="none"
    />
  )
}

export default React.memo(GrainOverlay)
