import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display'
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter'
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat'
import { HomemadeApple_400Regular } from '@expo-google-fonts/homemade-apple'
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
} from '@expo-google-fonts/fraunces'
import { View } from 'react-native'
import { kolmiColors } from '@/constants/kolmiTheme'
import { registerForPushNotificationsAsync } from '@/lib/kolmi/notifications'
import { getPushToken, savePushToken } from '@/lib/kolmi/storage'

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Caveat_600SemiBold,
    HomemadeApple_400Regular,
    Fraunces_400Regular,
    Fraunces_500Medium,
  })

  // Demande de permission push + persistance du token au boot. On ne bloque
  // jamais le rendu là-dessus : si la permission est refusée ou si l'enregistrement
  // échoue, l'app fonctionne normalement, juste sans notifications.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const token = await registerForPushNotificationsAsync()
      if (cancelled) return
      const previous = await getPushToken()
      if (token !== previous) {
        await savePushToken(token)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: kolmiColors.bg }} />
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: kolmiColors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="matchmaker/index" options={{ gestureEnabled: false }} />
        <Stack.Screen name="matchmaker/result" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="matches/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="meeting/request/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="meeting/schedule/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="meeting/confirm/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="premium/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  )
}
