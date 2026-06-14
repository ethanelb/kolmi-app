import { supabase } from '@/lib/supabase'

const BUCKET = 'profile-photos'

// Upload une photo locale (file://...) vers Supabase Storage.
// La photo finit dans `<user_id>/<index>-<timestamp>.jpg`. Renvoie l'URL
// signée temporaire (1h) ou null en cas d'échec.
export async function uploadProfilePhoto(
  localUri: string,
  index: number,
): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user?.id
  if (!userId) {
    console.warn('[kolmi.photos] no session, cannot upload')
    return null
  }

  try {
    // fetch() supporte les URIs file:// en RN et expose ArrayBuffer
    // directement — plus simple que de passer par expo-file-system.
    const res = await fetch(localUri)
    const buffer = await res.arrayBuffer()

    const filename = `${userId}/${index}-${Date.now()}.jpg`
    const { error } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })
    if (error) {
      console.warn('[kolmi.photos] upload failed', error.message)
      return null
    }

    // Bucket public : pas besoin de re-signer à chaque lecture.
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
    return data.publicUrl
  } catch (err) {
    console.warn('[kolmi.photos] upload exception', err)
    return null
  }
}

// Upload tout un set de photos en parallèle. Renvoie la liste finale dans
// le même ordre, où les uploads échoués gardent l'URI local en fallback.
export async function uploadProfilePhotos(localUris: string[]): Promise<string[]> {
  const results = await Promise.all(
    localUris.map((uri, i) =>
      uri.startsWith('http')
        ? Promise.resolve(uri) // déjà uploadé
        : uploadProfilePhoto(uri, i).then((u) => u ?? uri),
    ),
  )
  return results
}
