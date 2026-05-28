# KOLMI app — context for future sessions

French AI-matchmaking iOS app. Expo + React Native + TypeScript, expo-router for navigation. **Supabase est câblé** (auth anonyme au boot, sync profil/réponses/DNA/tokens/meetings, upload photos Storage, fetch Maisons). Anthropic SDK installé mais **jamais appelé côté client** — toute logique IA doit transiter par une Edge Function (la clé ne doit pas finir dans le bundle).

## Product model — concierge, no chat

KOLMI est un **matchmaker concierge**. L'IA présente des profils curés dans une *conversation du jour* éditoriale, l'utilisateur dépense un token pour demander une rencontre, l'app coordonne acceptation, créneaux, lieu.

> **KOLMI n'a pas de chat user-à-user. Les rencontres sont coordonnées par l'app via demandes, tokens, créneaux, et lieu assigné.**

Règles dures — ne jamais transgresser :
- Pas de `Message`, `Chat`, `DM`, `Conversation` *entre users* dans l'UI.
- Le mot **`conversation`** dans le code désigne **la timeline éditoriale du tab central** (le user lit le matchmaker, ne discute pas avec un match). Ne jamais détourner ce nom pour un chat user-à-user.
- Pas de "swipe", pas d'héritage VoiceMatch.
- Anthropic SDK importé dans `package.json` mais **aucun fichier `lib/api.ts`** : la décision a été tranchée — pas de stub côté client, on appellera la fonction serveur le jour où on en a besoin.

## Run

```sh
npx expo start --ios --localhost   # localhost flag obligatoire — le mode LAN
                                   # casse la connexion simulateur → Metro sur ce Mac.
```

Simulateur dédié : **iPhone 17 Kolmi** (UDID `A24D05B3-6A2B-4A1F-B321-6038797BB3F8`). Si `expo start --ios` ouvre le mauvais, le booter à la main :
`xcrun simctl boot A24D05B3-6A2B-4A1F-B321-6038797BB3F8 && open -a Simulator`.

Test sur device physique : `npx expo start --tunnel`, scanner le QR (Expo Go) ou `qrencode -t ANSIUTF8 "exp://<tunnel>.exp.direct"`.

## Visual design system

Cream paper editorial. Source de vérité : `constants/kolmiTheme.ts`. **Toujours passer par les tokens**, jamais de valeurs hardcodées (sauf dans le matchmaker chat qui utilise littéralement `#16130F` / `#FAF8F5` / `#E2CBA8` per spec).

