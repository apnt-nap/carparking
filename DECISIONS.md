# Decisions

Non-obvious choices, with the spec section they relate to.

## Milestone 1

- **Sample data (§3, §9).** Mall coordinates are approximate. Addresses, hours and fees are made up, and every fee summary says "sample data". The Robinson branch is Lat Krabang and the Lotus's branch is Rama 4; both were chosen only to have one Bangkok branch each. Check coordinates before any demo.
- **Floor order.** `levels` in `malls.json` is ordered from the floor closest to the mall (index 0) outwards. The simulator fills low-order floors first. Each `Floor` gets an `order` field, which isn't in the §5 summary.
- **Floor layout (FR-9).** Every floor is a set of horizontal aisles with a one-way serpentine route from the entry ramp to the exit ramp. It's simple, guarantees every bay is reachable, and gives Milestone 2 a real one-way graph to route on. Real mall layouts would replace it through `ParkingProvider`.
- **Lane graph.** There is one node per bay column on each aisle. Each bay has a `node` field (where a car stops to turn in) and a `lift_distance_m` field (straight-line distance to the lift lobby). These are additions to the §5 summary that make routing (FR-12) a plain shortest-path search.
- **Special bays (FR-7).** On each floor, the 4 bays nearest the lifts are accessible, the next 4 are family bays, and the 6 farthest are EV chargers.
- **Simulator (§3, FR-11).** It ticks every 3 s and re-rolls 3% of each floor's bays against a target occupancy. The target depends on Bangkok time (UTC+7: weekends and 11:00–20:00 are busier), on floor order and on distance to the lifts. Targets are clamped to 2–98%, so a floor is never completely full or empty.
- **Fees (FR-8, FR-23).** After the free period, every started hour is charged in full. There is no daily cap, because the spec doesn't ask for one.
- **Search (FR-16).** Queries are normalised (lowercase, spaces and apostrophes removed), so "Central World" = "centralworld" and "Lotus's" = "lotuss". Fuse.js is used with threshold 0.3. Aliases live in `malls.json`.
- **Users (phase 2).** There are no accounts yet. Plate and ticket endpoints identify the user with an `x-user-id` header. This must be replaced with real auth before storing real plates.
- **Plates (FR-21, NFR-5).** Plate format is checked as an optional digit, 1–2 Thai consonants and 1–4 digits. The province is only checked to be Thai text, not against the list of 77 provinces. Logs only contain a salted SHA-256 hash. Deleting a plate also deletes its tickets. Data is in memory, so it resets when the server restarts.
- **Floors data file.** `floors.json` is generated and committed (about 850 KB). A test checks that it matches the generator output, so the two can't drift apart.
- **WebSocket.** The server uses `ws` directly on Fastify's HTTP server rather than a Fastify plugin, following the spec's stack. Clients can filter with `?mall=` or `?floor=`.

## Milestone 2

