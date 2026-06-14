import { supabase } from '@/lib/supabase'
import type { SelectedProfile } from '@/data/mockSelectedProfiles'

// Client de l'Edge Function `matchmaker-chat` : LIA, le matchmaker concierge
// propulsé par Claude. La clé Anthropic vit côté serveur (secret Supabase),
// jamais dans le bundle. La fonction reçoit le contexte user + les profils
// disponibles et renvoie un texte éditorial (présente / commente).

export type MatchmakerMessage = { role: 'user' | 'assistant'; content: string }

export type MatchmakerUserContext = {
  firstName?: string
  age?: number
  tokens?: number
}

function toAvailableProfile(p: SelectedProfile) {
  return {
    id: p.id,
    firstName: p.firstName,
    age: p.age ?? undefined,
    city: p.city ?? undefined,
    occupation: p.occupation,
    teaser: p.teaser,
    bio: p.bio,
    intentions: p.intentions,
    interests: p.interests,
  }
}

// Renvoie la réponse texte de LIA, ou `null` en cas d'échec (réseau, quota,
// fonction down…) pour que l'appelant retombe proprement sur le moteur local.
export async function askMatchmaker(opts: {
  message: string
  history?: MatchmakerMessage[]
  userContext?: MatchmakerUserContext
  profiles?: SelectedProfile[]
}): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('matchmaker-chat', {
      body: {
        message: opts.message,
        history: opts.history ?? [],
        user_context: opts.userContext,
        available_profiles: (opts.profiles ?? []).map(toAvailableProfile),
      },
    })
    if (error) {
      console.warn('[kolmi] matchmaker-chat error', error.message)
      return null
    }
    const reply = typeof data?.reply === 'string' ? data.reply.trim() : ''
    return reply || null
  } catch (err) {
    console.warn('[kolmi] matchmaker-chat invoke failed', err)
    return null
  }
}