- **Couleurs** — bg cream `#F5F1EA`, text `#0A0A0A` / dark text `#16130F`, light text `#FAF8F5`, accent bordeaux `#8B1A1A`, outline `rgba(26,26,26,0.2)`, surface soft `#E8E2D6`. Jamais de bleu / violet.
- **Fonts** —
  - `kolmiFonts.serif` (DM Serif Display 400) pour les titres
  - `kolmiFonts.serifItalic` pour les prompts entre guillemets et captions italiques
  - `kolmiFonts.script` (Homemade Apple) pour le wordmark "kolmi"
  - `kolmiFonts.ui` / `uiMedium` / `uiSemiBold` (Inter) pour body, labels, CTA
  - `kolmiFonts.serifLegacy` (Fraunces) pour wheel date / drum hauteur uniquement
  - `'Georgia'` (system) pour l'avatar "A" du matchmaker
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
  index.tsx                        → lit progress + dna_result, redirige vers :
                                     /onboarding/welcome | /matchmaker | /(tabs)/conversation
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
                                   ready.tsx termine par :
                                     await saveKolmiProgress({ hasCompletedBaseOnboarding: true })
                                     router.replace('/matchmaker')

  auth/                            → flux email (modal, alternative à Apple/Google)
    email.tsx                      → saisie email, envoi OTP via supabase.auth
    verify.tsx                     → code à 6 chiffres

  matchmaker/
    index.tsx                      → <MatchmakerChat /> (le QUIZ — Q&A guidée
                                     avec l'IA, PAS un chat entre users)
    result.tsx                     → DNA result + "Découvrir mes profils" → /(tabs)/conversation

  (tabs)/
    _layout.tsx                    → 3 tabs visibles : Rencontres · · Vous
                                     Le tab central porte un point bordeaux
                                     (hot) si la conversation du jour n'est
                                     pas terminée. `index` reste pour
                                     rediriger les vieux deeplinks (href:null).
    conversation.tsx               → timeline éditoriale du jour (cœur de l'app) :
                                     profils présentés un par un + décisions
                                     inline (Demander / Pas pour moi).
    encounters.tsx                 → rencontres groupées par bucket (statuts).
    profile.tsx                    → Maison, tokens, profil, prefs, compte,
                                     SubscriptionPromoCard (free users).

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

**Écrans supprimés au passage v1 → v2** : `onboarding/phone.tsx`, `verify.tsx`, `vocal.tsx`, `lifestyle.tsx`, `preferences.tsx` · `profile/edit-height.tsx`, `edit-lifestyle.tsx` · racine `app/profile.tsx`. Avec eux : `hooks/useAudioRecorder.ts`, `lib/api.ts` (stub Anthropic), `lib/utils.ts` (formatDuration). Ne pas les recréer.

## Demo mode

`constants/kolmiConfig.ts` :
- `KOLMI_DEMO_MODE = false` (défaut bêta) → user neuf démarre sans rencontre, aucun mock seedé. Mettre à `true` UNIQUEMENT en local pour démos / screenshots. Ne **jamais** commit à `true`.
- `KOLMI_MOCK_DELAYS_FAST = true` → divise par 10 les délais de `mockBackend` (la simulation de "l'autre côté"). Repasser à `false` pour les démos sinon les transitions sont invisibles.

## Matchmaker logic

- Questions dans `data/kolmiQuestions.ts`. Chaque `QuestionOption` a `axes?: Partial<Record<KolmiAxis, number>>`. **3 axes binaires** : `intensity` (ardent/calm), `rhythm` (fast/slow), `openness` (open/selective) → 2³ = 8 Maisons.
- **8 Maisons** (`data/kolmiDna.ts`) : `gigi` · `amare` · `solea` · `terracotta` · `fiora` · `lumi` · `calia` · `vesna`. Chacune a `title`, `subtitle`, `description`, `traits`, ses `axes`, et 2 Maisons `compatible` curées éditorialement.
- `lib/kolmi/calculateDna.ts` somme les `option.axes` en `KolmiAxisScores` signés, puis mappe vers une `DnaCategoryId`. Pôle "doux" (calm/slow/selective) gagne sur égalité (0).
- Matching profils → user : `lib/kolmi/matching.ts` score `scoreMaisonAffinity` ∈ [0, 4] (4 = même Maison, 3 = curée compatible, 0-3 = nombre d'axes en accord). `rankProfilesByAffinity` filtre score ≥ 2 et trie.
- Conversation du jour : `lib/kolmi/conversationEngine.ts` génère une suite d'events typés (`TimelineEvent`) à partir des profils du jour et applique les décisions. Pure logique, pas d'UI. Persistée par dayKey.

## Supabase (câblé)

`lib/supabase.ts` exporte le client (URL + anon key inline, projet `hvsjdiuumrburvmjohnb`). Storage = AsyncStorage, autoRefresh, persistSession.

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
- **Migration auto** : si le `categoryId` stocké n'existe plus dans le registre (ancienne version 16-Maisons → 8 actuelles), on wipe `dna_result` + `answers` → le user repasse le matchmaker.

Clés :
- `kolmi.progress` · `kolmi.answers` · `kolmi.dna_result` · `kolmi.preferences` · `kolmi.profile`
- `kolmi.tokens` (+ `tokens_ledger` côté DB pour le delta avec raison)
- `kolmi.passed_profiles` · `kolmi.meetings`
- `kolmi.push_token` · `kolmi.subscription` · `kolmi.has_purchased`
- Conversations par jour : `kolmi.conversation.<YYYY-MM-DD>` (cf. `conversationEngine`)

Mutations `meetings` (`saveMeeting`, `updateMeeting`, `deleteMeeting`) **throw** pour permettre les rollbacks (notamment `meeting/request` qui débite un token). Les autres mutations swallow + `console.warn`.

`resetKolmiState()` : wipe tout, y compris les conversations indexées par jour. Bouton dev "Recommencer l'onboarding" dans le tab Vous.

## File layout

```
constants/
  kolmiTheme.ts                # tokens design (couleurs, fonts, spacing, motion)
  kolmiConfig.ts               # KOLMI_DEMO_MODE, KOLMI_MOCK_DELAYS_FAST
data/
  kolmiQuestions.ts            # questions matchmaker, scoring 3 axes
  kolmiDna.ts                  # 8 Maisons (gigi, amare, solea, terracotta,
                               # fiora, lumi, calia, vesna)
  matchmakerCopy.ts            # banque de phrases mat / italique / vouvoiement
                               # consommée par conversationEngine
  mockSelectedProfiles.ts      # ~10 profils mock (fallback fetchProfiles)
  mockMeetings.ts              # 3 seed meetings (DEMO_MODE only)
  mockVenues.ts                # 3 lieux pour confirm screen
lib/
  supabase.ts                  # client Supabase singleton
  kolmi/
    types.ts                   # KolmiAnswer, KolmiDnaResult, Meeting, Venue
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
    calculateDna.ts            # scoring → categoryId
    haptics.ts                 # tapMedium / tapLight / select / success
    motion.ts                  # durations + easings (out-cubic, soft bezier)
    __tests__/calculateDna.test.ts
components/kolmi/
  GrainOverlay · KolmiWordmark · SignupHeader · Wheel        # primitives
  EmptyKeyboardAccessory                                     # iOS quicktype kill
  HairlineDivider · SkeletonBlock · PressableScale           # micro-UI
  BreathingText · AnimatedCounter                            # text fx
  ChatBubble · TypingIndicator · AnswerOptions · PhaseDivider
  ChapterProgress · MatchmakerChat · MatchmakerGreeting      # ⚠ MATCHMAKER QUIZ
                                                             # UI, jamais user-to-user
  MatchmakerMessage · MatchmakerTimeline · ConversationDayHeader
  ProfilePresentationCard · SelectedProfileCard · DecisionInline
  ProfileMiniRecap · ProfilePhotoPlaceholder
  EncountersSegmentedControl · SwipeToConfirm
  DnaReveal · MaisonGlyph                                    # reveal résultat DNA
```

## Conventions

- Path alias `@/*` résout depuis la racine du projet (`tsconfig.json`).
- TypeScript `strict: true`. Lancer `npm run typecheck` avant de claim "fini" (0 erreurs aujourd'hui).
- Tutoiement (`tu`) dans l'onboarding ; vouvoiement (`vous`) dans le matchmaker et tout le post-onboarding.
- Les literals du matchmaker chat (`#16130F`, `#FAF8F5`, `#E2CBA8`, `'Georgia'`) sont délibérés — ne pas les refactorer en tokens.
- Ne jamais lancer un 2ᵉ `npx expo start` — un seul Metro tient le port 8081. Recharger via Cmd+R dans le simulateur.
- Map keys uniques. `profile.id` ou `${profile.id}-${i}`, jamais `key={i}` sur du contenu.
- **Sync DB** : appeler `fireAndForget(syncXToDb(...))` après chaque write local, jamais `await`. L'UI ne doit pas dépendre du round-trip Supabase.

## Banned strings (copy utilisateur)

- `Message`, `chat` (label UI user-à-user), `DM`, `envoyer un message`, `écrire un message`
- `swipe`
- `VoiceMatch`
- Toute promesse d'analyse IA non câblée (Anthropic n'est pas appelé côté client).

(Note : le mot "conversation" est OK pour la timeline éditoriale du tab central, c'est son nom officiel dans le code.)

## Running test / typecheck

```sh
npm run typecheck   # tsc --noEmit
npm run check       # typecheck + jest
```
