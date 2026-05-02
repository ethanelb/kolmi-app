// Bascules globales pour la bêta locale.
//
// KOLMI_DEMO_MODE = false (défaut bêta privée) → un nouvel utilisateur
// démarre avec zéro rendez-vous. Aucun mock seedé.
//
// Repasse à `true` UNIQUEMENT en local pour les démos / screenshots :
// l'app injecte alors les meetings mock (Sarah / Noa / Anna) dans
// l'onglet Rendez-vous pour ne jamais afficher d'état vide. Ne jamais
// commit `true` — c'est trompeur pour de vrais bêta-testeurs.
export const KOLMI_DEMO_MODE = false

// Divise tous les délais simulés du mock backend par 10 — pratique en dev
// pour ne pas attendre 30 s + 2 min entre chaque transition. Doit rester
// `false` en démo / screenshot (sinon les transitions sont trop rapides
// pour être visibles à l'œil).
export const KOLMI_MOCK_DELAYS_FAST = true
