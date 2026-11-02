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
