// Client Anthropic volontairement absent côté app : exposer une clé API
// dans le bundle React Native est non négociable, même en dev. Tout appel
// IA doit passer par une fonction serveur (Supabase Edge Function ou autre)
// qui détient la clé et applique du rate limiting.

export async function callKolmiAI(_input: unknown): Promise<never> {
  throw new Error(
    'Anthropic calls must go through a server-side function. The client SDK is intentionally not wired up.',
  )
}
