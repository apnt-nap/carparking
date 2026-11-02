# Thai Mall Parking App: System Requirements

Version 0.1 · 2 Nov 2026 · Owner: Asia

## 1. Purpose

A mobile app that helps drivers find free parking at Thai shopping malls. It shows which malls are nearby, which floors have the most free spaces, and a live floor plan with free bays and the route to them. The first release is a **prototype on simulated data**, built so that a real mall or sensor feed can replace the simulator later without changing the app.

## 2. Users

| User | Need |
|---|---|
| Driver (Thai or foreign visitor) | Find a mall with space, pick the best floor, drive straight to a free bay |
| Mall parking operator (phase 2) | Let registered cars enter and exit without a paper ticket |

## 3. Scope

### In scope for the prototype (phase 1)
- Five malls with mock data: **Siam Paragon, CentralWorld, ICONSIAM, Robinson (one Bangkok branch), Lotus's (one branch)**
- Map, mall picker, floor picker, floor plan, search (text and voice), Thai and English UI
- A simulator that changes bay occupancy over time, like real sensors would

### Phase 2 (designed now, mocked in the prototype)
- Ticketless entry by licence plate recognition (LPR), with an e-ticket in the app

### Out of scope
- Real payment processing
- Reserving bays
- Integration with real mall systems (needs agreements with each operator)

## 4. Functional requirements

### 4.1 Mall map
- FR-1 Show a map centred on the user's location (with permission), or on central Bangkok if permission is refused.
- FR-2 Highlight each supported mall with a marker coloured by availability: green (more than 30% free), amber (10 to 30%), red (under 10%), grey (no data).
- FR-3 Tapping a marker shows the mall name, distance, total free spaces, and parking fee summary, with a button to open the mall.
- FR-4 A "Nearby" list sorts malls by distance and shows free spaces for each.

### 4.2 Mall and floor selection
- FR-5 The mall screen lists every parking floor with free spaces, total spaces, and a bar showing how full it is.
- FR-6 Floors are sortable by most free spaces (default) or by floor order. The floor with the most free spaces is tagged "Best choice".
- FR-7 Floors with special bays show counts for EV charging, accessible, and family/ladies bays.
- FR-8 The mall screen shows parking fees (for example "first 2 hours free with purchase, then 20 THB/hour") and opening hours.

### 4.3 Floor plan
- FR-9 Each floor shows a simple top-down plan: outline walls, driving lanes with one-way arrows, ramps up and down, lifts/escalators to the mall, and every bay.
- FR-10 Bays are coloured free (green) or taken (grey). Special bays use an icon.
- FR-11 Bay colours update live (within 5 seconds of a change in the data).
- FR-12 The app suggests the nearest free bay to the floor's entry ramp, or to the mall entrance if the user prefers, and draws the driving route along the lanes.
- FR-13 The user can tap any free bay to get a route to it instead.
- FR-14 Zones are labelled (for example "B2 Zone C") so users can remember where they parked.
- FR-15 "I parked here" saves the bay and zone, and shows it again later.

### 4.4 Search
- FR-16 Text search over mall names, branch names and areas, in Thai and English. It tolerates partial input and common variants (for example "paragon", "พารากอน", "central world", "เซ็นทรัลเวิลด์", "icon siam", "ไอคอนสยาม").
- FR-17 Voice search with a microphone button. Recognition language follows the app language, with a toggle for Thai (th-TH) and English (en-US). The recognised text runs through the same search as FR-16.
- FR-18 Results show mall, distance and free spaces, and open the mall screen.

### 4.5 Language
- FR-19 Full UI in Thai and English, switchable in settings, defaulting to the phone's language.
- FR-20 Each mall, floor and zone name is stored in both languages.

### 4.6 Ticketless plate entry (phase 2, mocked)
- FR-21 The user registers one or more licence plates (plate number plus province, as on Thai plates) with explicit PDPA consent.
- FR-22 When a registered plate is recognised at a participating mall's entry gate, the gate opens and an e-ticket appears in the app showing mall, entry time and running fee.
- FR-23 On exit, the plate is recognised again, the fee is calculated (applying any validation such as free hours with purchase), and the ticket closes.
- FR-24 If the plate is not recognised or the user isn't registered, the normal ticket machine is used. LPR never blocks entry.
- FR-25 In the prototype, a "Simulate gate" screen triggers entry and exit events.

