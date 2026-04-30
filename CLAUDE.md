# KOLMI app — context for future sessions

French AI-matchmaking iOS app. Expo + React Native + TypeScript, expo-router for navigation. Supabase + Anthropic SDK pre-wired but **not yet used** (storage is local AsyncStorage in v1).

The visual reference is `KOLMI standalone-3.html` in `~/Downloads/`. Decoded copy at `/tmp/kolmi_decoded.html` if it still exists.

## Run

```sh
npx expo start --ios --localhost   # localhost flag is important — LAN mode breaks
                                   # the simulator → Metro connection on this Mac.
```

The booted iOS simulator is named **iPhone 17 Kolmi** (UDID `A24D05B3-6A2B-4A1F-B321-6038797BB3F8`). If `expo start --ios` opens a different one, boot Kolmi manually first: `xcrun simctl boot A24D05B3-6A2B-4A1F-B321-6038797BB3F8 && open -a Simulator`.

## Visual design system

Cream paper editorial. Source of truth: `constants/kolmiTheme.ts`. **Use these tokens, never hardcoded values** (except inside the matchmaker chat which uses `#16130F`/`#FAF8F5`/`#E2CBA8` literals per the standalone-3 spec).

- **Colors** — bg cream `#F5F1EA`, text `#0A0A0A`, accent bordeaux `#8B1A1A`, outline `rgba(26,26,26,0.2)`, surface soft `#E8E2D6`.
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
  index.tsx                  → reads getKolmiProgress(), redirects to:
                               /onboarding/welcome | /matchmaker | /home
  _layout.tsx                → font loader + Stack
  onboarding/
    _layout.tsx
    welcome.tsx              (entry; "Un vrai date. / Sans ~swipe~.")
    phone.tsx → verify.tsx → birthday.tsx → name.tsx → gender.tsx →
    orientation.tsx → height.tsx → lifestyle.tsx → photos.tsx →
    vocal.tsx → preferences.tsx
                              preferences ends with:
                                await saveKolmiProgress({ hasCompletedBaseOnboarding: true })
                                router.replace('/matchmaker')
  matchmaker/
    index.tsx                → renders <MatchmakerChat />
    result.tsx               → DNA result + "Découvrir mes profils" → /home
  home/
    index.tsx                → matchmaker greeting + 3 SelectedProfileCard
  matches/[id].tsx           → profile detail + CTA "icebreakers" / "date"
  conversations/[id].tsx     → 3 icebreakers + free-text chat (no audio)
  date/plan.tsx              → 3 time slots + "Confirmer l'intention" (TODO Stripe)
  premium/index.tsx          → 3 tiers (Essential / Plus / Concierge)
```

## Matchmaker logic

- Questions in `data/kolmiQuestions.ts`: **16 main** in 4 phases (`warmup` 4 / `emotional_core` 5 / `lucidity` 4 / `depth` 3) + **8 bonus** (`bonus_dna`, `isBonus: true`). Source: AURIA_DATA.onboardingQuestions in `KOLMI standalone-3.html` lines 707–947.
- Each `QuestionOption` has `scores?: Partial<Record<KolmiDimension, number>>`. The 10 dimensions are spec-side (`attachment`, `emotionalAvailability`, `communication`, `commitment`, `independence`, `conflict`, `romanticIntensity`, `lifestyle`, `values`, `socialEnergy`). Scores were authored at extraction time (1–3 per dimension, 1–2 dims per option) — they are tunable.
- DNA categories (Maisons) in `data/kolmiDna.ts`: 16 cultural Maisons (Gainsbourg / Duras / Saint-Laurent / Arda / Simone / Cocteau / Varda / Camus / Sagan / Piaf / Godard / Chagall / Baldwin / Kahlo / Matisse / Borges). **All `dnaCategories` content is inferred — not in the source HTML** (which uses a different orthogonal trait system: `stable`, `passionne`, etc.). Each entry is marked `// inferred — not in HTML`. Review the French copy before shipping.
- `dnaLabels` (16 keys) and `dnaDescriptions` (4 keys) are verbatim from the HTML and are **separate** from the Maison system above.
- `lib/kolmi/calculateDna.ts` sums `option.scores` into `KolmiDimensionScores` and maps to a `DnaCategoryId` via heuristic combos (`mapScoresToCategory`). Default fallback picks the highest dimension.

## Storage (v1, local-only)

`lib/kolmi/storage.ts` wraps `@react-native-async-storage/async-storage`:

- `kolmi.progress` → `{ hasCompletedBaseOnboarding, hasCompletedMatchmaker }`
- `kolmi.answers` → `KolmiAnswer[]`
- `kolmi.dna_result` → `KolmiDnaResult`

All write helpers have a `// TODO Supabase sync later` marker. `resetKolmiState()` wipes all three keys (handy for re-testing the flow).

## File layout

```
constants/kolmiTheme.ts
data/
  kolmiQuestions.ts          # 16 + 8 questions, 10-dim scoring
  kolmiDna.ts                # 16 inferred Maisons + verbatim labels/descriptions
  mockSelectedProfiles.ts    # 3 mock profiles for /home and /matches/[id]
lib/
  api.ts                     # Anthropic + Supabase clients, unused for now
  utils.ts                   # formatDuration, formatRelativeTime
  kolmi/
    types.ts                 # KolmiAnswer, KolmiDimensionScores, KolmiDnaResult
    storage.ts               # AsyncStorage wrapper
    calculateDna.ts          # scoring → category mapping
hooks/
  useAudioRecorder.ts        # used only by onboarding/vocal.tsx (expo-av)
components/kolmi/
  GrainOverlay, KolmiWordmark, SignupHeader, Wheel  # primitives
  ChatBubble, TypingIndicator, AnswerOptions, PhaseDivider, MatchmakerChat
  MatchmakerGreeting, SelectedProfileCard
  DnaResultCard, DnaScoreBars
```

## Conventions

- Path alias `@/*` resolves to project root (configured in `tsconfig.json`).
- TypeScript is `strict: true`. Run `npx tsc --noEmit` before declaring done. Currently 0 errors.
- Onboarding screens use `tu` ; matchmaker + post-onboarding use `vous` (matches the source HTML tone).
- The matchmaker chat literals (`#16130F`, `#FAF8F5`, `#E2CBA8`, `'Georgia'`) are deliberate — they come from the standalone-3 spec for the bot avatar + bubbles. Don't refactor them into theme tokens unless the design changes.
- Never start a second `npx expo start` — only one Metro can hold port 8081. Reload the running one with Cmd+R in the simulator.

## Removed (was VoiceMatch heritage, now nuked)

- `app/(tabs)/`, `app/match/[id].tsx`, `app/settings.tsx`
- `components/SwipeCard`, `MatchCard`, `RecordButton`, `WaveformPlayer`, `KolmiLogo`
- `components/onboarding/OnboardingHeader.tsx`
- `hooks/useAudioPlayer.ts`
- `constants/theme.ts` (orange palette)
- `lib/mock-data.ts`

`expo-av` was kept (vocal onboarding still records via `useAudioRecorder`).
