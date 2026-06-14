# KOLMI app — context for future sessions

French AI-matchmaking iOS app. Expo + React Native + TypeScript, expo-router for navigation. **Supabase est câblé** (auth anonyme au boot, sync profil/tokens/meetings, upload photos Storage). **GIGI** — le matchmaker IA — est propulsé par Claude via une **Edge Function** (`supabase/functions/matchmaker-chat`, modèle `claude-haiku-4-5`). La clé `ANTHROPIC_API_KEY` vit dans les secrets Supabase, **jamais dans le bundle** ; le client appelle la fonction via `lib/kolmi/matchmakerChat.ts`.

## Product model — GIGI, matchmaker IA

KOLMI est un **matchmaker IA incarné par GIGI**. GIGI apprend à connaître l'utilisateur (chat), puis lui propose et organise des rencontres avec d'autres utilisateurs. L'utilisateur dépense 1 token pour demander une rencontre ; l'app coordonne acceptation, créneaux, lieu.

> **Refonte 2026-06 (cette branche)** : le **test de personnalité (8 questions)** et la **sélection de Maisons** ont été **supprimés** du parcours. GIGI (Claude) remplace le questionnaire. Le modèle de données DNA/Maisons reste dans le code (`data/kolmiDna.ts`, `matching.ts`, `conversationEngine.ts`) mais est **dormant** : sans test, `getKolmiDnaResult()` renvoie toujours `null` → `rankProfilesByAffinity(profiles, null)` retourne les profils sans filtrer.

GIGI :
- **Onglet central « conversation »** = accueil éditorial : une bulle GIGI (un **appel de phare** court et contextuel — découverte / rdv passé / en attente) + la liste « Mes intros ». Tap sur la bulle → écran chat.
- **Chat** (`app/matchmaker-chat/`) = vraie discussion aller-retour user ↔ GIGI (Claude), avec historique. Au tout premier contact, GIGI se présente ; ensuite ce sont des relances. GIGI reste focalisée matchmaking (pas de small talk), ne parle de tokens qu'au moment d'un RDV, ne mentionne jamais de « Maison ».
- Avatar GIGI : `assets/gigi-avatar.png` (mascotte), clippé en rond.

Règles dures — ne jamais transgresser :
- **Pas de chat user-à-user.** Le chat avec GIGI (user ↔ IA) est OK ; un chat/DM entre deux users ne l'est pas.
- Le mot **`conversation`** dans le code désigne **la timeline éditoriale du tab central**, pas un chat entre users.
- Pas de "swipe", pas d'héritage VoiceMatch.

## Run

```sh
npx expo start --ios --localhost   # localhost flag obligatoire — le mode LAN
                                   # casse la connexion simulateur → Metro sur ce Mac.
```

Simulateur dédié : **iPhone 17 Kolmi** (UDID `A24D05B3-6A2B-4A1F-B321-6038797BB3F8`). Si `expo start --ios` ouvre le mauvais, le booter à la main :
`xcrun simctl boot A24D05B3-6A2B-4A1F-B321-6038797BB3F8 && open -a Simulator`.

Test sur device physique : `npx expo start --tunnel`, scanner le QR (Expo Go) ou `qrencode -t ANSIUTF8 "exp://<tunnel>.exp.direct"`.

## Visual design system

Cream paper editorial. Source de vérité : `constants/kolmiTheme.ts`. **Toujours passer par les tokens**, jamais de valeurs hardcodées.

- **Couleurs** (palette éclaircie 2026-06) — bg cream `#FBF8F3`, bgDeep `#F4EFE7`, text `#0A0A0A`, accent bordeaux `#8B1A1A` (couleur du logo, utilisée pour les labels de section, hairlines, CTA), `accentSoft` `rgba(139,26,26,0.08)`, outline `rgba(26,26,26,0.2)`, surface soft `#EFE8DB`. Jamais de bleu / violet.
- **Fonts** —
  - `kolmiFonts.serif` (DM Serif Display 400) pour les titres
  - `kolmiFonts.serifItalic` pour les bulles GIGI, prompts et captions italiques
  - `kolmiFonts.wordmark` (Homemade Apple) pour le wordmark "kolmi"
  - `kolmiFonts.ui` / `uiMedium` / `uiSemiBold` (Inter) pour body, labels, CTA
  - `kolmiFonts.serifLegacy` (Fraunces) pour wheel date / drum hauteur uniquement
