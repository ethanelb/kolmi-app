import { Alert, Linking } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

export async function ensurePhotoLibraryPermission(): Promise<boolean> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync()
  if (current.granted) return true
  if (current.canAskAgain) {
    const next = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (next.granted) return true
  }
  Alert.alert(
    'Accès aux photos requis',
    "Kolmi a besoin d'accéder à ta bibliothèque pour ajouter des photos à ton profil. Active l'autorisation dans les réglages pour continuer.",
    [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Ouvrir les paramètres', onPress: () => Linking.openSettings() },
    ],
  )
  return false
}

// Lance le sélecteur d'images après avoir vérifié la permission.
// Retourne l'URI choisie, ou null si l'utilisateur a annulé ou refusé l'accès.
export async function pickProfilePhoto(): Promise<string | null> {
  const ok = await ensurePhotoLibraryPermission()
  if (!ok) return null
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.85,
    })
    if (result.canceled) return null
    return result.assets?.[0]?.uri ?? null
  } catch (err) {
    console.warn('[kolmi] image picker failed', err)
    Alert.alert(
      'Sélection impossible',
      "La sélection de photo a échoué. Réessaie dans un instant.",
    )
    return null
  }
}
