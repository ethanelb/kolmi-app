import { Redirect } from 'expo-router'

// Ancien tab "Sélection" remplacé par "Conversation" (tab central).
// Cet index.tsx existe juste pour rediriger les routes legacy
// (`/(tabs)`, deeplinks anciens) vers le nouveau tab.
export default function TabsIndexRedirect() {
  return <Redirect href="/(tabs)/conversation" />
}
