import Anthropic from '@anthropic-ai/sdk'

// NOTE: In production, ces appels doivent passer par une Supabase Edge Function
// pour ne pas exposer la clé API. Pour le dev local, on appelle directement.
export const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
  dangerouslyAllowBrowser: true,
})
