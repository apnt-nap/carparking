# Layout update v2: requirements and build prompt

Version 0.2 · 2 Nov 2026 · Owner: Asia
Builds on `SYSTEM_REQUIREMENTS.md`. Where this file and the original differ, this file wins.

---

## Part A: Requirements

### A1. Navigation

The app has a bottom tab bar with three tabs:

| Position | Tab | Purpose |
|---|---|---|
| Left | **Map** | Find a mall and free parking |
| Middle (highlighted) | **Parking & Pay** | Ticketless entry: active tickets, plates, amount due, balance, paying |
| Right | **Account** | Login, balance and top-up, set up ticketless entry, settings, demo tools |

- UI-1 The middle tab is visually emphasised (for example a larger round icon raised above the bar), because it is the main action while parked.
- UI-2 The mall and floor screens open on top of the Map tab, the same as now.

### A2. Map tab

**Floating search bar**
- UI-3 A search bar floats over the top of the map as a rounded "pill" (corner radius at least 24 pt, soft shadow, map visible around it). There is no separate search screen or header bar.
- UI-4 A small mic icon sits inside the search bar on the right. Tapping it starts voice search in Thai or English (FR-17). While listening, the icon animates and the bar shows "Listening…".
- UI-5 Tapping the bar opens a rounded pop-up card below it, which shows **the 3 nearest malls** to the user (name, distance, free spaces) before anything is typed. If location is off, it shows 3 recent searches instead, or 3 popular malls if there are none.
- UI-6 As the user types, the pop-up shows the 3 best matches (FR-16), each with distance and free spaces. Tapping one moves the map to that mall and opens its card.
- UI-7 Tapping outside the pop-up or pressing back closes it.

**Floating buttons on the right**
- UI-8 A vertical stack of round floating buttons sits on the right edge, at thumb height in the lower half of the screen:
  - **My location:** recentres the map on the user.
  - **Nearby:** opens a bottom sheet listing malls sorted by distance (FR-4), replacing the current separate "Nearby" view.
- UI-9 The buttons are at least 44 pt, and they don't cover the search bar or the tab bar.

**Mall markers**
- UI-10 Each mall is shown as a highlighted label, not just a dot. The label is a rounded tag with the **mall name** in bold, and below it, in smaller text, the **free-space count** (for example "Siam Paragon" with "312 free" underneath).
- UI-11 The tag's border or background uses the availability colour (green, amber, red, grey as in FR-2), plus a small icon or text so colour is not the only signal.
- UI-12 When zoomed far out, labels may shrink to name only, then to dots, so they don't overlap.
- UI-13 Tapping a label opens the existing mall card (FR-3).

### A3. Parking & Pay tab (middle)

This tab holds everything about ticketless entry **except adding a plate**, which lives in Account.

- UI-14 **Locked state:** if ticketless entry isn't set up, show a short explanation and a button "Set up ticketless entry", which goes to the Account flow (Terms & Agreement, then add plate).
- UI-15 **Active ticket card** (top, when the user is parked): mall, plate, entry time, time parked (live), and **amount due** in large text, updating live. Validation such as "2 hours free with purchase" is shown if applied.
- UI-16 **Pay button** on the active ticket. In the demo, paying deducts from the wallet balance and marks the ticket paid. Leaving through the simulated gate then closes it. If the balance is too low, show "Top up" first.
- UI-17 **Wallet summary:** current balance, with a "Top up" shortcut that goes to Account → Balance.
- UI-18 **My plates (read-only list):** each registered plate with its province, plus which one is currently parked. No "add plate" button here.
- UI-19 **History:** past tickets with mall, date, duration and amount paid.
- UI-20 **"How paying works"** link that opens a rounded pop-up explaining, in Thai or English:
  1. Your plate is read at the gate, so you don't need a ticket.
  2. The fee builds up while you're parked, and you can see it here.
  3. Pay from your balance before leaving, or it's paid automatically at the exit gate if your balance covers it.
  4. If the plate isn't read, use the normal ticket machine.

### A3b. Parking status, history and prices (added after Asia's reference screenshot)

**My parking (session card)**
- UI-35 **My parking card**, inspired by the left screen of Asia's reference. It shows:
  - a status chip: **Parked** (green) or **Left** (grey),
  - the plate number with the car model and colour, if the user added them,
  - mall, floor, zone and bay (e.g. "ICONSIAM · B2 · Zone C · C14"),
  - the entry time,
  - a **large live elapsed timer** (`hh:mm:ss`, tabular digits),
  - the **running fee**.

  It appears at the top of the Parking & Pay tab. While the user is parked, the Map tab also shows a compact banner version ("Parked at ICONSIAM · 01:50:59 · 60 ฿"); tapping it opens the card.
