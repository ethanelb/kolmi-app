# KOLMI app — context for future sessions

French AI-matchmaking iOS app. Expo + React Native + TypeScript, expo-router for navigation. Supabase + Anthropic SDK pre-wired but **not yet used** (storage is local AsyncStorage in v1).

## Product model — concierge, no chat

KOLMI is a **matchmaker concierge** app. The IA matchmaker presents curated profiles, the user spends tokens to request a meeting, and the app coordinates acceptance, availability, slot, and venue.

> **KOLMI has no direct user-to-user chat. Meetings are coordinated by the app through requests, tokens, availability, and venue assignment.**

Hard rules — do not violate:
- No `Message`, `Chat`, `DM`, `Conversation` UI between users.
- No `/conversations` route, no free-text messaging.
- No "swipe", no VoiceMatch heritage.
- The word `conversation` is allowed only at the human/IRL sense (e.g. real-life meeting talk), never as a chat screen label.
- Anthropic / Supabase SDKs are imported in `package.json` but **not** wired client-side — see `lib/api.ts`. All AI calls must go through a server-side function later.

## Run

```sh
npx expo start --ios --localhost   # localhost flag is important — LAN mode breaks
                                   # the simulator → Metro connection on this Mac.
```

The booted iOS simulator is named **iPhone 17 Kolmi** (UDID `A24D05B3-6A2B-4A1F-B321-6038797BB3F8`). If `expo start --ios` opens a different one, boot Kolmi manually first: `xcrun simctl boot A24D05B3-6A2B-4A1F-B321-6038797BB3F8 && open -a Simulator`.

For testing on a physical device, use `npx expo start --tunnel` and either scan the QR (Expo Go) or `qrencode -t ANSIUTF8 "exp://<tunnel>.exp.direct"`.

## Visual design system

Cream paper editorial. Source of truth: `constants/kolmiTheme.ts`. **Use these tokens, never hardcoded values** (except inside the matchmaker chat which uses `#16130F`/`#FAF8F5`/`#E2CBA8` literals per the standalone-3 spec).

- **Colors** — bg cream `#F5F1EA`, text `#0A0A0A` / dark text `#16130F`, light text `#FAF8F5`, accent bordeaux `#8B1A1A`, outline `rgba(26,26,26,0.2)`, surface soft `#E8E2D6`. Never blue / purple / violet.
- **Fonts** —
  - `kolmiFonts.serif` (DM Serif Display 400) for titles
  - `kolmiFonts.serifItalic` for in-quote prompts and italic captions
  - `kolmiFonts.script` (Caveat 600) for the "kolmi" wordmark
  - `kolmiFonts.ui` / `uiMedium` / `uiSemiBold` (Inter) for body, labels, CTA text
  - `kolmiFonts.serifLegacy` / `serifLegacyRegular` (Fraunces) only for date wheel + height drum
  - `'Georgia'` (system) for the matchmaker avatar "A" glyph
- **Layout** — `kolmiPaddingX = 24` is the standard horizontal padding. Buttons are 56px tall, `borderRadius: kolmiRadius.pill`.
- **Grain** — every screen wraps content in a root `View` with `<GrainOverlay />` as the first child for the paper texture.