- **Expo SDK 58** with Expo Router (`app/src/app/`), React Native 0.88, React 19.3. The root `package.json` pins React to 19.3.0, because a library pulled in 19.3.1 and expo-doctor flags duplicate React copies.
- **Shared types.** The app imports the server's `server/src/types.ts` with `import type`, so the API types can't drift apart. Type-only imports are removed at build time, so Metro never bundles server code.
- **Search (FR-16) runs on the server.** The app calls `GET /search`, which already uses fuse.js with the Thai/English alias list. This keeps one search implementation for typed and spoken text, instead of a second copy in the app.
- **Voice (FR-17).** `expo-speech-recognition` is a native module and isn't in Expo Go. The app loads it lazily: in Expo Go the mic button explains that voice needs a development build, and everything else keeps working. Voice language follows the app language, with a th-TH/en-US toggle. Thai recognition depends on the phone's speech service (the library doesn't list supported locales), so it needs testing on a real device.
- **Routing (FR-12, FR-13).** Dijkstra runs on the lane graph and respects one-way edges, starting at the entry ramp. "Near the ramp" picks the free bay with the shortest drive. "Near the mall entrance" picks the free bay closest to the lifts, using drive distance as a tie-break. Special bays (EV, accessible, family) are not suggested automatically, but users can tap one to route to it. If a tapped bay is taken before the user arrives, the app falls back to the suggestion.
- **Live updates (FR-11).** The floor screen subscribes to `WS /live?floor=<id>` and patches the cached floor, reconnecting every 2 s after a drop. Mall screens refetch counts every 5 s, and the map every 15 s, which is simpler than a socket for totals.
- **Floor plan.** It is drawn as SVG in metres (the plan's viewBox), with pinch-zoom (1–6×) and pan from Gesture Handler 3 and Reanimated. Bays are a memoised layer, so zooming doesn't redraw them.
- **Accessibility (NFR-4).** Taken bays are grey and crossed out, special bays have icons, and markers show the free count as well as the colour. Buttons and rows are at least 44 pt. Bays and markers have screen-reader labels. A single bay is only about 9 pt wide at full zoom-out, so users zoom in to tap one; the suggested-bay card and "I parked here" button work without tapping a bay.
- **"I parked here" (FR-15)** is stored on the phone (AsyncStorage). It shows on the map tab, in Settings, and as 🚗 on the floor plan.
- **Language (FR-19).** It defaults to the phone's language (Thai if the phone is in Thai, otherwise English), and the choice in Settings is saved. A test checks that Thai and English have the same keys.
- **Maps.** `react-native-maps` uses Apple Maps on iOS and Google Maps on Android. Expo Go works without setup, but an Android release build needs a Google Maps API key in `app.json`.
- **Not measured yet:** NFR-2 (under 2 s on 4G) needs a real phone. Each screen makes a single small request.

## Milestone 3

- **Consent (FR-21).** Asia decided that users must register and accept a Terms & Agreement screen (including PDPA consent) before plate entry can be used. The feature stays locked until they accept. For the prototype, the existing server check (`consent: true` required on `POST /plates`) is enough on the server side.
- **Terms screen.** `TermsForm` has two separate boxes, one for the Terms & Agreement and one for PDPA consent. Both start unticked, and Accept stays disabled until both are ticked. Acceptance is saved on the phone with a terms version (`TERMS_VERSION` in `app/src/lib/user.ts`). Changing the version makes users accept again. The terms text is sample wording for the prototype, not legal advice, and needs a lawyer before real use.
- **Withdrawing consent** deletes every plate on the server first, which also deletes their tickets, and then locks the feature again. Deleting one plate asks for confirmation first.
- **User id.** There are no accounts yet. Each install creates a random id, saved on the phone and sent as `x-user-id`. Reinstalling the app loses access to its plates, which is acceptable for the prototype; real sign-in is needed before real plates.
- **Plate check.** The app shows the server's validation result (the server is the trust boundary) as a friendly Thai or English message, instead of duplicating the regex in the app.
- **Gate simulator (FR-25)** is hidden behind a long-press on the "My licence plates" title. It can also send an "unregistered car" to show the FR-24 fallback.
- **E-tickets** refresh every 10 s, so the running fee goes up while the screen is open. The spec's §10 suggestion of alerting the user on every entry (against cloned plates) would need push notifications. That is not built yet.

## Offline demo mode

- **Why.** Asia wants to show the app without a PC: a phone can't reach the mock server inside WSL, and a demo shouldn't depend on Wi-Fi.
- **How.** The app runs the server's own `MockParkingProvider` on the phone, through `LocalParkingProvider` in `app/src/lib/localProvider.ts`. It's the same `ParkingProvider` interface (NFR-3), the same simulator, search, fees, plate checks and gate logic, and the same generated mall and floor JSON, bundled into the app (it adds about 0.4 MB). This avoids keeping a second copy of the logic in the app.
- **Server code changes that made this possible.** `mockProvider.ts` no longer imports Node modules. Loading from files moved to `loadMock.ts`, plate rules moved to `plateFormat.ts`, and ids come from an injectable `newId`. `snapshot()` and `restore()` were added for saving state.
- **Default.** Demo mode is on unless `EXPO_PUBLIC_API_URL` is set. Settings → Data source switches between "Demo (on this phone)" and "Server (PC)", and the choice is saved. Switching resets cached data.
- **Saved on the phone.** Plates and tickets are saved in AsyncStorage (`app.demoState`), together with consent and the parked spot. Bay occupancy is re-simulated at each launch, like a live feed.
- **Imports.** The server's TypeScript uses Node-style `./x.js` imports. `app/metro.config.js` drops the `.js` for imports inside `server/src`, and Jest does the same with `moduleNameMapper`.
- **Server mode** still works as before (HTTP plus `WS /live`).

## Layout v2 (UPDATE_LAYOUT_V2.md)

- **Accounts.** Demo email accounts live in `MockParkingProvider`, so demo mode (on the phone) and server mode behave the same. Passwords are salted SHA-256 (`expo-crypto` on the phone, Web Crypto on the server). Any hash that isn't a real 64-character digest is rejected, after a test caught a stubbed crypto module that made every password match. This is a demo, not production auth: a real version needs a proper auth service and a slow password hash (Argon2/bcrypt). In server mode the app sends the account id as `x-user-id`.
- **Login is required** for plates, tickets and the wallet (UI-44). Consent is still stored per phone, and the old random per-install id was removed.
- **Wallet.** The balance is the sum of the wallet's transactions (top-ups minus payments), so it can't drift from the history. Top-ups must be whole baht from 20 to 5,000. "Pay" takes what is due now, and the ticket stays open. At the exit gate, anything still due is taken from the wallet if the balance covers it; otherwise the ticket is marked "paid at the machine" (FR-24 never blocks the exit).
- **Cards.** The card form accepts only the test number 4242 4242 4242 4242. Card details are checked on the screen and dropped: never stored, logged or sent (NFR-9). PromptPay shows a placeholder QR.
- **Session card place (UI-39)** comes from "I parked here". If none is saved for that mall, the card offers "Set where you parked".
- **History (UI-40)** reuses the session card in its Left state for the detail screen.
- **Map labels (UI-12).** The base size depends on zoom (full → name only → dot). A label that would overlap a bigger mall's label becomes a dot. Markers use `tracksViewChanges={false}` and are re-keyed when their content changes, for performance.
- **Theme.** Colour tokens are in `app/src/lib/theme.ts`, with contrast checked by `test/theme.test.ts`. Sky blue is used as a fill only in light mode, because it's too light for text on white. The dark map uses `userInterfaceStyle="dark"` on iOS and a custom Google Maps style on Android.
- **Icons.** `lucide-react-native` line icons replace all emoji, including inside the floor plan SVG. shortcut: importing from the package root bundles the whole icon set (the Android bundle grew from 4.9 to 7.3 MB); switch to per-icon imports if bundle size matters.
- **Font.** IBM Plex Sans Thai, loaded with `@expo-google-fonts`. The app waits for it at start-up and falls back to the system font if loading fails.
- **Tests.** Jest uses lucide's CommonJS build and a small Reanimated stub (`test/setup.ts`), because Reanimated 4's own mock still boots the native runtime.
- **Not built:** animated number tweens (UI-34 is partly done); push notifications (out of scope, A7). The removed Search and Settings tabs and the `tickets` screen are replaced by Map, Account and Parking & Pay.

## v0.2.1: Expo Go crash fix

- **Bug.** The published v2 crashed at launch in Expo Go with "Cannot find native module 'ExpoSpeechRecognition'". The voice button loaded the package with `require()` inside try/catch, but on a device Metro's module loader reports an error thrown while a module is first loaded as a fatal error itself, so the `catch` never ran. v2 put the mic on the Map tab, which is the first screen, so the app crashed at once.
- **Fix.** `app/src/lib/voice.ts` is now the only place that touches `expo-speech-recognition`. It asks `requireOptionalNativeModule('ExpoSpeechRecognition')` first (returns null instead of throwing), and only loads the package if the native module exists. In Expo Go, the mic shows "needs a development build". `test/voiceFallback.test.tsx` simulates Expo Go (native module missing, package throws if loaded) and checks that the Map tab renders, that the mic shows the message, and that the package is never loaded.
- **Other native modules.** In the exported bundle, every other native module the app loads (Location, Localization, Linking, Font, Crypto, Asset, Updates, Maps, SVG, Gesture Handler, Reanimated) is part of Expo Go SDK 58. Speech recognition was the only one missing.