- **Layout** — `kolmiPaddingX = 24` horizontal. Boutons 56px, `borderRadius: kolmiRadius.pill`.
- **Grain** — chaque écran wrappe son content dans un root `View` avec `<GrainOverlay />` en premier enfant.

Pattern d'écran :

```tsx
<View style={{ flex: 1, backgroundColor: kolmiColors.bg }}>
  <GrainOverlay />
  <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
    {/* content */}
  </SafeAreaView>
</View>
```

## Routing

```
app/
  index.tsx                        → lit progress, redirige vers :
                                     /onboarding/welcome | /(tabs)/conversation
                                     (n'exige plus de DNA — le test est supprimé)
  _layout.tsx                      → fonts + bootstrapSession() + fetchMaisons()
                                     + push token + handler notifications

  onboarding/
    _layout.tsx
    welcome.tsx                    → Apple / Google buttons (Supabase Auth pas
                                     encore branché — TODO marqué dans le code)
    name.tsx → birthday.tsx → gender.tsx → orientation.tsx → seeking.tsx →
    height.tsx → origin.tsx → religion.tsx → education.tsx → occupation.tsx →
    children.tsx → localisation.tsx → photos.tsx → selfie.tsx →
    notifications.tsx → ready.tsx
                                   ready.tsx : manifeste animé, PAS de bouton —
                                     l'écran « kolmi » descend en fondu ~2 s puis
                                     auto-transition. Termine par :
                                     await saveKolmiProgress({ hasCompletedBaseOnboarding: true })
                                     router.replace('/(tabs)/conversation')

  auth/                            → flux email (modal). Plus lié depuis le profil
    email.tsx / verify.tsx           (bouton « Sécuriser » retiré), conservé pour
                                     un futur rebranchement.

  matchmaker-chat/
    index.tsx                      → chat aller-retour user ↔ GIGI (Claude, via
                                     lib/kolmi/matchmakerChat → Edge Function).
                                     Seedé avec l'appel de phare de la conversation.
                                     ⚠ chat avec l'IA, JAMAIS user-à-user.

  (tabs)/
    _layout.tsx                    → tabs. `index` redirige les vieux deeplinks.
    conversation.tsx               → accueil éditorial (cœur de l'app) : bulle GIGI
                                     (appel de phare contextuel via matchmakerChat)
                                     + « Mes intros » + décisions inline. Header :
                                     avatar profil (gauche) · wordmark · bouton
                                     PARTAGE app (droite, Share natif).
    encounters.tsx                 → rencontres groupées par bucket (statuts).
    profile.tsx                    → tokens, profil, prefs, compte (épuré : plus
                                     de pill tokens header, ni « Membre · KOLMI »,
                                     ni valeur de prefs).

  matches/[id].tsx                 → fiche profil détaillée + CTA "Demander
                                     une rencontre" / "Pas pour moi".

  meeting/
    request/[id].tsx               → confirme la demande, débit token, planifie
                                     la simulation côté "autre" (mockBackend).
    schedule/[id].tsx              → choix 2-3 créneaux + lieu → status='confirmed'.
    confirm/[id].tsx               → fiche RDV confirmée (slot + venue + mot du
                                     matchmaker).
    feedback/[id].tsx              → après le RDV : "on se revoit / on en reste
                                     là". Match mutuel si oui des deux côtés.

  premium/index.tsx                → segmented control : Packs (15/39/100€) /
                                     Abonnement (60€/mois, 5 tokens, profils
                                     illimités). Achat simulé (pas de paiement).

  profile/
    edit-birthday.tsx · edit-gender.tsx · edit-orientation.tsx ·
    edit-photos.tsx · edit-preferences.tsx
```

**Supprimés au passage v2 → v3 (refonte 2026-06, suppression test/Maisons)** : `app/matchmaker/` (index + result), `app/maisons/`, `lib/kolmi/calculateDna.ts` (+ test) · composants `MatchmakerChat`, `AnswerOptions`, `DnaReveal`, `MaisonGlyph`, `ChatBubble`, `MatchmakerGreeting`, `MatchmakerTimeline`, `ChapterProgress`, `PhaseDivider`, `PressableScale`, `HairlineDivider`, `SelectedProfileCard`. Ne pas les recréer.

