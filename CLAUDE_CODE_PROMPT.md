# Build prompt for Claude Code

Copy everything below the line into Claude Code, run from the root of the project repo, with `SYSTEM_REQUIREMENTS.md` in the same folder.

---

You are building a prototype mobile app that helps drivers find free parking at Thai shopping malls. The full spec is in `SYSTEM_REQUIREMENTS.md`. Read it first and treat it as the source of truth. If something here conflicts with it, the spec wins.

## Stack
- Monorepo with two packages: `app/` (React Native + Expo, TypeScript, Expo Router) and `server/` (Node.js + Fastify + `ws`, TypeScript).
- App libraries: `react-native-maps`, `react-native-svg`, `expo-speech-recognition`, `expo-location`, `i18next` + `react-i18next`, `fuse.js`, `@tanstack/react-query`.
- Tests: Jest + React Native Testing Library in `app/`, Vitest in `server/`.

## Work in this order, committing after each milestone

### Milestone 1: mock data and server
1. Create `server/data/malls.json` with five malls: Siam Paragon, CentralWorld, ICONSIAM, one Robinson branch in Bangkok, and one Lotus's branch. Use their real approximate coordinates, Thai and English names, opening hours, and plausible fee rules (mark them clearly as sample data).
2. Give each mall 3 to 6 parking floors (for example B1–B3, P1–P4). For each floor, generate a plan in metres: outer outline, a lane graph (nodes and edges, with one-way flags), entry/exit ramps, lift lobbies, and 80–250 bays in labelled zones. Include EV, accessible and family bays. Write a generator script (`server/scripts/generate-floors.ts`) instead of hand-writing coordinates, and commit its output.
3. Write a simulator that changes bay status every few seconds, with realistic patterns: fuller at weekends and 11:00–20:00, lower floors near lifts fill first.
4. Implement the API in section 6 of the spec, including the `/live` WebSocket. Put all data access behind a `ParkingProvider` interface with a `MockParkingProvider` implementation.
5. Add tests for fee calculation, search aliases, and the simulator's bounds.

### Milestone 2: main app
1. Map tab (FR-1 to FR-4): markers coloured by availability, bottom sheet on tap, "Nearby" list.
2. Mall screen (FR-5 to FR-8): floors sorted by free spaces, "Best choice" tag, special-bay counts, fees.
3. Floor screen (FR-9 to FR-15): draw the plan with `react-native-svg`, with pinch-zoom and pan. Recolour bays live from the WebSocket. Find the nearest free bay with Dijkstra or A* on the lane graph, respecting one-way lanes, and draw the route. Tapping a free bay reroutes. Add "I parked here".
4. Search (FR-16 to FR-18): one search bar with a mic button. Use `fuse.js` over Thai and English names plus an alias list (e.g. "พารากอน", "paragon", "icon siam"). Voice uses `expo-speech-recognition` in th-TH or en-US, following the app language with a toggle.
5. Thai and English throughout (FR-19, FR-20). No hard-coded UI strings.
6. Accessibility: colour is never the only signal, touch targets at least 44 pt, screen-reader labels on bays and markers.

### Milestone 3: ticketless plate entry (mocked)
1. Plate registration with Thai plate format (number plus province) and a PDPA consent screen (FR-21).
2. A hidden "Simulate gate" screen that sends entry and exit events to `/sim/gate` (FR-25).
3. E-ticket screen showing mall, entry time and running fee, closed on exit (FR-22, FR-23).
4. Plates stored hashed in logs. Users can delete their plates.

## Rules
- Note any non-obvious decisions in `DECISIONS.md`.
- Keep the README up to date with how to run the server, the app (Expo Go and simulators), and the tests.
- Run the tests and type-check before each commit. Don't mark a milestone done with failing tests.
- If a library can't do what the spec needs (for example voice recognition in Expo Go), say so in `DECISIONS.md`, pick the closest working option, and keep going.
- Start by printing a short plan for Milestone 1 and wait for my OK before writing code.
