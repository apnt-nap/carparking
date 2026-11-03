/* Thai Mall Parking: web demo of the mobile app.
 * Everything runs in the browser on SAMPLE DATA (site/data.js). No server, no real payments.
 * Mirrors the Expo app's layout v2: Map, Parking & Pay and Account tabs (UPDATE_LAYOUT_V2.md). */
(() => {
  'use strict';
  const D = window.DEMO_DATA;
  const DEMO_LOC = { lat: 13.7410, lng: 100.5440 }; // demo "you are here": Ratchadamri, central Bangkok
  const TICK_MS = 3000; // simulator tick, like the app's SIM_INTERVAL_MS

  // ---------- storage (per browser, demo only) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('tmp.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('tmp.' + k, JSON.stringify(v)); } catch { /* private mode: keep in memory */ } },
    clear() { try { Object.keys(localStorage).filter((k) => k.startsWith('tmp.')).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ } },
  };
  const navLang = (navigator.language || 'en').toLowerCase().startsWith('th') ? 'th' : 'en';
  const fresh = () => ({
    account: null, wallet: { balance: 0, tx: [] }, consent: false, plates: [], ticket: null, history: [], parked: null,
  });
  const S = {
    lang: store.get('lang', navLang), theme: store.get('theme', 'system'),
    tab: 'map', stack: [], overlay: null, query: '', searchOpen: false, listening: false,
    sortFloors: 'free', pref: 'ramp', pickedBay: null,
    ...fresh(),
  };
  for (const k of Object.keys(fresh())) S[k] = store.get(k, S[k]);
  const save = (...keys) => keys.forEach((k) => store.set(k, S[k]));

  // ---------- i18n (FR-19) ----------
  const T = {
    en: {
      map: 'Map', parking: 'Parking & Pay', account: 'Account', search: 'Search malls (Thai or English)',
      nearest: 'Nearest to you', matches: 'Best matches', none: 'No malls found', listening: 'Listening…',
      voiceSim: 'Voice search (simulated in the browser)', free: 'free', of: 'of', km: 'km', m: 'm', nearby: 'Nearby malls',
      myLoc: 'My location', chooseSpot: 'Choose a spot', hours: 'Open', fees: 'Parking fees', floors: 'Floors',
      mostFree: 'Most free', floorOrder: 'Floor order', best: 'Best choice', ev: 'EV', acc: 'Accessible', fam: 'Family',
      suggested: 'Suggested bay', yourPick: 'Your pick', drive: 'drive', walk: 'walk to mall', nearRamp: 'Near the ramp',
      nearLift: 'Near the mall entrance', parkedHere: 'I parked here', parkedSaved: 'Saved where you parked',
      youParked: 'You parked at', tapBay: 'Tap any green bay to route there instead.', noFree: 'No free bays on this floor right now.',
      freeL: 'Free', takenL: 'Taken', route: 'Route', ramp: 'Ramp', lift: 'Lifts', live: 'Live', bayTaken: 'That bay was just taken, picking another one.',
      lockedTitle: 'Ticketless entry is off', lockedBody: 'Register your licence plate once. The gate reads it, opens, and the fee shows here. Pay from your balance, no paper ticket.',
      setUp: 'Set up ticketless entry', activeTicket: 'Parked now', plate: 'Plate', entered: 'Entered', timeParked: 'Time parked',
      due: 'Amount due', validated: 'I bought something (validation)', validatedNote: 'free with purchase applied', pay: 'Pay from balance',
      topUpFirst: 'Balance too low, top up first', paid: 'Paid. Drive to the exit, the gate opens by itself.', simExit: 'Simulate exit gate',
      noTicket: 'No active parking', noTicketBody: 'Drive into a participating mall. The entry gate reads your plate and your e-ticket appears here.',
      simEntry: 'Simulate gate entry', wallet: 'Balance', topUp: 'Top up', myPlates: 'My licence plates', parkedNow: 'parked now',
      history: 'History', noHistory: 'No past visits yet.', how: 'How paying works', close: 'Close',
      how1: 'Your plate is read at the gate, so you don\'t need a ticket.', how2: 'The fee builds up while you\'re parked, and you can see it here.',
      how3: 'Pay from your balance before leaving, or it\'s paid automatically at the exit gate if your balance covers it.',
      how4: 'If the plate isn\'t read, use the normal ticket machine.',
      login: 'Log in (demo)', email: 'Email', password: 'Password', name: 'Display name', loginBtn: 'Sign up / Log in',
      demoAcct: 'Demo account, stored in this browser only.', logout: 'Log out', hello: 'Hello',
      tx: 'Transactions', noTx: 'No transactions yet.', topupTx: 'Top up', payTx: 'Parking', ticketless: 'Ticketless entry',
      on: 'On', off: 'Off', terms: 'Terms & Agreement', termsBody: 'The mall\'s gate camera reads your plate when you enter and leave. We use it only to open the gate and charge your parking fee. You can delete your plates at any time.',
      tick1: 'I accept the Terms & Agreement', tick2: 'I consent to my licence plate being processed under Thailand\'s PDPA',
      accept: 'Accept', addPlate: 'Add plate', plateNo: 'Plate number', province: 'Province', del: 'Delete', withdraw: 'Withdraw consent',
      withdrawn: 'Consent withdrawn, plates and tickets deleted.', demoTools: 'Demo tools', demoTicket: 'Add demo e-ticket',
      enteredAgo: 'Entered minutes ago', create: 'Create', reset: 'Reset demo data', resetDone: 'Demo data reset.',
      settings: 'Settings', language: 'Language', theme: 'Theme', system: 'System', light: 'Light', dark: 'Dark',
      demoPay: 'Demo payment, no real money.', amount: 'Amount', custom: 'Custom amount', method: 'Method', card: 'Card',
      promptpay: 'PromptPay', qrNote: 'Placeholder QR, not a real PromptPay code.', simPaid: 'Simulate paid', cardNo: 'Card number',
      testCard: 'Only the test card 4242 4242 4242 4242 works. Nothing is stored or sent.', badCard: 'Use the test card 4242 4242 4242 4242.',
      topped: 'Topped up', paidToast: 'Paid', exitToast: 'Gate opened. Have a nice day!', gateOpen: 'Gate opened, e-ticket started',
      needSetup: 'Set up ticketless entry first.', sample: 'Sample data', mall: 'Mall', zone: 'Zone', bay: 'Bay',
      pickMall: 'Choose a mall', plateAdded: 'Plate added', alreadyParked: 'You already have an active ticket.',
      hideFor: 'min', back: 'Back', thb: '฿', baht: 'THB', duration: 'Duration',
    },
    th: {
      map: 'แผนที่', parking: 'จอดและจ่าย', account: 'บัญชี', search: 'ค้นหาห้าง (ไทยหรืออังกฤษ)',
      nearest: 'ใกล้คุณที่สุด', matches: 'ผลที่ตรงที่สุด', none: 'ไม่พบห้าง', listening: 'กำลังฟัง…',
      voiceSim: 'ค้นหาด้วยเสียง (จำลองในเบราว์เซอร์)', free: 'ว่าง', of: 'จาก', km: 'กม.', m: 'ม.', nearby: 'ห้างใกล้เคียง',
      myLoc: 'ตำแหน่งของฉัน', chooseSpot: 'เลือกที่จอด', hours: 'เปิด', fees: 'ค่าจอดรถ', floors: 'ชั้นจอดรถ',
      mostFree: 'ว่างมากสุด', floorOrder: 'เรียงตามชั้น', best: 'แนะนำ', ev: 'EV', acc: 'ผู้พิการ', fam: 'ครอบครัว',
      suggested: 'ช่องที่แนะนำ', yourPick: 'ช่องที่คุณเลือก', drive: 'ขับ', walk: 'เดินถึงห้าง', nearRamp: 'ใกล้ทางขึ้น',
      nearLift: 'ใกล้ทางเข้าห้าง', parkedHere: 'ฉันจอดตรงนี้', parkedSaved: 'บันทึกที่จอดแล้ว',
      youParked: 'คุณจอดที่', tapBay: 'แตะช่องสีเขียวเพื่อเปลี่ยนเส้นทาง', noFree: 'ชั้นนี้ไม่มีช่องว่างตอนนี้',
      freeL: 'ว่าง', takenL: 'ไม่ว่าง', route: 'เส้นทาง', ramp: 'ทางลาด', lift: 'ลิฟต์', live: 'สด', bayTaken: 'ช่องนั้นเพิ่งมีรถจอด กำลังเลือกช่องใหม่',
      lockedTitle: 'ยังไม่ได้เปิดเข้าออกแบบไม่ใช้บัตร', lockedBody: 'ลงทะเบียนทะเบียนรถครั้งเดียว ไม้กั้นอ่านป้ายแล้วเปิดเอง ค่าจอดแสดงที่นี่ จ่ายจากยอดเงิน ไม่ต้องใช้บัตรจอด',
      setUp: 'ตั้งค่าเข้าออกแบบไม่ใช้บัตร', activeTicket: 'กำลังจอด', plate: 'ทะเบียน', entered: 'เวลาเข้า', timeParked: 'เวลาที่จอด',
      due: 'ยอดที่ต้องจ่าย', validated: 'ซื้อสินค้าแล้ว (ประทับตรา)', validatedNote: 'ใช้สิทธิ์จอดฟรีเมื่อซื้อสินค้าแล้ว', pay: 'จ่ายจากยอดเงิน',
      topUpFirst: 'ยอดเงินไม่พอ เติมเงินก่อน', paid: 'จ่ายแล้ว ขับไปทางออกได้เลย ไม้กั้นจะเปิดเอง', simExit: 'จำลองไม้กั้นขาออก',
      noTicket: 'ไม่มีการจอดอยู่', noTicketBody: 'ขับเข้าห้างที่ร่วมรายการ ไม้กั้นขาเข้าอ่านป้ายทะเบียน แล้วบัตรจอดอิเล็กทรอนิกส์จะแสดงที่นี่',
      simEntry: 'จำลองไม้กั้นขาเข้า', wallet: 'ยอดเงิน', topUp: 'เติมเงิน', myPlates: 'ทะเบียนรถของฉัน', parkedNow: 'กำลังจอด',
      history: 'ประวัติ', noHistory: 'ยังไม่มีประวัติการจอด', how: 'การจ่ายเงินทำงานอย่างไร', close: 'ปิด',
      how1: 'ไม้กั้นอ่านป้ายทะเบียนของคุณ จึงไม่ต้องใช้บัตรจอด', how2: 'ค่าจอดเพิ่มขึ้นระหว่างที่จอด และดูได้ที่นี่',
      how3: 'จ่ายจากยอดเงินก่อนออก หรือหักอัตโนมัติที่ไม้กั้นขาออกถ้ายอดเงินพอ', how4: 'ถ้าอ่านป้ายไม่ได้ ให้ใช้เครื่องจ่ายบัตรตามปกติ',
      login: 'เข้าสู่ระบบ (เดโม)', email: 'อีเมล', password: 'รหัสผ่าน', name: 'ชื่อที่แสดง', loginBtn: 'สมัคร / เข้าสู่ระบบ',
      demoAcct: 'บัญชีเดโม เก็บไว้ในเบราว์เซอร์นี้เท่านั้น', logout: 'ออกจากระบบ', hello: 'สวัสดี',
      tx: 'รายการ', noTx: 'ยังไม่มีรายการ', topupTx: 'เติมเงิน', payTx: 'ค่าจอดรถ', ticketless: 'เข้าออกแบบไม่ใช้บัตร',
      on: 'เปิด', off: 'ปิด', terms: 'ข้อตกลงและเงื่อนไข', termsBody: 'กล้องที่ไม้กั้นของห้างอ่านป้ายทะเบียนเมื่อคุณเข้าและออก เราใช้เพื่อเปิดไม้กั้นและคิดค่าจอดเท่านั้น คุณลบทะเบียนรถได้ทุกเมื่อ',
      tick1: 'ฉันยอมรับข้อตกลงและเงื่อนไข', tick2: 'ฉันยินยอมให้ประมวลผลทะเบียนรถตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)',
      accept: 'ยอมรับ', addPlate: 'เพิ่มทะเบียน', plateNo: 'เลขทะเบียน', province: 'จังหวัด', del: 'ลบ', withdraw: 'ถอนความยินยอม',
      withdrawn: 'ถอนความยินยอมแล้ว ลบทะเบียนและบัตรจอดทั้งหมด', demoTools: 'เครื่องมือเดโม', demoTicket: 'เพิ่มบัตรจอดตัวอย่าง',
      enteredAgo: 'เข้าจอดมาแล้ว (นาที)', create: 'สร้าง', reset: 'รีเซ็ตข้อมูลเดโม', resetDone: 'รีเซ็ตข้อมูลเดโมแล้ว',
      settings: 'ตั้งค่า', language: 'ภาษา', theme: 'ธีม', system: 'ตามระบบ', light: 'สว่าง', dark: 'มืด',
      demoPay: 'การจ่ายเงินเดโม ไม่ใช่เงินจริง', amount: 'จำนวนเงิน', custom: 'ระบุจำนวนเอง', method: 'ช่องทาง', card: 'บัตร',
      promptpay: 'พร้อมเพย์', qrNote: 'QR ตัวอย่าง ไม่ใช่พร้อมเพย์จริง', simPaid: 'จำลองว่าจ่ายแล้ว', cardNo: 'หมายเลขบัตร',
      testCard: 'ใช้ได้เฉพาะบัตรทดสอบ 4242 4242 4242 4242 ไม่มีการเก็บหรือส่งข้อมูล', badCard: 'ใช้บัตรทดสอบ 4242 4242 4242 4242',
      topped: 'เติมเงินแล้ว', paidToast: 'จ่ายแล้ว', exitToast: 'ไม้กั้นเปิดแล้ว ขอให้เดินทางปลอดภัย', gateOpen: 'ไม้กั้นเปิดแล้ว เริ่มบัตรจอด',
      needSetup: 'ตั้งค่าเข้าออกแบบไม่ใช้บัตรก่อน', sample: 'ข้อมูลตัวอย่าง', mall: 'ห้าง', zone: 'โซน', bay: 'ช่อง',
      pickMall: 'เลือกห้าง', plateAdded: 'เพิ่มทะเบียนแล้ว', alreadyParked: 'คุณมีบัตรจอดที่ใช้งานอยู่แล้ว',
      hideFor: 'นาที', back: 'กลับ', thb: '฿', baht: 'บาท', duration: 'ระยะเวลา',
    },
  };
  const t = (k) => T[S.lang][k] ?? T.en[k] ?? k;
  const nm = (o) => (S.lang === 'th' ? o.name_th : o.name_en);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => `${t('thb')}${Math.round(n).toLocaleString('en-US')}`;

  // ---------- icons (line style, like lucide) ----------
  const ic = (p, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${p}</svg>`;
  const I = {
    map: ic('<path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z"/><path d="M9 3v16M15 5v16"/>'),
    car: ic('<path d="M5 17h14M6 17v2M18 17v2M4 13l2-6h12l2 6v4H4v-4Z"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>'),
    user: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
    search: ic('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
    mic: ic('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
    loc: ic('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/>'),
    list: ic('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
    back: ic('<path d="m15 18-6-6 6-6"/>'),
    x: ic('<path d="M18 6 6 18M6 6l12 12"/>'),
    zap: ic('<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>'),
    acc: ic('<circle cx="12" cy="4" r="2"/><path d="M12 7v6h5l2 6M8 10a6 6 0 1 0 7 9"/>'),
    fam: ic('<circle cx="8" cy="6" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 21v-3a5 5 0 0 1 10 0v3M14 21v-2a3 3 0 0 1 6 0v2"/>'),
    check: ic('<path d="M20 6 9 17l-5-5"/>'),
    info: ic('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>'),
    wallet: ic('<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Z"/><circle cx="16" cy="14.5" r="1"/>'),
    ticket: ic('<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M13 6v12" stroke-dasharray="2 2"/>'),
    pin: ic('<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>'),
    lock: ic('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    p: ic('<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M10 17V7h3a3 3 0 0 1 0 6h-3"/>'),
  };

  // ---------- data helpers ----------
  const mallById = new Map(D.malls.map((m) => [m.id, m]));
  const floorById = new Map();
  const floorsOf = new Map(D.malls.map((m) => [m.id, []]));
  for (const f of D.floors) {
    f.bays = f.bays.map(([code, zone, x, y, w, h, type, node, lift]) => ({ code, zone, x, y, w, h, type: { n: 'normal', e: 'ev', a: 'accessible', f: 'family' }[type], node, lift }));
    f.taken = new Uint8Array(f.bays.length);
    floorById.set(f.id, f);
    floorsOf.get(f.mall_id).push(f);
  }
  for (const list of floorsOf.values()) list.sort((a, b) => a.order - b.order);

  const km = (a, b) => {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const dist = (m) => km(DEMO_LOC, m);
  const distLabel = (m) => { const d = dist(m); return d < 1 ? `${Math.round(d * 1000)} ${t('m')}` : `${d.toFixed(1)} ${t('km')}`; };
  const floorStats = (f) => {
    let free = 0; const sp = { ev: 0, accessible: 0, family: 0 };
    f.bays.forEach((b, i) => { if (!f.taken[i]) { free++; if (b.type !== 'normal') sp[b.type]++; } });
    return { free, total: f.bays.length, ...sp };
  };
  const mallStats = (m) => floorsOf.get(m.id).reduce((a, f) => { const s = floorStats(f); a.free += s.free; a.total += s.total; return a; }, { free: 0, total: 0 });
  const availColour = (free, total) => { const r = total ? free / total : 0; return r > 0.3 ? 'var(--success)' : r >= 0.1 ? 'var(--warning)' : 'var(--danger)'; };
  const availWord = (free, total) => { const r = total ? free / total : 0; return S.lang === 'th' ? (r > 0.3 ? 'ว่างมาก' : r >= 0.1 ? 'เริ่มเต็ม' : 'เกือบเต็ม') : (r > 0.3 ? 'Plenty' : r >= 0.1 ? 'Filling up' : 'Almost full'); };
  // FR-8 / FR-23: every started hour after the free period is charged in full (same as server/src/fees.ts)
  const fee = (rule, minutes, validated) => { const free = validated ? rule.free_minutes_with_purchase : rule.free_minutes; return minutes <= free ? 0 : Math.ceil((minutes - free) / 60) * rule.hourly_thb; };

  // ---------- occupancy simulator (like server/src/simulator.ts) ----------
  let seed = 20261103;
  const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const BUSY = { 'siam-paragon': 0.86, centralworld: 0.72, iconsiam: 0.6, 'robinson-lat-krabang': 0.42, 'lotuss-rama-4': 0.93 };
  for (const f of D.floors) {
    const n = floorsOf.get(f.mall_id).length;
    // floors near the entrance fill first
    f.target = Math.min(0.99, Math.max(0.15, (BUSY[f.mall_id] ?? 0.6) + 0.12 - (0.24 * f.order) / Math.max(1, n - 1) + (rnd() - 0.5) * 0.1));
    f.bays.forEach((_, i) => { f.taken[i] = rnd() < f.target ? 1 : 0; });
  }
  const simulate = () => {
    for (const f of D.floors) {
      const flips = Math.max(1, Math.round(f.bays.length * 0.02));
      for (let k = 0; k < flips; k++) {
        const i = Math.floor(rnd() * f.bays.length);
        f.taken[i] = rnd() < f.target ? 1 : 0;
      }
    }
  };

  // ---------- routing (FR-12, same algorithm as app/src/lib/route.ts) ----------
  const graphCache = new Map();
  const paths = (f) => {
    if (graphCache.has(f.id)) return graphCache.get(f.id);
    const pos = new Map(f.plan.nodes.map(([id, x, y]) => [id, { x, y }]));
    const adj = new Map();
    const link = (a, b) => { const p = pos.get(a), q = pos.get(b); if (!p || !q) return; if (!adj.has(a)) adj.set(a, []); adj.get(a).push({ to: b, w: Math.hypot(p.x - q.x, p.y - q.y) }); };
    for (const [a, b, one] of f.plan.edges) { link(a, b); if (!one) link(b, a); }
    const dist = new Map([['entry', 0]]), prev = new Map(), done = new Set();
    for (;;) {
      let u; for (const [id, d] of dist) if (!done.has(id) && (u === undefined || d < dist.get(u))) u = id;
      if (u === undefined) break; done.add(u);
      for (const { to, w } of adj.get(u) ?? []) { const nd = dist.get(u) + w; if (nd < (dist.get(to) ?? Infinity)) { dist.set(to, nd); prev.set(to, u); } }
    }
    const g = { pos, dist, prev };
    graphCache.set(f.id, g); return g;
  };
  const routeTo = (f, i) => {
    const g = paths(f), b = f.bays[i];
    if (!g.dist.has(b.node)) return null;
    const ids = [b.node]; while (ids[0] !== 'entry') ids.unshift(g.prev.get(ids[0]));
    const lane = g.pos.get(b.node), c = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    return { i, points: [...ids.map((id) => g.pos.get(id)), c], drive: g.dist.get(b.node) + Math.hypot(c.x - lane.x, c.y - lane.y) };
  };
  const suggest = (f) => {
    const g = paths(f); let best = null;
    f.bays.forEach((b, i) => {
      if (f.taken[i] || b.type !== 'normal' || !g.dist.has(b.node)) return;
      const score = S.pref === 'ramp' ? g.dist.get(b.node) : b.lift + g.dist.get(b.node) / 1000;
      if (!best || score < best.score) best = { i, score };
    });
    return best && routeTo(f, best.i);
  };

  // ---------- DOM ----------
  const $ = (s, el = document) => el.querySelector(s);
  const app = $('#app');
  app.innerHTML = `
    <div class="main">
      <section id="tab-map" class="page" style="padding:0;overflow:hidden">
        <div id="map" role="application" aria-label="Map"></div>
        <div class="search" id="search"></div>
        <div class="fabs">
          <button class="fab" data-act="locate" id="fab-loc"></button>
          <button class="fab" data-act="nearby" id="fab-near"></button>
        </div>
        <div id="parked-chip"></div>
      </section>
      <section id="tab-parking" class="page" hidden></section>
      <section id="tab-account" class="page" hidden></section>
      <div id="stack"></div>
      <div id="overlay"></div>
    </div>
    <nav class="tabbar" id="tabbar"></nav>
    <div id="toast" aria-live="polite"></div>`;

  let toastTimer;
  const toast = (msg) => { const el = $('#toast'); el.innerHTML = `<div class="toast">${esc(msg)}</div>`; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.innerHTML = ''; }, 2600); };

  // ---------- theme ----------
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => S.theme === 'dark' || (S.theme === 'system' && mq.matches);
  const applyTheme = () => {
    document.documentElement.dataset.theme = isDark() ? 'dark' : 'light';
    if (tiles) { const url = tileUrl(); if (tiles._url !== url) tiles.setUrl(url); }
  };
  mq.addEventListener?.('change', applyTheme);

  // ---------- map (UI-3 to UI-13) ----------
  let map = null, tiles = null; const markers = new Map();
  const tileUrl = () => `https://{s}.basemaps.cartocdn.com/${isDark() ? 'dark_all' : 'rastertiles/voyager'}/{z}/{x}/{y}{r}.png`;
  const initMap = () => {
    if (!window.L) { $('#map').innerHTML = '<p class="muted" style="padding:90px 20px">Map library could not load. The rest of the demo still works.</p>'; return; }
    map = L.map('map', { zoomControl: false, attributionControl: true }).setView([13.735, 100.585], 12);
    tiles = L.tileLayer(tileUrl(), { maxZoom: 19, subdomains: 'abcd', attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
    L.circleMarker([DEMO_LOC.lat, DEMO_LOC.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#1e64c8', fillOpacity: 1 }).addTo(map);
    for (const m of D.malls) {
      const mk = L.marker([m.lat, m.lng], { icon: L.divIcon({ className: '', html: '', iconSize: [0, 0] }), keyboard: true, title: nm(m) })
        .addTo(map).on('click', () => { closeSearch(); S.overlay = { type: 'mall', id: m.id }; renderOverlay(); });
      markers.set(m.id, mk);
    }
    map.on('zoomend', renderMarkers);
    map.on('click', closeSearch);
    // start on the central Bangkok malls; Robinson Lat Krabang is in the Nearby list and one zoom out
    setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(D.malls.filter((m) => m.lng < 100.6).map((m) => [m.lat, m.lng]), { paddingTopLeft: [20, 80], paddingBottomRight: [70, 40] });
      renderMarkers();
    }, 0);
  };
  const renderMarkers = () => {
    if (!map) return;
    const z = map.getZoom();
    const boxes = []; // placed label rectangles in screen pixels, to avoid overlaps (UI-12)
    const hit = (r) => boxes.some((q) => r.x1 < q.x2 && r.x2 > q.x1 && r.y1 < q.y2 && r.y2 > q.y1);
    for (const m of [...D.malls].sort((a, b) => mallStats(b).total - mallStats(a).total)) {
      const s = mallStats(m); const c = availColour(s.free, s.total);
      const p = map.latLngToContainerPoint([m.lat, m.lng]);
      let html;
      if (z < 11) {
        html = `<div class="mall-label small" style="--c:${c};padding:4px;transform:translate(-50%,-50%)"><i class="dot"></i></div>`;
      } else {
        const small = z < 12;
        const w = Math.max(nm(m).length * 7.5, small ? 0 : 130) + 34, h = small ? 30 : 44;
        const spots = [
          { x1: p.x - w / 2, y1: p.y - h - 4, tf: 'translate(-50%,-100%) translateY(-4px)' },
          { x1: p.x - w / 2, y1: p.y + 6, tf: 'translate(-50%,6px)' },
          { x1: p.x + 8, y1: p.y - h / 2, tf: 'translate(8px,-50%)' },
          { x1: p.x - w - 8, y1: p.y - h / 2, tf: 'translate(calc(-100% - 8px),-50%)' },
        ].map((o) => ({ ...o, x2: o.x1 + w, y2: o.y1 + h }));
        const W = map.getSize().x;
        const spot = spots.find((o) => !hit(o) && o.x1 >= 0 && o.x2 <= W) ?? spots.find((o) => !hit(o)) ?? spots[0];
        boxes.push(spot, { x1: p.x - 6, y1: p.y - 6, x2: p.x + 6, y2: p.y + 6 });
        html = `<div class="mall-label ${small ? 'small' : ''}" style="--c:${c};transform:${spot.tf}" aria-label="${esc(nm(m))}, ${s.free} ${t('free')}">
            <i class="dot"></i><div><b>${esc(nm(m))}</b><span>${s.free.toLocaleString()} ${t('free')} · ${availWord(s.free, s.total)}</span></div></div>
            <div style="position:absolute;width:10px;height:10px;border-radius:50%;background:${c};border:2px solid #fff;transform:translate(-50%,-50%);box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`;
      }
      markers.get(m.id).setIcon(L.divIcon({ className: '', html, iconSize: [0, 0] }));
    }
  };

  // ---------- search (FR-16, UI-5, UI-6) ----------
  const norm = (s) => s.toLowerCase().replace(/[\s'’.-]/g, '');
  const searchMalls = (q) => {
    const n = norm(q);
    return D.malls.map((m) => {
      const hay = [m.name_en, m.name_th, m.area_en, m.area_th, ...m.aliases].map(norm);
      let score = 0;
      for (const h of hay) { if (h.startsWith(n)) score = Math.max(score, 3); else if (h.includes(n)) score = Math.max(score, 2); else if (n.length > 3 && n.includes(h)) score = Math.max(score, 1); }
      return { m, score };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || dist(a.m) - dist(b.m)).slice(0, 3).map((x) => x.m);
  };
  const mallRow = (m, act = 'open-card') => {
    const s = mallStats(m);
    return `<button class="row" data-act="${act}" data-id="${m.id}">
      <span class="chip" style="background:transparent;border:2px solid ${availColour(s.free, s.total)};color:var(--text)">${I.p}</span>
      <span class="grow"><span class="title">${esc(nm(m))}</span><span class="sub">${distLabel(m)} · ${esc(S.lang === 'th' ? m.area_th : m.area_en)}</span></span>
      <span style="text-align:right"><b>${s.free.toLocaleString()}</b><span class="sub" style="display:block">${t('free')}</span></span></button>`;
  };
  const renderSearch = () => {
    const el = $('#search');
    if (!el.firstChild) {
      el.innerHTML = `<div class="pill">${I.search}<input id="q" type="search" autocomplete="off" aria-label="${esc(t('search'))}"><button class="iconbtn" id="mic" data-act="mic"></button></div><div id="popup"></div>`;
      const q = $('#q');
      q.addEventListener('focus', () => { S.searchOpen = true; renderPopup(); });
      q.addEventListener('input', () => { S.query = q.value; S.searchOpen = true; renderPopup(); });
      q.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSearch(); q.blur(); } });
    }
    const q = $('#q'); q.placeholder = S.listening ? t('listening') : t('search'); q.setAttribute('aria-label', t('search'));
    const mic = $('#mic'); mic.innerHTML = I.mic; mic.classList.toggle('listening', S.listening); mic.setAttribute('aria-label', t('voiceSim'));
    renderPopup();
  };
  const renderPopup = () => {
    const el = $('#popup'); if (!el) return;
    if (!S.searchOpen) { el.innerHTML = ''; return; }
    const q = S.query.trim();
    const list = q ? searchMalls(q) : [...D.malls].sort((a, b) => dist(a) - dist(b)).slice(0, 3);
    el.innerHTML = `<div class="popup"><div class="hint">${q ? t('matches') : t('nearest')}</div>${list.length ? list.map((m) => mallRow(m, 'pick-search')).join('') : `<div class="row muted">${t('none')}</div>`}</div>`;
  };
  const closeSearch = () => { if (!S.searchOpen) return; S.searchOpen = false; renderPopup(); };
  const startVoice = () => {
    // FR-17: real speech recognition where the browser has it (Chrome, Safari), otherwise a simulated phrase.
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    S.listening = true; renderSearch();
    const done = (text) => { S.listening = false; S.query = text; S.searchOpen = true; $('#q').value = text; renderSearch(); };
    if (SR) {
      try {
        const r = new SR(); r.lang = S.lang === 'th' ? 'th-TH' : 'en-US'; r.interimResults = false;
        r.onresult = (e) => done(e.results[0][0].transcript);
        r.onerror = () => done(S.lang === 'th' ? 'พารากอน' : 'icon siam');
        r.onend = () => { if (S.listening) { S.listening = false; renderSearch(); } };
        r.start(); return;
      } catch { /* fall through to simulation */ }
    }
    toast(t('voiceSim'));
    setTimeout(() => done(S.lang === 'th' ? 'พารากอน' : 'icon siam'), 1500);
  };

  // ---------- overlays ----------
  const renderOverlay = () => {
    const o = S.overlay, el = $('#overlay');
    if (!o) { el.innerHTML = ''; return; }
    let inner = '';
    if (o.type === 'mall') {
      const m = mallById.get(o.id), s = mallStats(m);
      inner = `<div class="sheet" role="dialog" aria-label="${esc(nm(m))}"><div class="grab"></div>
        <h3>${esc(nm(m))}</h3><div class="muted small">${distLabel(m)} · ${esc(S.lang === 'th' ? m.area_th : m.area_en)} · ${t('hours')} ${m.hours.open}–${m.hours.close}</div>
        <div class="card" style="margin-top:12px"><div style="display:flex;align-items:baseline;gap:8px"><span class="big" style="color:${availColour(s.free, s.total)}">${s.free.toLocaleString()}</span><span class="muted">${t('free')} ${t('of')} ${s.total.toLocaleString()} · ${availWord(s.free, s.total)}</span></div>
        <div class="bar" style="--c:${availColour(s.free, s.total)}"><i style="width:${(100 * s.free) / s.total}%"></i></div></div>
        <div class="small"><b>${t('fees')}:</b> ${esc(S.lang === 'th' ? m.fees.summary_th : m.fees.summary_en)}</div>
        <div class="btns"><button class="btn" data-act="open-mall" data-id="${m.id}">${I.p}${t('chooseSpot')}</button></div></div>`;
    } else if (o.type === 'nearby') {
      inner = `<div class="sheet" role="dialog" aria-label="${t('nearby')}"><div class="grab"></div><h3>${t('nearby')}</h3>
        ${[...D.malls].sort((a, b) => dist(a) - dist(b)).map((m) => mallRow(m)).join('')}</div>`;
    } else if (o.type === 'how') {
      inner = `<div class="modal" role="dialog"><h3>${t('how')}</h3><ol class="how"><li>${t('how1')}</li><li>${t('how2')}</li><li>${t('how3')}</li><li>${t('how4')}</li></ol>
        <button class="btn" data-act="close">${t('close')}</button></div>`;
    } else if (o.type === 'terms') {
      inner = `<div class="modal" role="dialog"><h3>${t('terms')}</h3><p class="small">${t('termsBody')}</p>
        <label class="check"><input type="checkbox" id="tick1"><span>${t('tick1')}</span></label>
        <label class="check"><input type="checkbox" id="tick2"><span>${t('tick2')}</span></label>
        <div class="btns"><button class="btn ghost" data-act="close">${t('close')}</button><button class="btn" id="accept" data-act="accept" disabled>${t('accept')}</button></div></div>`;
    } else if (o.type === 'plate') {
      const provinces = ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'ชลบุรี', 'เชียงใหม่', 'ภูเก็ต', 'ขอนแก่น'];
      inner = `<div class="modal" role="dialog"><h3>${t('addPlate')}</h3>
        <label class="field"><span>${t('plateNo')}</span><input id="plate-no" value="1กก 1234" maxlength="10"></label>
        <label class="field"><span>${t('province')}</span><select id="plate-prov">${provinces.map((p) => `<option>${p}</option>`).join('')}</select></label>
        <div class="btns"><button class="btn ghost" data-act="close">${t('close')}</button><button class="btn" data-act="save-plate">${t('addPlate')}</button></div></div>`;
    } else if (o.type === 'topup') {
      const amt = o.amount ?? 300, method = o.method ?? 'promptpay';
      inner = `<div class="sheet" role="dialog" aria-label="${t('topUp')}"><div class="grab"></div><h3>${t('topUp')}</h3>
        <div class="banner">${t('demoPay')}</div>
        <div class="small muted" style="margin-bottom:6px">${t('amount')}</div>
        <div class="grid4">${[100, 300, 500, 1000].map((a) => `<button data-act="amt" data-v="${a}" aria-pressed="${a === amt}">${a.toLocaleString()}</button>`).join('')}</div>
        <label class="field"><span>${t('custom')}</span><input id="custom-amt" type="number" min="20" max="10000" inputmode="numeric" placeholder="${amt}"></label>
        <div class="small muted" style="margin:6px 0">${t('method')}</div>
        <div class="seg"><button data-act="method" data-v="promptpay" aria-pressed="${method === 'promptpay'}">${t('promptpay')}</button><button data-act="method" data-v="card" aria-pressed="${method === 'card'}">${t('card')}</button></div>
        ${method === 'promptpay'
          ? `<div style="text-align:center;margin:14px 0">${fakeQr()}<div class="small muted">${t('qrNote')}</div></div><button class="btn" data-act="do-topup">${t('simPaid')}</button>`
          : `<label class="field"><span>${t('cardNo')}</span><input id="card-no" inputmode="numeric" autocomplete="off" placeholder="4242 4242 4242 4242"></label>
             <div style="display:flex;gap:10px"><label class="field" style="flex:1"><span>MM/YY</span><input autocomplete="off" placeholder="12/30"></label><label class="field" style="flex:1"><span>CVC</span><input autocomplete="off" placeholder="123"></label></div>
             <div class="small muted">${t('testCard')}</div><div class="btns"><button class="btn" data-act="do-topup">${t('topUp')}</button></div>`}
      </div>`;
    } else if (o.type === 'demo-ticket') {
      inner = `<div class="modal" role="dialog"><h3>${t('demoTicket')}</h3>
        <label class="field"><span>${t('mall')}</span><select id="dt-mall">${D.malls.map((m) => `<option value="${m.id}">${esc(nm(m))}</option>`).join('')}</select></label>
        <label class="field"><span>${t('plate')}</span><select id="dt-plate">${S.plates.map((p, i) => `<option value="${i}">${esc(p.number)} ${esc(p.province)}</option>`).join('')}</select></label>
        <label class="field"><span>${t('enteredAgo')}</span><input id="dt-min" type="number" value="${o.minutes ?? 200}" min="0" max="1440"></label>
        <div class="btns"><button class="btn ghost" data-act="close">${t('close')}</button><button class="btn" data-act="make-ticket">${t('create')}</button></div></div>`;
    }
    el.innerHTML = `<div class="scrim" data-act="close"></div>${inner}`;
    if (o.type === 'terms') {
      const upd = () => { $('#accept').disabled = !($('#tick1').checked && $('#tick2').checked); };
      $('#tick1').onchange = upd; $('#tick2').onchange = upd;
    }
  };
  const fakeQr = () => {
    let s = 9; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    let cells = '';
    for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) {
      const finder = (x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17);
      const on = finder ? (x % 18 === 0 || y % 18 === 0 || x % 18 === 6 || y % 18 === 6 || ((x % 18) > 1 && (x % 18) < 5 && (y % 18) > 1 && (y % 18) < 5)) : r() > 0.55;
      if (on) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    return `<svg viewBox="-2 -2 29 29" width="170" height="170" style="background:#fff;border-radius:12px" aria-label="Placeholder QR"><g fill="#0b1b33">${cells}</g></svg>`;
  };

  // ---------- stack screens: mall (FR-5 to FR-8) and floor (FR-9 to FR-15) ----------
  const renderStack = () => {
    const el = $('#stack');
    const top = S.stack[S.stack.length - 1];
    if (!top) { el.innerHTML = ''; return; }
    const prevBody = el.querySelector('.body'); const scroll = prevBody && el.dataset.key === top.type + top.id ? prevBody.scrollTop : 0;
    el.dataset.key = top.type + top.id;
    el.innerHTML = top.type === 'mall' ? mallScreen(mallById.get(top.id)) : floorScreen(floorById.get(top.id));
    const body = el.querySelector('.body'); if (body) body.scrollTop = scroll;
  };
  const header = (title, sub = '') => `<header><button class="iconbtn" data-act="pop" aria-label="${t('back')}">${I.back}</button><div class="t">${esc(title)}${sub ? `<div class="small muted" style="font-weight:400">${sub}</div>` : ''}</div><span class="chip ok" style="margin-right:8px">● ${t('live')}</span></header>`;
  const mallScreen = (m) => {
    const fl = floorsOf.get(m.id).map((f) => ({ f, s: floorStats(f) }));
    const bestId = fl.reduce((a, b) => (b.s.free > a.s.free ? b : a)).f.id;
    if (S.sortFloors === 'free') fl.sort((a, b) => b.s.free - a.s.free);
    return `<div class="screen">${header(nm(m), `${distLabel(m)} · ${t('hours')} ${m.hours.open}–${m.hours.close}`)}<div class="body">
      <div class="card"><div class="small muted">${t('fees')}</div><div>${esc(S.lang === 'th' ? m.fees.summary_th : m.fees.summary_en)}</div></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin:18px 0 8px"><b>${t('floors')}</b>
        <div class="seg" style="width:220px"><button data-act="sort" data-v="free" aria-pressed="${S.sortFloors === 'free'}">${t('mostFree')}</button><button data-act="sort" data-v="order" aria-pressed="${S.sortFloors === 'order'}">${t('floorOrder')}</button></div></div>
      ${fl.map(({ f, s }) => {
        const c = availColour(s.free, s.total);
        return `<button class="card row" style="display:block;margin-bottom:10px;padding:14px 16px" data-act="open-floor" data-id="${f.id}">
          <div style="display:flex;align-items:center;gap:10px"><span class="chip" style="min-width:42px;justify-content:center">${f.level}</span>
          <span class="grow title">${esc(nm(f))}</span>${f.id === bestId ? `<span class="chip ok">${I.check}${t('best')}</span>` : ''}
          <span><b>${s.free}</b> <span class="muted small">/ ${s.total}</span></span></div>
          <div class="bar" style="--c:${c}"><i style="width:${(100 * s.free) / s.total}%"></i></div>
          <div style="margin-top:8px"><span class="badge">${I.zap}${t('ev')} ${s.ev}</span><span class="badge">${I.acc}${t('acc')} ${s.accessible}</span><span class="badge">${I.fam}${t('fam')} ${s.family}</span></div></button>`;
      }).join('')}
      <p class="small muted">${t('sample')}</p></div></div>`;
  };
  const floorScreen = (f) => {
    const m = mallById.get(f.mall_id);
    if (S.pickedBay != null && f.taken[S.pickedBay]) { S.pickedBay = null; toast(t('bayTaken')); }
    const r = S.pickedBay != null ? routeTo(f, S.pickedBay) : suggest(f);
    const s = floorStats(f);
    const P = f.plan;
    const svgBays = f.bays.map((b, i) => {
      const tk = f.taken[i], sel = r && r.i === i;
      const icon = b.type === 'normal' ? '' : `<text x="${b.x + b.w / 2}" y="${b.y + b.h / 2 + 0.7}" font-size="2" text-anchor="middle" fill="${tk ? 'var(--taken)' : 'var(--free)'}" font-weight="700">${{ ev: 'EV', accessible: '♿︎', family: 'F' }[b.type]}</text>`;
      return `<g data-act="${tk ? '' : 'pick-bay'}" data-i="${i}" style="cursor:${tk ? 'default' : 'pointer'}"><rect x="${b.x + 0.15}" y="${b.y + 0.15}" width="${b.w - 0.3}" height="${b.h - 0.3}" rx="0.4"
        fill="${tk ? 'url(#hatch)' : 'var(--free-fill)'}" stroke="${sel ? 'var(--route)' : tk ? 'var(--taken)' : 'var(--free)'}" stroke-width="${sel ? 0.6 : 0.15}"><title>${b.zone}-${b.code} ${tk ? t('takenL') : t('freeL')}</title></rect>${icon}</g>`;
    }).join('');
    const pos = new Map(P.nodes.map(([id, x, y]) => [id, { x, y }]));
    const lanes = P.edges.map(([a, b]) => { const p = pos.get(a), q = pos.get(b); return p && q ? `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>` : ''; }).join('');
    const arrows = P.edges.filter((e, k) => e[2] && k % 6 === 0).map(([a, b]) => { const p = pos.get(a), q = pos.get(b); if (!p || !q) return ''; const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI; return `<path d="M-0.8 -0.7 L0.6 0 L-0.8 0.7" transform="translate(${(p.x + q.x) / 2} ${(p.y + q.y) / 2}) rotate(${ang})" fill="none" stroke="var(--muted)" stroke-width="0.3"/>`; }).join('');
    const zones = {}; f.bays.forEach((b) => { (zones[b.zone] ??= []).push(b); });
    const zoneLabels = Object.entries(zones).map(([z, bs]) => { const x = bs.reduce((a, b) => a + b.x + b.w / 2, 0) / bs.length; const y = Math.min(...bs.map((b) => b.y)) - 0.6; return `<text x="${x}" y="${y}" font-size="2.2" text-anchor="middle" fill="var(--muted)" font-weight="700">${t('zone')} ${z}</text>`; }).join('');
    const box = (o, fill) => {
      const label = (S.lang === 'th' ? o.th : o.en).split('/')[0].replace(/ to mall| ไปห้าง/, '');
      const fs = Math.min(1.7, (o.w * 1.6) / Math.max(4, label.length));
      return `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="1" fill="${fill}"/><text x="${o.x + o.w / 2}" y="${o.y + o.h / 2 + fs / 3}" font-size="${fs}" text-anchor="middle" fill="var(--text)">${esc(label)}</text>`;
    };
    const routeSvg = r ? `<polyline points="${r.points.map((p) => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="var(--route)" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round" class="route-line"/>` : '';
    const b = r && f.bays[r.i];
    const parkedHere = S.parked && S.parked.floor_id === f.id;
    return `<div class="screen">${header(`${nm(m)} · ${f.level}`, `${s.free} ${t('free')} ${t('of')} ${s.total}`)}<div class="body">
      <div class="seg" style="margin-bottom:10px"><button data-act="pref" data-v="ramp" aria-pressed="${S.pref === 'ramp'}">${t('nearRamp')}</button><button data-act="pref" data-v="lift" aria-pressed="${S.pref === 'lift'}">${t('nearLift')}</button></div>
      <div class="plan-wrap"><svg viewBox="-1 -1 ${P.width + 2} ${P.height + 2}" role="img" aria-label="Floor plan ${f.level}">
        <defs><pattern id="hatch" width="1" height="1" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1" height="1" fill="var(--taken-fill)"/><line x1="0" y1="0" x2="0" y2="1" stroke="var(--taken)" stroke-width="0.35"/></pattern></defs>
        <rect x="0" y="0" width="${P.width}" height="${P.height}" rx="1.5" fill="var(--bg)" stroke="var(--border)" stroke-width="0.4"/>
        <g stroke="var(--lane)" stroke-width="3" stroke-linecap="round">${lanes}</g>${arrows}
        ${P.ramps.map((o) => box(o, 'var(--ramp)')).join('')}${P.lobbies.map((o) => box(o, 'var(--lobby)')).join('')}
        ${zoneLabels}${svgBays}${routeSvg}
        ${parkedHere ? (() => { const pb = f.bays.find((x) => x.code === S.parked.code); return pb ? `<circle cx="${pb.x + pb.w / 2}" cy="${pb.y + pb.h / 2}" r="1.6" fill="var(--danger)" stroke="#fff" stroke-width="0.4"/>` : ''; })() : ''}
      </svg></div>
      <div class="legend"><span><i style="background:var(--free-fill);border:1px solid var(--free)"></i>${t('freeL')}</span><span><i style="background:var(--taken-fill);border:1px solid var(--taken)"></i>${t('takenL')}</span><span><i style="background:var(--route)"></i>${t('route')}</span><span>EV · ♿︎ · F = ${t('fam')}</span></div>
      ${r ? `<div class="card"><div class="small muted">${S.pickedBay != null ? t('yourPick') : t('suggested')}</div>
          <div style="font-size:20px;font-weight:700">${f.level} ${t('zone')} ${b.zone} · ${t('bay')} ${b.zone}-${b.code}</div>
          <div class="muted small">${Math.round(r.drive)} ${t('m')} ${t('drive')} · ${Math.round(b.lift)} ${t('m')} ${t('walk')}</div>
          <div class="btns"><button class="btn" data-act="park" data-i="${r.i}">${I.pin}${t('parkedHere')}</button></div>
          <div class="small muted" style="margin-top:8px">${t('tapBay')}</div></div>`
        : `<div class="card">${t('noFree')}</div>`}
      </div></div>`;
  };

  // ---------- tabs ----------
  const renderTabbar = () => {
    const tab = (id, icon, label, mid = false) => `<button class="tab ${mid ? 'mid' : ''}" data-act="tab" data-v="${id}" ${S.tab === id ? 'aria-current="page"' : ''}>${mid ? `<span class="bubble">${icon}</span>` : icon}<span>${label}</span></button>`;
    $('#tabbar').innerHTML = tab('map', I.map, t('map')) + tab('parking', I.car, t('parking'), true) + tab('account', I.user, t('account'));
  };
  const setupDone = () => S.consent && S.plates.length > 0;
  const minutesSince = (iso) => Math.max(0, (Date.now() - new Date(iso).getTime()) / 60000);
  const hms = (min) => { const s = Math.floor(min * 60); return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  const fmtTime = (iso) => new Date(iso).toLocaleString(S.lang === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const plateBox = (p) => `<span class="plate"><b>${esc(p.number)}</b><span>${esc(p.province)}</span></span>`;

  const renderParking = () => {
    const el = $('#tab-parking');
    if (!setupDone()) {
      el.innerHTML = `<h1>${t('parking')}</h1><div class="card" style="text-align:center;padding:28px 20px"><div style="width:56px;height:56px;margin:0 auto 10px;color:var(--accent-text)">${I.lock}</div>
        <h3 style="margin:0 0 6px">${t('lockedTitle')}</h3><p class="muted">${t('lockedBody')}</p><button class="btn" data-act="go-setup">${t('setUp')}</button></div>
        <button class="btn ghost" data-act="how">${I.info}${t('how')}</button>`;
      return;
    }
    const tk = S.ticket;
    let ticketHtml;
    if (tk) {
      const m = mallById.get(tk.mall_id), min = minutesSince(tk.entry_at);
      const due = tk.paid_at ? 0 : fee(m.fees, min, tk.validated);
      const short = !tk.paid_at && S.wallet.balance < due;
      ticketHtml = `<div class="card" style="background:var(--primary);color:var(--on-primary)">
        <div style="display:flex;justify-content:space-between;align-items:center"><span class="small" style="opacity:.8">${I.ticket.replace('<svg', '<svg width="16" height="16" style="vertical-align:-3px"')} ${t('activeTicket')}</span>${plateBox(tk.plate)}</div>
        <div style="font-size:20px;font-weight:700;margin-top:6px">${esc(nm(m))}</div>
        <div class="small" style="opacity:.85">${t('entered')} ${fmtTime(tk.entry_at)}</div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:14px">
          <div><div class="small" style="opacity:.8">${t('timeParked')}</div><div id="tk-time" style="font-size:22px;font-weight:600;font-variant-numeric:tabular-nums">${hms(min)}</div></div>
          <div style="text-align:right"><div class="small" style="opacity:.8">${t('due')}</div><div class="big" id="tk-due">${tk.paid_at ? '✓' : money(due)}</div></div></div>
      </div>
      ${tk.paid_at ? `<div class="card"><b>${I.check.replace('<svg', '<svg width="18" height="18" style="vertical-align:-3px;color:var(--success)"')} ${t('paid')}</b><div class="btns"><button class="btn" data-act="exit">${t('simExit')}</button></div></div>`
        : `<div class="card"><label class="check" style="padding:0"><input type="checkbox" data-act="validate" ${tk.validated ? 'checked' : ''}><span>${t('validated')}<span class="small muted" style="display:block">${esc(S.lang === 'th' ? m.fees.summary_th : m.fees.summary_en)}</span></span></label>
          <div class="btns">${short ? `<button class="btn" data-act="topup">${I.wallet}${t('topUpFirst')}</button>` : `<button class="btn" data-act="pay">${I.wallet}${t('pay')} ${money(due)}</button>`}</div>
          <div class="btns"><button class="btn ghost" data-act="exit">${t('simExit')}</button></div></div>`}`;
    } else {
      ticketHtml = `<div class="card"><b>${t('noTicket')}</b><p class="muted small">${t('noTicketBody')}</p><button class="btn secondary" data-act="demo-ticket" data-min="5">${t('simEntry')}</button></div>`;
    }
    el.innerHTML = `<h1>${t('parking')}</h1>${ticketHtml}
      <div class="card" style="display:flex;align-items:center;gap:12px"><span style="width:28px;color:var(--accent-text)">${I.wallet}</span><div class="grow" style="flex:1"><div class="small muted">${t('wallet')}</div><div style="font-size:22px;font-weight:700">${money(S.wallet.balance)}</div></div><button class="btn secondary" style="width:auto" data-act="topup">${t('topUp')}</button></div>
      <h2>${t('myPlates')}</h2><div class="card">${S.plates.map((p) => `<div class="kv" style="align-items:center">${plateBox(p)}${tk && tk.plate.number === p.number ? `<span class="chip ok">${t('parkedNow')}</span>` : ''}</div>`).join('')}</div>
      <h2>${t('history')}</h2>${S.history.length ? `<div class="card" style="padding:4px 0">${S.history.slice(0, 8).map((h) => `<div class="row" style="min-height:0"><span class="grow"><span class="title">${esc(nm(mallById.get(h.mall_id)))}</span><span class="sub">${fmtTime(h.entry_at)} · ${hms(h.minutes).slice(0, -3)} h</span></span><b>${money(h.fee)}</b></div>`).join('')}</div>` : `<p class="muted small">${t('noHistory')}</p>`}
      <button class="btn ghost" style="margin-top:8px" data-act="how">${I.info}${t('how')}</button>`;
  };

  const renderAccount = () => {
    const el = $('#tab-account');
    const login = S.account
      ? `<div class="card" style="display:flex;align-items:center;gap:12px"><div style="width:48px;height:48px;border-radius:50%;background:var(--primary);color:var(--on-primary);display:grid;place-items:center;font-weight:700;font-size:20px">${esc(S.account.name[0] || '?').toUpperCase()}</div>
          <div style="flex:1;min-width:0"><b>${t('hello')}, ${esc(S.account.name)}</b><div class="small muted">${esc(S.account.email)}</div></div><button class="btn ghost" style="width:auto" data-act="logout">${t('logout')}</button></div>`
      : `<div class="card"><b>${t('login')}</b>
          <label class="field"><span>${t('email')}</span><input id="lg-email" type="email" value="asia@demo.th" autocomplete="off"></label>
          <label class="field"><span>${t('name')}</span><input id="lg-name" value="Asia"></label>
          <label class="field"><span>${t('password')}</span><input id="lg-pass" type="password" value="demo1234"></label>
          <div class="small muted">${t('demoAcct')}</div><div class="btns"><button class="btn" data-act="login">${t('loginBtn')}</button></div></div>`;
    el.innerHTML = `<h1>${t('account')}</h1>${login}
      <h2>${t('wallet')}</h2><div class="card"><div style="display:flex;align-items:center;justify-content:space-between"><span class="big">${money(S.wallet.balance)}</span><button class="btn" style="width:auto" data-act="topup">${t('topUp')}</button></div>
        <div class="small muted" style="margin-top:12px">${t('tx')}</div>${S.wallet.tx.length ? S.wallet.tx.slice(0, 5).map((x) => `<div class="kv small"><span>${x.type === 'topup' ? t('topupTx') : t('payTx')} · ${fmtTime(x.at)}</span><b style="color:${x.amount > 0 ? 'var(--success)' : 'var(--text)'}">${x.amount > 0 ? '+' : '−'}${money(Math.abs(x.amount))}</b></div>`).join('') : `<div class="small muted">${t('noTx')}</div>`}</div>
      <h2>${t('ticketless')}</h2><div class="card">
        <div class="kv"><span>${t('ticketless')}</span><b style="color:${setupDone() ? 'var(--success)' : 'var(--muted)'}">${setupDone() ? t('on') : t('off')}</b></div>
        ${S.consent ? S.plates.map((p, i) => `<div class="kv" style="align-items:center">${plateBox(p)}<button class="btn danger" style="width:auto;min-height:40px" data-act="del-plate" data-i="${i}">${t('del')}</button></div>`).join('') : ''}
        <div class="btns">${S.consent ? `<button class="btn secondary" data-act="add-plate">${t('addPlate')}</button>` : `<button class="btn" data-act="terms">${t('setUp')}</button>`}</div>
        ${S.consent ? `<div class="btns"><button class="btn danger" data-act="withdraw">${t('withdraw')}</button></div>` : ''}</div>
      <h2>${t('demoTools')}</h2><div class="card"><button class="btn secondary" data-act="demo-ticket">${I.ticket}${t('demoTicket')}</button><div class="btns"><button class="btn danger" data-act="reset">${t('reset')}</button></div></div>
      <h2>${t('settings')}</h2><div class="card">
        <div class="small muted" style="margin-bottom:6px">${t('language')}</div><div class="seg"><button data-act="lang" data-v="th" aria-pressed="${S.lang === 'th'}">ไทย</button><button data-act="lang" data-v="en" aria-pressed="${S.lang === 'en'}">English</button></div>
        <div class="small muted" style="margin:14px 0 6px">${t('theme')}</div><div class="seg">${['system', 'light', 'dark'].map((v) => `<button data-act="theme" data-v="${v}" aria-pressed="${S.theme === v}">${t(v)}</button>`).join('')}</div>
        ${S.parked ? `<div class="kv" style="margin-top:14px"><span>${t('youParked')}</span><b>${esc(parkedLabel())}</b></div>` : ''}</div>
      <p class="small muted" style="text-align:center">${t('sample')} · Thai Mall Parking demo</p>`;
  };
  const parkedLabel = () => { const p = S.parked; const f = floorById.get(p.floor_id); return `${nm(mallById.get(f.mall_id))} ${f.level} ${t('zone')} ${p.zone} · ${p.zone}-${p.code}`; };
  const renderParkedChip = () => {
    $('#parked-chip').innerHTML = S.parked ? `<button class="parked-chip" data-act="open-parked">${I.pin.replace('<svg', '<svg width="16" height="16" style="vertical-align:-3px;color:var(--danger)"')} ${t('youParked')} <b>${esc(parkedLabel())}</b></button>` : '';
  };

  const render = () => {
    document.documentElement.lang = S.lang;
    applyTheme();
    for (const id of ['map', 'parking', 'account']) $(`#tab-${id}`).hidden = S.tab !== id;
    $('#fab-loc').innerHTML = I.loc; $('#fab-loc').setAttribute('aria-label', t('myLoc'));
    $('#fab-near').innerHTML = I.list; $('#fab-near').setAttribute('aria-label', t('nearby'));
    renderTabbar(); renderSearch(); renderParkedChip();
    if (S.tab === 'parking') renderParking();
    if (S.tab === 'account') renderAccount();
    renderStack(); renderOverlay(); renderMarkers();
    if (S.tab === 'map' && map) setTimeout(() => map.invalidateSize(), 0);
  };

  // ---------- actions ----------
  const startTicket = (mallId, plate, minutesAgo) => {
    S.ticket = { mall_id: mallId, plate, entry_at: new Date(Date.now() - minutesAgo * 60000).toISOString(), validated: false, paid_at: null, paid: 0 };
    save('ticket');
  };
  const closeTicket = () => {
    const tk = S.ticket; const m = mallById.get(tk.mall_id); const min = minutesSince(tk.entry_at);
    let total = tk.paid || 0;
    if (!tk.paid_at) { // pay at the exit gate from the balance if it covers it (UI-20 step 3)
      const due = fee(m.fees, min, tk.validated);
      if (due > 0) { S.wallet.balance -= due; S.wallet.tx.unshift({ type: 'payment', amount: -due, at: new Date().toISOString() }); }
      total += due;
    }
    S.history.unshift({ mall_id: tk.mall_id, entry_at: tk.entry_at, minutes: min, fee: total });
    S.ticket = null; save('ticket', 'history', 'wallet');
  };

  const actions = {
    tab: (v) => { S.tab = v; S.stack = []; S.overlay = null; closeSearch(); },
    locate: () => { map?.flyTo([DEMO_LOC.lat, DEMO_LOC.lng], 14); },
    nearby: () => { closeSearch(); S.overlay = { type: 'nearby' }; },
    mic: () => startVoice(),
    'pick-search': (_, id) => { const m = mallById.get(id); S.searchOpen = false; map?.flyTo([m.lat, m.lng], 15); S.overlay = { type: 'mall', id }; },
    'open-card': (_, id) => { const m = mallById.get(id); map?.flyTo([m.lat, m.lng], 15); S.overlay = { type: 'mall', id }; },
    'open-mall': (_, id) => { S.overlay = null; S.stack = [{ type: 'mall', id }]; },
    'open-floor': (_, id) => { S.pickedBay = null; S.stack.push({ type: 'floor', id }); },
    'open-parked': () => { const f = floorById.get(S.parked.floor_id); S.stack = [{ type: 'mall', id: f.mall_id }, { type: 'floor', id: f.id }]; },
    pop: () => { S.stack.pop(); S.pickedBay = null; },
    sort: (v) => { S.sortFloors = v; },
    pref: (v) => { S.pref = v; S.pickedBay = null; },
    'pick-bay': (_, __, el) => { S.pickedBay = Number(el.dataset.i); },
    park: (_, __, el) => {
      const f = floorById.get(S.stack[S.stack.length - 1].id); const b = f.bays[Number(el.dataset.i)];
      S.parked = { floor_id: f.id, zone: b.zone, code: b.code }; save('parked'); toast(`${t('parkedSaved')}: ${parkedLabel()}`);
    },
    close: () => { S.overlay = null; },
    how: () => { S.overlay = { type: 'how' }; },
    'go-setup': () => { S.tab = 'account'; S.overlay = { type: S.consent ? 'plate' : 'terms' }; },
    terms: () => { S.overlay = { type: 'terms' }; },
    accept: () => { S.consent = true; save('consent'); S.overlay = { type: 'plate' }; },
    'add-plate': () => { S.overlay = { type: 'plate' }; },
    'save-plate': () => {
      const number = $('#plate-no').value.trim(); const province = $('#plate-prov').value;
      if (!/^[0-9]{0,1}[ก-ฮ]{1,2}\s?[0-9]{1,4}$/.test(number)) { toast(S.lang === 'th' ? 'รูปแบบทะเบียน เช่น 1กก 1234' : 'Plate format, e.g. 1กก 1234'); return; }
      if (!S.plates.some((p) => p.number === number && p.province === province)) S.plates.push({ number, province });
      save('plates'); S.overlay = null; toast(t('plateAdded'));
    },
    'del-plate': (_, __, el) => { S.plates.splice(Number(el.dataset.i), 1); save('plates'); },
    withdraw: () => { S.consent = false; S.plates = []; S.ticket = null; save('consent', 'plates', 'ticket'); toast(t('withdrawn')); },
    topup: () => { S.overlay = { type: 'topup', amount: 300, method: 'promptpay' }; },
    amt: (v) => { S.overlay.amount = Number(v); },
    method: (v) => { S.overlay.method = v; },
    'do-topup': () => {
      const custom = Number($('#custom-amt')?.value || 0);
      const amount = custom >= 20 ? Math.min(10000, Math.round(custom)) : S.overlay.amount;
      if (S.overlay.method === 'card' && $('#card-no').value.replace(/\D/g, '') !== '4242424242424242') { toast(t('badCard')); return false; }
      S.wallet.balance += amount; S.wallet.tx.unshift({ type: 'topup', amount, at: new Date().toISOString() }); save('wallet');
      S.overlay = null; toast(`${t('topped')} ${money(amount)}`);
    },
    'demo-ticket': (_, __, el) => {
      if (!setupDone()) { toast(t('needSetup')); S.tab = 'account'; S.overlay = { type: S.consent ? 'plate' : 'terms' }; return; }
      if (S.ticket) { toast(t('alreadyParked')); S.tab = 'parking'; return; }
      S.overlay = { type: 'demo-ticket', minutes: el.dataset.min ? Number(el.dataset.min) : 200 };
    },
    'make-ticket': () => {
      startTicket($('#dt-mall').value, S.plates[Number($('#dt-plate').value)], Math.max(0, Number($('#dt-min').value) || 0));
      S.overlay = null; S.tab = 'parking'; toast(t('gateOpen'));
    },
    validate: (_, __, el) => { S.ticket.validated = el.checked; save('ticket'); },
    pay: () => {
      const m = mallById.get(S.ticket.mall_id); const due = fee(m.fees, minutesSince(S.ticket.entry_at), S.ticket.validated);
      if (S.wallet.balance < due) { S.overlay = { type: 'topup', amount: 300, method: 'promptpay' }; return; }
      S.wallet.balance -= due; if (due > 0) S.wallet.tx.unshift({ type: 'payment', amount: -due, at: new Date().toISOString() });
      S.ticket.paid_at = new Date().toISOString(); S.ticket.paid = due; save('wallet', 'ticket'); toast(`${t('paidToast')} ${money(due)}`);
    },
    exit: () => {
      const m = mallById.get(S.ticket.mall_id);
      if (!S.ticket.paid_at && S.wallet.balance < fee(m.fees, minutesSince(S.ticket.entry_at), S.ticket.validated)) { toast(t('topUpFirst')); S.overlay = { type: 'topup', amount: 300, method: 'promptpay' }; return; }
      closeTicket(); toast(t('exitToast'));
    },
    login: () => {
      const email = $('#lg-email').value.trim(), name = $('#lg-name').value.trim() || email.split('@')[0];
      if (!/^\S+@\S+\.\S+$/.test(email) || $('#lg-pass').value.length < 4) { toast(S.lang === 'th' ? 'กรอกอีเมลและรหัสผ่านอย่างน้อย 4 ตัว' : 'Enter an email and a password of 4+ characters'); return; }
      S.account = { email, name }; save('account'); // demo: the password is never stored
    },
    logout: () => { S.account = null; save('account'); },
    reset: () => { store.clear(); Object.assign(S, fresh()); S.stack = []; S.overlay = null; toast(t('resetDone')); },
    lang: (v) => { S.lang = v; save('lang'); },
    theme: (v) => { S.theme = v; save('theme'); },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !app.contains(el)) return;
    const act = el.dataset.act; if (!act || !actions[act]) return;
    if (el.tagName === 'INPUT') { actions[act](el.dataset.v, el.dataset.id, el); render(); return; }
    e.preventDefault();
    if (actions[act](el.dataset.v, el.dataset.id, el) === false) return;
    render();
  });
  document.addEventListener('pointerdown', (e) => { if (S.searchOpen && !e.target.closest('#search')) closeSearch(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.overlay) { S.overlay = null; renderOverlay(); } });

  // ---------- live updates (FR-11) ----------
  setInterval(() => {
    simulate();
    renderMarkers();
    if (S.stack.length) renderStack();
    if (S.overlay && (S.overlay.type === 'mall' || S.overlay.type === 'nearby')) renderOverlay();
  }, TICK_MS);
  setInterval(() => {
    if (S.tab !== 'parking' || !S.ticket) return;
    const m = mallById.get(S.ticket.mall_id), min = minutesSince(S.ticket.entry_at);
    const tEl = $('#tk-time'); if (tEl) tEl.textContent = hms(min);
    const dEl = $('#tk-due');
    if (dEl && !S.ticket.paid_at) { const due = fee(m.fees, min, S.ticket.validated); if (dEl.textContent !== money(due)) renderParking(); }
  }, 1000);

  // deep links for the presentation: app.html#parking, #account, #mall=iconsiam
  const h = location.hash.slice(1);
  if (['parking', 'account'].includes(h)) S.tab = h;
  else if (h.startsWith('mall=') && mallById.has(h.slice(5))) S.stack = [{ type: 'mall', id: h.slice(5) }];

  initMap();
  render();
})();