**Supprimés v1 → v2** : `onboarding/phone.tsx`, `vocal.tsx`, `lifestyle.tsx`, `preferences.tsx` · `profile/edit-height.tsx`, `edit-lifestyle.tsx` · racine `app/profile.tsx` · `hooks/useAudioRecorder.ts`, `lib/api.ts`, `lib/utils.ts`.

## Demo mode

`constants/kolmiConfig.ts` :
- `KOLMI_DEMO_MODE = false` (défaut bêta) → user neuf démarre sans rencontre, aucun mock seedé. Mettre à `true` UNIQUEMENT en local pour démos / screenshots. Ne **jamais** commit à `true`.
- `KOLMI_MOCK_DELAYS_FAST = true` → divise par 10 les délais de `mockBackend` (la simulation de "l'autre côté"). Repasser à `false` pour les démos sinon les transitions sont invisibles.

## GIGI — matchmaker IA (Claude)

- **Edge Function** `supabase/functions/matchmaker-chat/index.ts` : reçoit `{ message, history, user_context, available_profiles }`, renvoie `{ reply }`. Modèle `claude-haiku-4-5`, `max_tokens: 160` (messages très courts). Le **system prompt** définit la persona GIGI : matchmaker IA, ton personnel/amical, **vouvoiement TOUJOURS**, focalisée matchmaking (rebondit sur le small talk), tokens uniquement au RDV, **zéro mention de « Maison »**. Redéployer après édition : `SUPABASE_ACCESS_TOKEN=… supabase functions deploy matchmaker-chat --project-ref mcqdaplnjswacvifezdf --no-verify-jwt`.
- **Client** `lib/kolmi/matchmakerChat.ts` : `askMatchmaker({message, history, userContext, profiles})` via `supabase.functions.invoke`. Renvoie `null` en cas d'échec (réseau/quota) → fallback gracieux, jamais de crash.
- **Accueil (`conversation.tsx`)** : à la première construction du jour, on affiche la timeline locale puis on remplace l'accroche d'ouverture par un **appel de phare** généré par GIGI, **contextuel** selon l'état des meetings (rdv `completed` sans feedback → « comment c'était ? » ; `confirmed` → rdv à venir ; en attente → « pas encore de réponse » ; sinon découverte). Tout premier contact (flag `kolmi.gigi_introduced`) → mot de bienvenue au lieu d'une relance.
- **Chat (`matchmaker-chat/index.tsx`)** : maintient l'historique local ; on retire l'accroche assistant de tête avant l'appel (Claude exige un 1er message `user`).
- **Données DNA/Maisons — DORMANT** : `data/kolmiDna.ts` (8 Maisons), `lib/kolmi/matching.ts` (`rankProfilesByAffinity`), `data/kolmiQuestions.ts`, `conversationEngine.ts` existent toujours et sont importés, mais sans test `dna === null` partout → matching = passthrough, aucune Maison visible. À supprimer pour de bon = refactor transverse (types liés). Ne pas réactiver sans décision produit.
- Conversation du jour : `lib/kolmi/conversationEngine.ts` génère les events typés (`TimelineEvent`) + applique les décisions. Pure logique, persistée par dayKey.

## Supabase (câblé)

`lib/supabase.ts` exporte le client (URL + anon key inline, projet **`mcqdaplnjswacvifezdf`**). Storage = AsyncStorage, autoRefresh, persistSession. ⚠ Projet **free tier** : se met en pause après ~7 j d'inactivité (DNS NXDOMAIN → `Network request failed`). Réactiver via Management API : `POST https://api.supabase.com/v1/projects/mcqdaplnjswacvifezdf/restore`.

- **Edge Function `matchmaker-chat`** (GIGI / Claude) — déployée et ACTIVE, secret `ANTHROPIC_API_KEY` posé. Cf. section « GIGI » ci-dessus.

