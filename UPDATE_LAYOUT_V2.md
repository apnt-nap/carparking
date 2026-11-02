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
Ticket    + { paid_at?, paid_from (wallet|gate) }
```

### A6. Non-functional

- NFR-6 All new UI in Thai and English. No hard-coded strings.
- NFR-7 Rounded, floating style throughout: corner radius 16 to 24 pt, soft shadows, works in light and dark mode.
- NFR-8 Touch targets at least 44 pt. Screen-reader labels on the search bar, mic, floating buttons, map labels and the pay button.
- NFR-9 No real payments or real card storage in the demo. A real version would use a licensed payment provider (for example Omise or 2C2P for Thai cards and PromptPay).
- NFR-10 The demo keeps working fully offline, and the published Expo link stays the same.

### A7. Out of scope

Real payment processing, real user accounts on a server, push notifications.

---

## Part B: Build prompt for Claude Code

Copy everything below the line into Claude Code in the `project parking` folder.

---

Read `SYSTEM_REQUIREMENTS.md`, `DECISIONS.md` and `UPDATE_LAYOUT_V2.md`. Implement Part A of `UPDATE_LAYOUT_V2.md` in the existing Expo app. Where it conflicts with the original spec, `UPDATE_LAYOUT_V2.md` wins.

Work in this order, committing after each step:
1. **Navigation:** three bottom tabs (Map, Parking & Pay, Account) with the middle tab emphasised (UI-1, UI-2). Move existing screens into the right tabs.
2. **Map tab:** floating rounded search bar with the mic inside, a pop-up showing 3 nearest malls or the top 3 matches, right-side floating buttons (My location, Nearby sheet), and name-plus-free-count map labels (UI-3 to UI-13). Use custom marker views for the labels and handle overlap when zoomed out.
3. **Account tab:** demo email login, wallet and balance, demo top-up (PromptPay placeholder and test card 4242 only, never store card details), ticketless entry setup with Terms & Agreement and plates, demo tools, settings (UI-21 to UI-26). Store everything on the device with AsyncStorage. Hash demo passwords.
4. **Parking & Pay tab:** locked state, active ticket with live amount due, Pay from wallet, wallet summary, read-only plates, history, and the "How paying works" pop-up (UI-14 to UI-20).
5. **Data:** add Account, Wallet and WalletTx to the LocalParkingProvider and the server provider (A5). Keep the ParkingProvider interface as the only data access point.

Rules:
- Tag commits, tests and code comments with requirement IDs (UI-x, NFR-x).
- Add tests for: the 3-nearest search pop-up, wallet top-up and payment (including insufficient balance), paying a ticket, that adding a plate is only possible from Account, and that ticketless entry stays locked until both consent ticks are given.
- Run tests, the type-check and expo-doctor before each commit.
- Update README.md's requirement checklist and note decisions in DECISIONS.md.
- When done, re-publish the demo to the existing "demo" channel so the same QR code shows the new version, then report what changed.
- Start by showing me a short plan and wait for my OK before writing code.
