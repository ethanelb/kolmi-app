import { Alert } from 'react-native'

// Wrap une mutation AsyncStorage qui peut throw. Si elle échoue :
// - log la cause
// - affiche une Alert utilisateur
// - retourne false pour que le caller s'arrête (typiquement avant
//   `router.push`).
//
// Usage :
//   const ok = await safePersist(
//     () => saveKolmiProfile({ firstName }),
//     "Impossible d'enregistrer votre prénom.",
//   )
//   if (!ok) return
//   router.push(...)
export async function safePersist(
  fn: () => Promise<unknown>,
  errorMessage = 'Une erreur est survenue. Réessayez dans un instant.',
): Promise<boolean> {
  try {
    await fn()
    return true
  } catch (err) {
    console.warn('[kolmi] persist failed', err)
    Alert.alert('Sauvegarde impossible', errorMessage)
    return false
  }
}
