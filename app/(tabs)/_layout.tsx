import React from 'react'
import { Tabs } from 'expo-router'

// Plus de tab bar : la navigation s'est déplacée dans le header de
// conversation.tsx (icône Rencontres à gauche, avatar profil à droite).
// L'espace en bas est désormais occupé par la barre de chat de l'IA
// matchmaker. On garde la structure (tabs) pour ne pas casser les routes
// existantes (router.push('/(tabs)/encounters') etc.), mais on cache la
// tab bar et on désactive le label.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="conversation" />
      <Tabs.Screen name="encounters" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  )
}