- UI-36 **Status changes.** When the car exits (gate simulator, or "End parking" in the demo), the status changes to **Left** and the card shows the exit time, total time and amount paid. The app shows a short in-app message: "You left ICONSIAM · 2 h 10 min · 60 ฿ paid". Entering shows "You entered ICONSIAM at 14:05".
- UI-37 **Card actions** as pill buttons:
  - **Navigate to my car** (outlined): opens the floor plan with the parked bay highlighted and a route to it.
  - **Pay** / **End parking** (filled): pays from the wallet (UI-16). In the demo, End parking also simulates leaving through the gate.
- UI-38 **Car details and illustration.** When adding a plate (Account), the user can optionally add a car model and colour. If a colour is set, the card shows a top-down car illustration (a generic vector drawing, tinted with that colour). This is a nice-to-have, not required.
- UI-39 **Where the bay comes from.** The floor, zone and bay come from "I parked here" (FR-15). If none is saved, the card shows "Set where you parked", which opens the floor plan of that mall.

**History**
- UI-40 **Parking history:** a list of past visits, newest first, each with mall, date, entry and exit time, duration and amount paid. Tapping a visit shows its details (the same layout as the session card, with status Left). This replaces the simple list in UI-19.

**Mall prices**
- UI-41 **Price shown everywhere a mall is listed:** the mall card (FR-3), the mall screen (FR-8), the search pop-up rows (UI-5, UI-6) and the Nearby sheet all show the parking price in a short form, e.g. "20 ฿/hr · first 2 hr free with purchase".
- UI-42 **Prices view:** from the Nearby sheet, a "Prices" option compares all malls in one list: hourly rate, free period, free period with purchase, and opening hours. It can be sorted by price or by distance.
- UI-43 **Mall list cards** (inspired by the right screen of Asia's reference): the Nearby sheet shows each mall as a rounded card with:
  - an image tile (a placeholder illustration in the demo; no copyrighted photos),
  - the mall name and area,
  - "X spots available" in green, "Filling up" in amber, or "Full" in red, always with text,
  - the price per hour,
  - a filled pill button **Choose a spot**, which opens the mall's best floor (the "Best choice" from FR-6) with the suggested bay.

**Login**
- UI-44 **Login with email is prominent.** The top of the Account tab is a profile card: "Log in with email" when signed out, or name and email when signed in. Ticketless entry, the wallet and history need login; the map and floor plans don't. It stays a demo login stored on the phone (UI-21).

### A4. Account tab (right)

- UI-21 **Login with email (demo):** sign up and log in with email and password. In the demo, accounts are stored on the phone only. Show a clear "Demo account, stored on this phone" note. The profile shows email and display name, with a log out button.
- UI-22 **Balance:** current balance and a list of top-ups and payments.
- UI-23 **Top up (demo):** preset amounts (100, 300, 500, 1,000 THB) and a custom amount. Payment methods shown: PromptPay QR and credit/debit card. **Both are simulated:** the PromptPay QR is a placeholder, and the card form accepts only the test card number `4242 4242 4242 4242`. The app never stores or sends real card details. A banner says "Demo payment, no real money".
- UI-24 **Set up ticketless entry:** Terms & Agreement with the two separate ticks (terms and PDPA consent), then add plates. Also manage plates here (add, delete, withdraw consent). This is the only place to add a plate.
- UI-25 **Demo tools:**
  - **Add demo e-ticket:** pick a mall and a plate and create an active ticket with an entry time (for example "1 h 20 min ago"), so the Parking & Pay tab can be shown without the gate simulator.
  - **Gate simulator:** the existing hidden screen, now reachable from here.
  - **Reset demo data.**
- UI-26 **Settings:** language (Thai/English), data source (Demo/Server), and "I parked here" location.

### A5. Data model additions

```
Account   { id, email, display_name, password_hash, created_at }        // demo: on device
Wallet    { account_id, balance_thb }
WalletTx  { id, account_id, type (topup|payment|refund), amount_thb, method (promptpay|card|wallet), ticket_id?, created_at }
Ticket    + { paid_at?, paid_from (wallet|gate), floor_id?, zone?, bay_id? }
Plate     + { car_model?, car_color? }
```

### A6. Non-functional

- NFR-6 All new UI in Thai and English. No hard-coded strings.
- NFR-7 Rounded, floating style throughout: corner radius 16 to 24 pt, soft shadows, works in light and dark mode.
- NFR-8 Touch targets at least 44 pt. Screen-reader labels on the search bar, mic, floating buttons, map labels and the pay button.
- NFR-9 No real payments or real card storage in the demo. A real version would use a licensed payment provider (for example Omise or 2C2P for Thai cards and PromptPay).
- NFR-10 The demo keeps working fully offline, and the published Expo link stays the same.

### A6b. Modern design and light/dark mode

**Themes**
- UI-27 The app has three theme settings in Account → Settings: **System** (default, follows the phone), **Light** and **Dark**. The choice is saved and applies straight away, with no restart.
- UI-28 Every screen, pop-up, sheet, map label, floor plan and the tab bar uses shared theme tokens (background, surface, elevated surface, text, muted text, border, accent, success, warning, danger). No hard-coded colours in screens.
- UI-29 In dark mode, the map also switches to a dark map style, and the floor plan uses dark surfaces with the same free/taken/route meaning.
- UI-30 Text and important icons meet WCAG AA contrast (4.5:1 for body text) in both themes. Availability colours stay distinguishable in both themes and are always paired with text or an icon (NFR-4).

**Modern look** (style details to be confirmed with Asia, see A6c)
- UI-31 A consistent design system: a spacing scale (4/8/12/16/24 pt), corner radii (12 pt for small items, 16–24 pt for cards and sheets, full pill for the search bar and buttons), soft layered shadows in light mode and lighter surfaces instead of shadows in dark mode.
- UI-32 Clear type hierarchy: large bold screen titles, medium section titles, regular body text, and small captions, all supporting Thai and English without clipping Thai vowel and tone marks.
- UI-33 A proper icon set instead of emoji for navigation, actions and bay types (for example `@expo/vector-icons` or `expo-symbols`), with emoji kept only where they add personality.
- UI-34 Gentle motion: pop-ups and sheets slide and fade (about 200–250 ms), buttons give a press feedback, and live values (amount due, free spaces) change smoothly. Motion is reduced when the phone's "Reduce motion" setting is on.

### A6c. Design decisions (confirmed by Asia, 2 Nov 2026)

- **Style:** clean minimal, like Apple Maps, taking the **United Airlines app** as the reference for feel. That means calm screens, lots of white space, navy headers and accents, thin clean icons, and few decorations. Take the feel only: don't copy United's logo, artwork or exact layouts.
- **Palette:** dark navy blue (primary), light/sky blue (accent) and white. Green, amber and red are used **only** for availability and status.
- **Font:** IBM Plex Sans Thai, which covers Thai and English (via `@expo-google-fonts/ibm-plex-sans-thai`). It falls back to the system font while loading, and can be changed later in one place.
- **Icons:** a clean line icon set, `lucide-react-native` (or Ionicons outline). No emoji in the UI.
- **Dark mode:** the map itself turns dark (a dark map style), and so do the floor plans.
- **Tab bar** (from Asia's reference): the active tab is a filled navy circle with a white icon; the other tabs are thin outline icons. The middle Parking & Pay tab keeps UI-1's emphasis.
- **Buttons** (from the reference): full pill shape, 48 pt high. Primary buttons are filled navy (sky blue in dark mode); secondary buttons are outlined.

**Colour tokens** (contrast ratios checked against WCAG AA; ratios are against the background in brackets)

| Token | Light | Dark | Use |
|---|---|---|---|
| background | `#FFFFFF` | `#0A1424` | Screen background |
| surface | `#F3F6FA` | `#12203A` | Cards, sheets, search pill |
| surfaceElevated | `#FFFFFF` + shadow | `#1A2B4A` | Pop-ups, floating buttons |
| text | `#0B1B33` (17.2:1) | `#EAF1FB` (16.2:1) | Body text |
| textMuted | `#4A5B73` (6.4:1 on surface) | `#9FB0C8` (7.4:1 on surface) | Captions, secondary text |
| border | `#D6DEE8` | `#26385A` | Dividers, outlines |
| primary | `#0B2A4A` navy (white text 14.5:1) | `#4DA3FF` sky (navy text 7.0:1) | Main buttons, active tab, headers |
| accent | `#4DA3FF` sky, as a fill only (2.6:1 on white, too low for text) | `#7CC0FF` (8.4:1 on surface) | Highlights, selected states, route line |
| accentText | `#1E64C8` (5.7:1) | `#7CC0FF` | Links and accent-coloured text |
| accentTint | `#E6F1FF` (navy text 12.7:1) | `#173257` | Selected chips, info banners |
| success / free | `#1B7F3B` (5.1:1) | `#5FD38A` (8.6:1) | Free spaces, paid |
| warning / filling | `#9A5B00` (5.4:1) | `#FFC266` (10.2:1) | Filling up, low balance |
| danger / full | `#C62828` (5.6:1) | `#FF7A7A` (6.4:1) | Full, errors |

### A7. Out of scope

Real payment processing, real user accounts on a server, push notifications.

---

## Part B: Build prompt for Claude Code

Copy everything below the line into Claude Code in the `project parking` folder.

---

Read `SYSTEM_REQUIREMENTS.md`, `DECISIONS.md` and `UPDATE_LAYOUT_V2.md`. Implement Part A of `UPDATE_LAYOUT_V2.md` in the existing Expo app. Where it conflicts with the original spec, `UPDATE_LAYOUT_V2.md` wins.

Work in this order, committing after each step:
1. **Theme and design system** (UI-27 to UI-34, A6c): set up the colour tokens from the A6c table for light and dark, the System/Light/Dark setting, IBM Plex Sans Thai, lucide line icons (no emoji), the spacing, corner and type scales, pill buttons, motion with reduced-motion support, a dark map style, and dark floor plans. Do this first so every later screen uses it.
2. **Navigation** (UI-1, UI-2, A6c tab bar): three bottom tabs (Map, Parking & Pay, Account). The active tab is a filled navy circle; the others are outline icons; the middle tab is emphasised. Move existing screens into the right tabs.
3. **Data** (A5): add Account, Wallet, WalletTx, the ticket's paid/bay fields and the plate's car fields to the ParkingProvider interface, MockParkingProvider (server) and LocalParkingProvider (demo, saved with AsyncStorage). Keep ParkingProvider as the only data access point.
4. **Map tab** (UI-3 to UI-13, UI-41 to UI-43):
   - floating rounded search bar with the mic inside,
   - pop-up with the 3 nearest malls or the top 3 matches, each with price,
   - right-side floating buttons (My location, Nearby sheet),
   - name-plus-free-count map labels, with overlap handling when zoomed out,
   - Nearby sheet with mall cards ("Choose a spot") and a Prices view,
   - compact "parked" banner (UI-35).
5. **Account tab** (UI-21 to UI-26, UI-38, UI-44):
   - profile card with demo email login at the top (hash demo passwords),
   - wallet and balance, and demo top-up (PromptPay placeholder and test card 4242 only; never store card details),
   - ticketless entry setup with Terms & Agreement, and plates with optional car model and colour,
   - demo tools and settings, including the theme setting.
6. **Parking & Pay tab** (UI-14 to UI-20, UI-35 to UI-40):
   - locked state,
   - My parking session card (status chip, plate and car, mall/floor/zone/bay, live `hh:mm:ss` timer, running fee, "Navigate to my car" and "Pay"/"End parking" pill buttons, optional car illustration),
   - Parked → Left status change with in-app messages,
   - wallet summary, read-only plates, parking history with detail, and the "How paying works" pop-up.

Rules:
- Tag commits, tests and code comments with requirement IDs (UI-x, NFR-x).
- Add tests for:
  - the 3-nearest search pop-up,
  - wallet top-up and payment, including insufficient balance,
  - paying a ticket,
  - that adding a plate is only possible from Account,
  - that ticketless entry stays locked until both consent ticks are given,
  - the session card's live timer and running fee,
  - the Parked → Left status change (exit time, total time and amount paid shown),
  - that history lists past visits newest first,
  - that price text appears on mall cards and in the Prices view,
  - that the theme setting switches tokens between light and dark,
  - that every colour token pair in A6c meets WCAG AA (a small contrast-ratio test).
- Run tests, the type-check and expo-doctor before each commit.
- Update README.md's requirement checklist and note decisions in DECISIONS.md.
- When done, re-publish the demo to the existing "demo" channel so the same QR code shows the new version, then report what changed.
- Check both themes on every screen (screenshots or a test that renders key screens in light and dark).
- Start by showing me a short plan and wait for my OK before writing code.
