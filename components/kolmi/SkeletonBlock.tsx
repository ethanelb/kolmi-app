import React from 'react'
import { View } from 'react-native'

// Skeleton statique. L'ancienne version animait un shimmer (LinearGradient
// + withRepeat) sur chaque instance — sur l'écran Découvrir on en avait
// jusqu'à 5 en parallèle, soit 5 animations Reanimated continues, ce qui
// faisait jank visible pendant le chargement. Le bloc statique reste un
// placeholder lisible et ne consomme aucune ressource.
export default function SkeletonBlock({
  width,
  height,
  radius = 6,
}: {
  width: number | `${number}%`
  height: number
  radius?: number
}) {
  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: 'rgba(22,19,15,0.07)',
      }}
    />
  )
}
