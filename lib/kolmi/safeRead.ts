// Symétrique de safePersist : enveloppe une lecture AsyncStorage qui
// peut throw. En cas d'échec, on log et on retourne le fallback fourni
// pour que l'écran rende quelque chose plutôt que de rester figé sur un
// `undefined` non géré. Pas d'Alert : la lecture est toujours best-effort,
// et un échec de read est moins critique qu'un échec de write.
export async function safeRead<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    console.warn('[kolmi] read failed', err)
    return fallback
  }
}
