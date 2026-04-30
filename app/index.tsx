import React, { useCallback, useState } from 'react'
import { View } from 'react-native'
import { Redirect, useFocusEffect } from 'expo-router'
import { kolmiColors } from '@/constants/kolmiTheme'
import { getKolmiProgress, type KolmiProgress } from '@/lib/kolmi/storage'

export default function Index() {
  const [progress, setProgress] = useState<KolmiProgress | null>(null)

  // Re-evaluate every time index is focused — otherwise after a dev reset
  // the stale progress state keeps redirecting to (tabs).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      setProgress(null)
      getKolmiProgress().then((p) => {
        if (!cancelled) setProgress(p)
      })
      return () => {
        cancelled = true
      }
    }, []),
  )

  if (!progress) {
    return <View style={{ flex: 1, backgroundColor: kolmiColors.bg }} />
  }

  if (!progress.hasCompletedBaseOnboarding) {
    return <Redirect href="/onboarding/welcome" />
  }
  if (!progress.hasCompletedMatchmaker) {
    return <Redirect href="/matchmaker" />
  }
  return <Redirect href="/(tabs)" />
}
