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
