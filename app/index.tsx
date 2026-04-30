import React, { useCallback, useState } from 'react'
import { View } from 'react-native'
import { Redirect, useFocusEffect } from 'expo-router'
import { kolmiColors } from '@/constants/kolmiTheme'
import {
  getKolmiDnaResult,
  getKolmiProgress,
  type KolmiProgress,
} from '@/lib/kolmi/storage'

type RouterState = {
  progress: KolmiProgress
  hasDna: boolean
}

export default function Index() {
  const [state, setState] = useState<RouterState | null>(null)

  // Re-evaluate every time index is focused — otherwise after a dev reset
  // the stale progress state keeps redirecting to (tabs).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      setState(null)
      Promise.all([getKolmiProgress(), getKolmiDnaResult()]).then(
        ([progress, dna]) => {
          if (!cancelled) setState({ progress, hasDna: dna !== null })
        },
      )
      return () => {
        cancelled = true
      }
    }, []),
  )

  if (!state) {
    return <View style={{ flex: 1, backgroundColor: kolmiColors.bg }} />
  }

  const { progress, hasDna } = state

  if (!progress.hasCompletedBaseOnboarding) {
    return <Redirect href="/onboarding/welcome" />
  }
  // hasCompletedMatchmaker without a stored DNA result means a corrupt or
  // half-finished run — send the user back to the matchmaker rather than
  // dropping them in the tabs without a Maison.
  if (!progress.hasCompletedMatchmaker || !hasDna) {
    return <Redirect href="/matchmaker" />
  }
  return <Redirect href="/(tabs)" />
}
