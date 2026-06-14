import { useEffect, useRef } from 'react'
import { Stack, useRouter } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import * as Notifications from 'expo-notifications'
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display'
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter'
// `kolmiFonts.script` (Caveat) référencé dans le thème mais n'est utilisé
// par aucun composant — on évite d'embarquer la font sur le cold start.
// Si on l'utilise plus tard, ré-importer ici.
import { HomemadeApple_400Regular } from '@expo-google-fonts/homemade-apple'
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
} from '@expo-google-fonts/fraunces'
import { View } from 'react-native'
import { kolmiColors } from '@/constants/kolmiTheme'
import { registerForPushNotificationsAsync } from '@/lib/kolmi/notifications'
import { getPushToken, savePushToken } from '@/lib/kolmi/storage'
import { fetchMaisons } from '@/lib/kolmi/maisons'
import { bootstrapSession } from '@/lib/kolmi/session'

// Affiche les notifications même quand l'app est au foreground. Sans ce
// handler, expo-notifications les masque silencieusement sur iOS.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export default function RootLayout() {
  const router = useRouter()
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    HomemadeApple_400Regular,
    Fraunces_400Regular,
    Fraunces_500Medium,
  })

  // Si une notification est tapée avant que les fonts ne soient chargées (cold
  // start), le Stack n'est pas encore monté et router.navigate planterait. On
  // mémorise alors la cible et on déclenche la navigation quand l'app est prête.
  const pendingNavigationRef = useRef<string | null>(null)

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

  // Bootstrap de session au boot. On crée un user anonyme si aucune session
  // n'existe — l'utilisateur a donc toujours un user_id pour les écritures
  // RLS, même avant tout sign-in explicite (Apple, phone, etc.).
  useEffect(() => {
    bootstrapSession()
      .then((s) =>
        console.log(
          '[kolmi] session ready:',
          s ? `${s.user.id} (anon=${s.user.is_anonymous ?? false})` : 'none',
        ),
      )
      .catch((err) => console.warn('[kolmi] bootstrap session failed', err))
  }, [])

  // Sanity check : fetch les Maisons depuis Supabase au boot pour valider la
  // connexion DB.
  useEffect(() => {
    fetchMaisons()
      .then((m) => console.log('[kolmi] maisons fetched:', Object.keys(m).join(', ')))
      .catch((err) => console.warn('[kolmi] maisons fetch failed', err))
  }, [])

  // Quand l'utilisateur tape une notification (foreground, background ou cold
  // start), on l'envoie sur l'onglet Rendez-vous. Si l'app n'est pas encore
  // prête, on diffère.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      const target = '/(tabs)/encounters'
      if (!fontsLoaded) {
        pendingNavigationRef.current = target
        return
      }
      try {
        router.navigate(target)
      } catch (err) {
        console.warn('[kolmi] notification navigation failed', err)
      }
    })
    return () => {
      subscription.remove()
    }
  }, [fontsLoaded, router])

  // Une fois les fonts chargées et le Stack monté, on consomme la navigation
  // différée s'il y en a une.
  useEffect(() => {
    if (!fontsLoaded) return
    const target = pendingNavigationRef.current
    if (!target) return
    pendingNavigationRef.current = null
    try {
      router.navigate(target)
    } catch (err) {
      console.warn('[kolmi] deferred notification navigation failed', err)
    }
  }, [fontsLoaded, router])

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: kolmiColors.bg }} />
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: kolmiColors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="matchmaker-chat/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="matches/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="meeting/request/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="meeting/schedule/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="meeting/confirm/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="premium/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/edit-birthday" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/edit-gender" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/edit-orientation" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/edit-photos" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/email" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="auth/verify" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  )
}
