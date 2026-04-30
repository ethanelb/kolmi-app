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