## 5. Data model (summary)

```
Mall      { id, name_th, name_en, brand, lat, lng, address_th, address_en, hours, fees, floors[] }
Floor     { id, mall_id, level ("B2", "P3"), name_th, name_en, plan (outline, lanes, ramps, exits), bays[] }
Bay       { id, floor_id, zone, x, y, w, h, rotation, type (normal|ev|accessible|family), status (free|taken), updated_at }
Plate     { id, user_id, number, province, consent_at }
Ticket    { id, plate_id, mall_id, entry_at, exit_at, fee_thb, status (open|paid|closed) }
```

Floor plans are stored as simple geometry (rectangles and polylines in metres) so the app can draw them as SVG and compute routes along the lane graph.

## 6. API (the mock server implements this; a real feed would too)

| Method | Path | Returns |
|---|---|---|
| GET | `/malls?lat&lng` | Malls with distance and free-space totals |
| GET | `/malls/:id` | Mall detail with floors and per-floor counts |
| GET | `/floors/:id` | Floor plan geometry and bay statuses |
| WS | `/live` | Bay status changes as they happen |
| GET | `/search?q&lang` | Matching malls |
| POST | `/plates` | Register a plate (phase 2) |
| POST | `/sim/gate` | Simulate an LPR entry or exit event (phase 2) |
| GET | `/tickets` | The user's tickets (phase 2) |

## 7. Non-functional requirements

- NFR-1 iOS and Android from one codebase. A web preview is a bonus, not required.
- NFR-2 The map and mall list load in under 2 seconds on 4G.
- NFR-3 The data source is behind an interface (`ParkingProvider`), so swapping the simulator for a real feed touches no screens.
- NFR-4 Works in light and dark mode. Touch targets are at least 44 pt, and colour is never the only signal (bays also differ by pattern or icon).
- NFR-5 Privacy: plates are personal data under Thailand's PDPA. Collect only with consent, let users delete them, and never log plates in plain text.

## 8. Recommended technology

| Layer | Choice | Why |
|---|---|---|
| App | React Native + Expo (TypeScript) | One codebase for iOS and Android, fast to iterate |
| Map | `react-native-maps` | Native maps with custom markers |
| Floor plans | `react-native-svg` | Draw outlines, lanes and bays, and recolour them live |
| Voice | `expo-speech-recognition` | On-device speech recognition with th-TH and en-US |
| i18n | `i18next` + `react-i18next` | Thai and English strings |
| Mock server | Node.js + Fastify + `ws`, JSON seed files | Small, easy to replace |
| Search | `fuse.js` with a Thai/English alias list | Fuzzy matching in both languages |
| Tests | Jest + React Native Testing Library | Unit and component tests |

## 9. Real data: what it would take

None of these malls publish a public parking API, as far as we know. A real version needs one of:
1. A data agreement with the mall or its parking operator (their gate and bay-sensor systems already count spaces).
2. A partnership with a parking-guidance vendor already installed at the mall.
3. Our own sensors or camera counting, which is expensive and needs mall permission.

The prototype's `ParkingProvider` interface is where any of these would plug in.

## 10. Opinion on ticketless plate entry

Worth pursuing. It removes the slowest step at the gate, and LPR parking already exists at some Thai car parks, so operators know the idea. The risks are commercial and legal more than technical:
- **Integration:** each mall uses a different gate/LPR vendor, so every mall needs its own integration and agreement.
- **Privacy:** PDPA consent, data retention limits, and a clear delete option.
- **Accuracy:** misreads (dirty plates, red-plate new cars, motorbikes) need a fallback ticket and a way to fix the record.
- **Fraud:** cloned plates. Link the plate to a verified account and alert the user on every entry.

Recommendation: keep it as phase 2, prove the user experience with the simulated gate, then use the prototype to pitch one mall operator.

## 11. Milestones

1. Mock data and mock server (five malls, floors, bays, simulator)
2. Main app: map, mall/floor picker, floor plan with routing, search, Thai/English
3. Plate registration and simulated ticketless entry