- **Session** — `lib/kolmi/session.ts`
  - `bootstrapSession()` au boot dans `app/_layout.tsx` : récupère la session, sinon `signInAnonymously()`. L'utilisateur a **toujours un user_id** pour passer RLS, même avant tout sign-in nominatif.
  - `useSession()` hook pour les écrans qui ont besoin de réagir à l'auth.

- **Sync (fire-and-forget)** — `lib/kolmi/sync.ts`. Appelée par `storage.ts` après chaque write local. **Ne bloque jamais l'UI**, ne throw jamais, log sur erreur. Cibles : tables `users`, `answers`, `meetings`, `tokens_ledger`, `passed_profiles`.

- **Lecture profils** — `lib/kolmi/fetchProfiles.ts` :
  - `fetchSelectableProfiles()` : tous les users `onboarding_complete && matchmaker_complete && dna_category_id IS NOT NULL`, sauf le current user. Fallback `mockSelectedProfiles` si DB vide / KO.
  - `getProfileByIdSync()` : lookup synchrone via cache module-level (hydraté par fetch), fallback mock. Utilisé par les screens `matches/[id]`, `meeting/*` qui restent synchrones.

- **Maisons** — `lib/kolmi/maisons.ts` : `fetchMaisons()` au boot pour valider la connexion DB. Fallback statique sur `data/kolmiDna.ts`.

- **Photos** — `lib/kolmi/photos.ts` : `uploadProfilePhoto(localUri, index)` vers bucket public `profile-photos`, chemin `<user_id>/<index>-<ts>.jpg`. `uploadProfilePhotos(uris)` upload en parallèle, garde l'URI local en fallback si échec.

- **Limite connue** — un `Meeting.profileId` mock (slug, pas UUID) n'est **pas** synchronisé vers `meetings` DB (no-op silencieux). Quand le matching réel arrivera, `profileId` sera un UUID de `users.id`.

## Storage (local-first + sync DB)

`lib/kolmi/storage.ts` reste la source de vérité côté app. Chaque mutation appelle aussi `sync*ToDb` en fire-and-forget — l'utilisateur ne paie jamais la latence réseau.

- **Caches mémoire** : profil, DNA, prefs, tokens, subscription, hasPurchased. Hydratés au premier read, invalidés au reset.
- **JSON corrupt-safe** : `getJson<T>(key, fallback)` catch les `JSON.parse` cassés, supprime la clé, renvoie le fallback.
- **Migration auto** : `getKolmiDnaResult()` wipe `dna_result` si le `categoryId` stocké n'existe plus dans le registre. (Les fonctions answers — `getKolmiAnswers`/`saveKolmiAnswer`/`clearKolmiAnswers` — et `saveKolmiDnaResult` ont été supprimées avec le test ; `getKolmiDnaResult` renvoie donc toujours `null` en pratique.)

Clés :
- `kolmi.progress` · `kolmi.dna_result` (dormant) · `kolmi.preferences` · `kolmi.profile`
- `kolmi.tokens` (+ `tokens_ledger` côté DB pour le delta avec raison)
- `kolmi.passed_profiles` · `kolmi.meetings`
- `kolmi.push_token` · `kolmi.subscription` · `kolmi.has_purchased`
- `kolmi.gigi_introduced` — GIGI s'est-elle déjà présentée (1er contact → mot de bienvenue)
- Conversations par jour : `kolmi.conversation.<YYYY-MM-DD>` (cf. `conversationEngine`)

**Astuce test** (simulateur) : pour forcer une conversation/intro fraîche sans tout reset, éditer le manifest AsyncStorage d'Expo Go et retirer les clés `kolmi.conversation.<jour>` / `kolmi.gigi_introduced` (sous `…/ExponentExperienceData/@anonymous/kolmi-app-*/RCTAsyncLocalStorage/manifest.json`) — app Expo Go terminée d'abord.

Mutations `meetings` (`saveMeeting`, `updateMeeting`, `deleteMeeting`) **throw** pour permettre les rollbacks (notamment `meeting/request` qui débite un token). Les autres mutations swallow + `console.warn`.

`resetKolmiState()` : wipe tout, y compris les conversations indexées par jour. Bouton dev "Recommencer l'onboarding" dans le tab Vous.

