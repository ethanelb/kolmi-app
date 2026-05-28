import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Démarre la session : récupère une session existante depuis AsyncStorage,
// ou crée un utilisateur anonyme si rien n'est stocké. Idempotent — peut être
// appelé plusieurs fois au boot.
export async function bootstrapSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.warn('[kolmi] getSession failed', error.message)
  }
  if (data.session) return data.session

  const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously()
  if (signInError) {
    console.warn('[kolmi] anonymous signIn failed', signInError.message)
    return null
  }
  return signInData.session
}

// Hook qui retourne la session courante et écoute les changements (login,
// logout, refresh). Garantit que le user est disponible dès que la session
// existe.
export function useSession(): { session: Session | null; user: User | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (cancelled) return
      setSession(next)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  return { session, user: session?.user ?? null, loading }
}