Screen pattern:

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
  index.tsx                        → reads progress + dna_result, redirects to:
                                     /onboarding/welcome | /matchmaker | /(tabs)
  _layout.tsx                      → font loader + Stack
  onboarding/
    _layout.tsx
    welcome.tsx                    (entry)
    phone.tsx → verify.tsx → birthday.tsx → name.tsx → gender.tsx →
    orientation.tsx → height.tsx → lifestyle.tsx → photos.tsx →
    vocal.tsx → preferences.tsx
                                   preferences ends with:
                                     await saveKolmiProgress({ hasCompletedBaseOnboarding: true })
                                     router.replace('/matchmaker')
  matchmaker/
    index.tsx                      → renders <MatchmakerChat /> (the matchmaker
                                     QUIZ — a guided question flow, not a chat
                                     between users)
    result.tsx                     → DNA result + "Découvrir mes profils" → /(tabs)
  (tabs)/
    _layout.tsx                    → 4 tabs: Sélection / Découvrir / Rendez-vous / Profil
    index.tsx                      → Sélection : 3-5 profils du jour, "Pas pour moi"
                                     persiste (passProfile)
    discover.tsx                   → Découvrir : 3 sections mutuellement exclusives
    dates.tsx                      → Rendez-vous : meetings groupés par bucket
    profile.tsx                    → Dashboard : Maison, tokens, profil, prefs, compte
  matches/[id].tsx                 → fiche profil détaillée + CTA "Demander une
                                     rencontre" / "Pas pour moi"
  meeting/
    request/[id].tsx               → confirme la demande + débit token (saveMeeting
                                     d'abord, spendToken ensuite, rollback si échec)
    schedule/[id].tsx              → choix 2-3 créneaux ; passe à status='confirmed'
                                     avec confirmedSlot + venueId mock
    confirm/[id].tsx               → fiche RDV confirmée (slot + venue + mot du
                                     matchmaker)
  premium/index.tsx                → 3 packs de tokens — bêta privée, achat simulé
                                     (aucun paiement réel, addTokens local)
  profile.tsx                      → édition profil détaillé (prénom + photos +
                                     style de vie)
```

## Demo mode

`constants/kolmiConfig.ts` exports `KOLMI_DEMO_MODE`. When `true` (default), the dates tab pre-populates with seed mock meetings (Sarah / Noa / Anna) so the UI is never empty during demos. Set to `false` for real beta users — they then start with no meetings until they request one themselves.

## Matchmaker logic

- Questions in `data/kolmiQuestions.ts`: **16 main** in 4 phases (`warmup` 4 / `emotional_core` 5 / `lucidity` 4 / `depth` 3) + **8 bonus** (`bonus_dna`, `isBonus: true`).
- Each `QuestionOption` has `scores?: Partial<Record<KolmiDimension, number>>`. The 10 dimensions are spec-side (`attachment`, `emotionalAvailability`, `communication`, `commitment`, `independence`, `conflict`, `romanticIntensity`, `lifestyle`, `values`, `socialEnergy`).
- DNA categories (Maisons) in `data/kolmiDna.ts`: 16 cultural Maisons. All `dnaCategories` content is inferred (not in the source HTML).
- `dnaLabels` (16 keys) and `dnaDescriptions` (4 keys) are verbatim from the HTML and are separate from the Maison system.
- `lib/kolmi/calculateDna.ts` sums `option.scores` into `KolmiDimensionScores` and maps to a `DnaCategoryId` via `mapScoresToCategory`.

## Storage (v1, local-only)

`lib/kolmi/storage.ts` wraps `@react-native-async-storage/async-storage`. All reads go through `getJson<T>(key, fallback)` which catches corrupt JSON, removes the key, and returns the fallback rather than crashing the app.

Keys:
- `kolmi.progress` → `{ hasCompletedBaseOnboarding, hasCompletedMatchmaker }`
- `kolmi.answers` → `KolmiAnswer[]`
- `kolmi.dna_result` → `KolmiDnaResult`
- `kolmi.preferences` → `KolmiPreferences`
- `kolmi.profile` → `KolmiProfile`
- `kolmi.tokens` → string-encoded number
- `kolmi.passed_profiles` → `string[]`
- `kolmi.meetings` → `Meeting[]`

Mutations on `meetings` (`saveMeeting`, `updateMeeting`, `deleteMeeting`) intentionally **throw** on failure so callers (notably `meeting/request`) can roll back partial state. Other mutations swallow errors with a `console.warn`.

`resetKolmiState()` wipes all keys (used by the dev "Recommencer l'onboarding" button in the Profil tab).

## File layout

```
constants/
  kolmiTheme.ts                # design tokens
  kolmiConfig.ts               # KOLMI_DEMO_MODE
data/
  kolmiQuestions.ts            # 16 + 8 questions, 10-dim scoring
  kolmiDna.ts                  # 16 inferred Maisons + verbatim labels/descriptions
  mockSelectedProfiles.ts      # 6 profiles for Sélection / Découvrir / matches
  mockMeetings.ts              # 3 seed meetings for the dates tab (DEMO_MODE only)
  mockVenues.ts                # 3 venues for meeting confirm
lib/
  api.ts                       # callKolmiAI() stub — throws. NO client-side
                               # Anthropic key. Must go through server.
  utils.ts                     # formatDuration, formatRelativeTime
  kolmi/
    types.ts                   # KolmiAnswer, KolmiDnaResult, Meeting, Venue, …
    storage.ts                 # AsyncStorage wrapper with corrupt-JSON safety
    calculateDna.ts            # scoring → category mapping
    haptics.ts                 # tapMedium / tapLight / select / success
hooks/
  useAudioRecorder.ts          # used only by onboarding/vocal.tsx (expo-av)
components/kolmi/
  GrainOverlay, KolmiWordmark, SignupHeader, Wheel  # primitives
  EmptyKeyboardAccessory       # iOS QuickType bar suppressor
  ChatBubble, TypingIndicator, AnswerOptions, PhaseDivider, MatchmakerChat
                               # ⚠ "ChatBubble" / "MatchmakerChat" refer to the
                               # matchmaker QUIZ UI — guided Q&A with the IA.
                               # NEVER add user-to-user chat reusing these.
  MatchmakerGreeting, SelectedProfileCard
  DnaReveal                    # animated DNA result reveal
```

## Conventions

- Path alias `@/*` resolves to project root (configured in `tsconfig.json`).
- TypeScript `strict: true`. Run `npm run typecheck` before declaring done (currently 0 errors).
- Onboarding screens use `tu` ; matchmaker + post-onboarding use `vous`.
- The matchmaker chat literals (`#16130F`, `#FAF8F5`, `#E2CBA8`, `'Georgia'`) are deliberate — don't refactor them into theme tokens.
- Never start a second `npx expo start` — only one Metro can hold port 8081. Reload the running one with Cmd+R in the simulator.
- Map keys MUST be unique. Use `profile.id` or `${profile.id}-${i}` (never bare `key={i}` for content lists).

## Banned strings in user-facing copy

- `Message`, `chat`, `conversation` (UI label), `DM`, `envoyer un message`, `écrire un message`
- `swipe`
- `VoiceMatch`
- Any text promising AI analysis that isn't actually wired — `lib/api.ts` does not call Anthropic.

## Running the test/typecheck pass

```sh
npm run typecheck   # tsc --noEmit
npm run check       # typecheck + jest
```