## File layout

```
constants/
  kolmiTheme.ts                # tokens design (couleurs, fonts, spacing, motion)
  kolmiConfig.ts               # KOLMI_DEMO_MODE, KOLMI_MOCK_DELAYS_FAST
assets/
  gigi-avatar.png              # avatar mascotte de GIGI (rond)
data/
  kolmiQuestions.ts            # DORMANT — questions de l'ancien test (3 axes)
  kolmiDna.ts                  # DORMANT — 8 Maisons (encore importé par matching)
  matchmakerCopy.ts            # banque de phrases italique/vouvoiement
                               # consommée par conversationEngine
  mockSelectedProfiles.ts      # ~10 profils mock (fallback fetchProfiles)
  mockMeetings.ts              # 3 seed meetings (DEMO_MODE only)
  mockVenues.ts                # 3 lieux pour confirm screen
lib/
  supabase.ts                  # client Supabase singleton
  kolmi/
    types.ts                   # KolmiDnaResult, Meeting, Venue, …
    matchmakerChat.ts          # askMatchmaker() → Edge Function GIGI (Claude)
    storage.ts                 # AsyncStorage + fire-and-forget sync DB
    safePersist.ts             # wrap mutation + Alert utilisateur si échec
    safeRead.ts                # wrap lecture + fallback si échec
    session.ts                 # bootstrapSession + useSession hook
    sync.ts                    # sync*ToDb writers
    fetchProfiles.ts           # fetch users + cache sync getProfileByIdSync
    maisons.ts                 # fetchMaisons (fallback statique)
    matching.ts                # scoreMaisonAffinity + rankProfilesByAffinity
    photos.ts                  # upload Storage profile-photos
    photoPicker.ts             # expo-image-picker + permission helper
    conversationEngine.ts      # logique pure timeline du jour, persistance
                               # par dayKey
    mockBackend.ts             # simule l'autre côté : accepte / décline /
                               # propose slots / feedback, via setTimeout +
                               # notif locale
    notifications.ts           # registerForPushNotificationsAsync (Expo push)
    haptics.ts                 # tapMedium / tapLight / select / success
    motion.ts                  # durations + easings (out-cubic, soft bezier)
components/kolmi/
  GrainOverlay · KolmiWordmark · SignupHeader · Wheel        # primitives
  EmptyKeyboardAccessory                                     # iOS quicktype kill
  SkeletonBlock                                              # micro-UI
  BreathingText · AnimatedCounter                            # text fx
  TypingIndicator                                            # frappe GIGI (chat)
  MatchmakerMessage · ConversationDayHeader
  ProfilePresentationCard · DecisionInline
  ProfileMiniRecap · ProfilePhotoPlaceholder
  EncountersSegmentedControl · SwipeToConfirm
```

## Conventions

- Path alias `@/*` résout depuis la racine du projet (`tsconfig.json`).
- TypeScript `strict: true`. Lancer `npm run typecheck` avant de claim "fini" (0 erreurs aujourd'hui).
- Tutoiement (`tu`) dans l'onboarding ; **GIGI et tout le post-onboarding vouvoient (`vous`)**, toujours (même en ton amical).
- Ne jamais lancer un 2ᵉ `npx expo start` — un seul Metro tient le port 8081. Recharger via Cmd+R dans le simulateur.
- Map keys uniques. `profile.id` ou `${profile.id}-${i}`, jamais `key={i}` sur du contenu.
- **Sync DB** : appeler `fireAndForget(syncXToDb(...))` après chaque write local, jamais `await`. L'UI ne doit pas dépendre du round-trip Supabase.

## Banned strings (copy utilisateur)

- `Message`, `DM`, `envoyer un message` **entre users** (le chat avec GIGI, user ↔ IA, est OK et s'appelle « chat »).
- `swipe`
- `VoiceMatch`
- « Maison », typologie, ADN, catégorie de personnalité dans la **copy utilisateur** (concept retiré — GIGI ne doit jamais les mentionner).

(Note : « conversation » = la timeline éditoriale du tab central, son nom officiel dans le code.)

## Running test / typecheck

```sh
npm run typecheck   # tsc --noEmit
npm run check       # typecheck + jest
```
