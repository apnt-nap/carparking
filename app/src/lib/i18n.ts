import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

/** FR-19 / NFR-6: every UI string lives here. Mall, floor and zone names come from the data in both languages (FR-20). */
export const resources = {
  en: {
    translation: {
      tabs: { map: 'Map', parking: 'Parking & Pay', account: 'Account' },
      map: {
        openMall: 'Open mall', free: '{{count}} free', kmAway: '{{km}} km', locating: 'Finding your location…',
        myLocation: 'My location', nearby: 'Nearby', chooseSpot: 'Choose a spot',
        spots: '{{count}} spots available', filling: 'Filling up · {{count}} left', full: 'Full', noData: 'No data',
      },
      search: {
        placeholder: 'Search malls, e.g. Paragon or พารากอน', mic: 'Search by voice', stop: 'Stop listening', clear: 'Clear search',
        listening: 'Listening…', noResults: 'No malls found.', voiceLang: 'Voice language',
        nearest: 'Nearest to you', bestMatches: 'Best matches', recent: 'Recent searches', popular: 'Popular malls',
        voiceUnavailable: 'Voice search needs a development build (it does not work in Expo Go).', voiceError: 'Could not hear that. Try again.',
      },
      price: {
        short: '{{rate}} ฿/hr · first {{free}} free with purchase', perHour: '{{rate}} ฿/hr', baht: '{{amount}} ฿',
        hours: '{{count}} hr', minutes: '{{count}} min',
      },
      prices: { title: 'Prices', byPrice: 'Cheapest', byDistance: 'Nearest', free: '{{time}} free', freeWithPurchase: '{{time}} free with purchase' },
      time: { hm: '{{h}} h {{m}} min', m: '{{m}} min' },
      mall: {
        floors: 'Parking floors', sortFree: 'Most free', sortOrder: 'Floor order', best: 'Best choice',
        freeOf: '{{free}} / {{total}} free', fees: 'Parking price', hours: 'Open {{open}}–{{close}}',
        ev: 'EV', accessible: 'Accessible', family: 'Family', floorLabel: '{{name}}, {{free}} of {{total}} free',
      },
      floor: {
        nearRamp: 'Near the ramp', nearLift: 'Near the mall entrance', suggested: 'Suggested bay', chosen: 'Your chosen bay',
        noFree: 'No free bays on this floor right now.', bay: 'Bay {{id}}', distance: '{{m}} m drive',
        parkedHere: 'I parked here', parkedSaved: 'Saved. You parked at {{zone}}.', tapHint: 'Tap any green bay to go there instead. Pinch to zoom.',
        free: 'Free', taken: 'Taken', route: 'Route', lift: 'Lifts to mall',
        bayLabel: 'Bay {{id}}, {{zone}}, {{status}}{{type}}', live: 'Live', offline: 'Reconnecting…',
      },
      bayType: { ev: 'EV charging', accessible: 'Accessible', family: 'Family', normal: '' },
      parking: {
        parked: 'Parked', left: 'Left', entered: 'In at {{time}}', leftAt: 'Out at {{time}}', unknownPlate: 'Your car',
        timeParked: 'Time parked', totalTime: 'Total time', amountDue: 'Amount due', amountPaid: 'Amount paid',
        paidSoFar: '{{amount}} ฿ already paid', paidFromWallet: 'Paid from wallet', paidAtMachine: 'Paid at the machine',
        navigate: 'Navigate to my car', pay: 'Pay {{amount}} ฿', end: 'End parking', endAutoPay: 'End parking (pay at exit)',
        setPlace: 'Set where you parked',
        banner: 'Parked at {{mall}} · {{time}} · {{amount}} ฿',
        notParked: 'Not parked right now', notParkedHint: 'Drive into a participating mall and the gate reads your plate. Your parking appears here.',
        lockedTitle: 'Ticketless entry is off', lockedLogin: 'Log in with email to use ticketless entry and pay from your wallet.',
        lockedSetup: 'Accept the terms and add your plate to start.', myPlates: 'My plates', history: 'History', noHistory: 'No past visits yet.',
        paidToast: 'Paid {{amount}} ฿ at {{mall}}', leftToast: 'You left {{mall}} · {{time}} · {{amount}} ฿',
        enteredToast: 'You entered {{mall}} at {{time}}',
      },
      howPay: {
        link: 'How paying works', title: 'How paying works',
        s1: 'Your plate is read at the gate, so you don\'t need a ticket.',
        s2: 'The fee builds up while you\'re parked, and you can see it here.',
        s3: 'Pay from your balance before leaving, or it\'s paid automatically at the exit gate if your balance covers it.',
        s4: 'If the plate isn\'t read, use the normal ticket machine.',
      },
      wallet: {
        title: 'Wallet', balance: 'Balance', topUp: 'Top up', noTx: 'No top-ups or payments yet.',
        demoBanner: 'Demo payment, no real money', toppedUp: 'Added {{amount}} ฿. Balance {{balance}} ฿',
        tx_topup: 'Top-up', tx_payment: 'Parking', tx_refund: 'Refund',
        method_promptpay: 'PromptPay', method_card: 'Card', method_wallet: 'Wallet',
      },
      topup: {
        amount: 'Amount', custom: 'Other amount (20–5,000 ฿)', method: 'Pay with', card: 'Credit / debit card',
        qrNote: 'Demo QR: no payment is made. Tap the button below to add the money.',
        cardNote: 'Demo only: use the test card 4242 4242 4242 4242. Never enter a real card.',
        cardNumber: 'Card number', expiry: 'Expiry MM/YY', testOnly: 'Only the test card 4242 4242 4242 4242 works in the demo.',
        paidQr: 'I\'ve paid {{amount}} ฿ (demo)', payCard: 'Pay {{amount}} ฿ by card (demo)',
      },
      auth: {
        loginWithEmail: 'Log in with email', logIn: 'Log in', signUp: 'Sign up', logOut: 'Log out', createAccount: 'Create account',
        email: 'Email', password: 'Password', name: 'Your name', welcome: 'Welcome', welcomeBack: 'Welcome, {{name}}',
        whyLogin: 'Log in to use ticketless entry, your wallet and parking history.',
        demoNote: 'Demo account, stored on this phone.', passwordHint: 'Use at least 6 characters. Don\'t reuse a real password.',
      },
      demo: {
        title: 'Demo tools', addTicket: 'Add demo e-ticket', addTicketHint: 'Pretend one of your cars entered a mall a while ago.',
        started: 'Entered', ago: '{{time}} ago', create: 'Create e-ticket',
        reset: 'Reset demo data', resetHint: 'Delete demo accounts, plates, tickets and wallet on this phone.',
        resetTitle: 'Reset demo data?', resetBody: 'This deletes all demo accounts, plates, tickets and wallet data on this phone.',
        resetDone: 'Demo data reset',
      },
      settings: {
        title: 'Settings', language: 'Language', theme: 'Theme', system: 'System', light: 'Light', dark: 'Dark',
        parked: 'Where I parked', none: 'Nothing saved yet.', clear: 'Clear saved spot',
        ticketless: 'Ticketless entry', ticketlessHint: 'Register your licence plate so mall gates open without a paper ticket.',
        openTicketless: 'Set up ticketless entry',
        dataSource: 'Data source', demo: 'Demo (on this phone)', server: 'Server (PC)',
        demoHint: 'Sample data is simulated on this phone. No PC or internet needed.',
        serverHint: 'Using the mock server at {{url}}. Run "npm run server" on the PC.',
      },
      terms: {
        title: 'Terms & Agreement for ticketless entry',
        intro: 'Before you register a licence plate, please read and accept these terms. This is a prototype: these are sample terms, not legal advice.',
        p1: 'What we collect: your plate number and province, and the times your car enters and leaves participating malls.',
        p2: 'Why: to open the gate for your car, show your e-ticket and work out the parking fee.',
        p3: 'Who sees it: only the parking operator of the mall you visit. We never sell your data.',
        p4: 'How long: entry and exit records are kept only as long as needed for the fee and any dispute. In this prototype, everything is deleted when the server restarts.',
        p5: 'Your rights under the PDPA: you can see, correct or delete your plates at any time, and withdraw your consent here in the app.',
        p6: 'If a gate can\'t read your plate, use the normal ticket machine. Ticketless entry never blocks you from entering.',
        acceptTerms: 'I have read and accept the Terms & Agreement.',
        acceptPdpa: 'I consent to the collection and use of my licence plate data as described above (PDPA).',
        accept: 'Accept and continue', decline: 'Not now',
      },
      plates: {
        title: 'My licence plates', manage: 'Manage plates and consent',
        intro: 'When a participating mall\'s gate reads one of these plates, it opens and your e-ticket appears in Parking & Pay.',
        number: 'Plate number, e.g. 1กก 1234', province: 'Province, e.g. กรุงเทพมหานคร', add: 'Add plate',
        carModel: 'Car model (optional), e.g. Honda City', carColor: 'Car colour (optional)',
        invalid: 'Check the plate: number like "1กก 1234" or "กข 123", and the province written in Thai.',
        none: 'No plates yet.', delete: 'Delete', deleteConfirm: 'Delete plate {{plate}}? Its tickets are deleted too.',
        withdraw: 'Withdraw consent and delete all my plates',
        withdrawConfirm: 'This deletes all your plates and tickets and turns ticketless entry off.',
        acceptedOn: 'Terms accepted on {{date}}', cancel: 'Cancel', confirm: 'Delete',
      },
      tickets: { fee: 'Fee {{fee}} ฿', running: '{{fee}} ฿ so far', validated: 'Purchase validated' },
      gate: {
        title: 'Gate simulator', intro: 'Pretend a mall\'s camera has read a plate at the gate.',
        mall: 'Mall', plate: 'Car', unregistered: 'Unregistered car', direction: 'Gate', entry: 'Entry', exit: 'Exit',
        purchase: 'Purchase', noPurchase: 'No purchase', withPurchase: 'Purchase validated', send: 'Send to gate',
        opened: 'Gate opens', fallback: 'Use the ticket machine', reason_unregistered: 'This plate isn\'t registered.',
        reason_no_open_ticket: 'No open ticket for this car at this mall.', reason_unknown_mall: 'Unknown mall.',
        needPlate: 'Register a plate first, or choose "Unregistered car".',
      },
      errors: {
        generic: 'Something went wrong. Please try again.', login_required: 'Please log in first.',
        invalid_email: 'Enter a valid email address.', weak_password: 'Use a password of at least 6 characters.',
        invalid_name: 'Enter your name.', email_taken: 'An account with this email already exists. Log in instead.',
        bad_credentials: 'Email or password is incorrect.', invalid_amount: 'Top up between 20 and 5,000 ฿.',
        invalid_car: 'Check the car model and colour.', invalid_plate: 'Check the plate number and province.',
        not_found: 'Not found. It may have been deleted.', insufficient_balance: 'Not enough balance. Top up first.',
        nothing_due: 'Nothing to pay right now.', demo_only: 'Only available in demo mode.',
      },
      common: { error: 'Could not reach the parking server.', retry: 'Retry', loading: 'Loading…', cancel: 'Cancel', close: 'Close', gotIt: 'Got it' },
    },
  },
  th: {
    translation: {
      tabs: { map: 'แผนที่', parking: 'จอดและจ่าย', account: 'บัญชี' },
      map: {
        openMall: 'ดูห้าง', free: 'ว่าง {{count}}', kmAway: '{{km}} กม.', locating: 'กำลังหาตำแหน่งของคุณ…',
        myLocation: 'ตำแหน่งของฉัน', nearby: 'ใกล้ฉัน', chooseSpot: 'เลือกที่จอด',
        spots: 'ว่าง {{count}} ช่อง', filling: 'ใกล้เต็ม · เหลือ {{count}}', full: 'เต็ม', noData: 'ไม่มีข้อมูล',
      },
      search: {
        placeholder: 'ค้นหาห้าง เช่น พารากอน หรือ Paragon', mic: 'ค้นหาด้วยเสียง', stop: 'หยุดฟัง', clear: 'ล้างคำค้นหา',
        listening: 'กำลังฟัง…', noResults: 'ไม่พบห้าง', voiceLang: 'ภาษาเสียง',
        nearest: 'ใกล้คุณที่สุด', bestMatches: 'ผลที่ตรงที่สุด', recent: 'ค้นหาล่าสุด', popular: 'ห้างยอดนิยม',
        voiceUnavailable: 'การค้นหาด้วยเสียงต้องใช้ development build (ใช้ใน Expo Go ไม่ได้)', voiceError: 'ฟังไม่ชัด ลองอีกครั้ง',
      },
      price: {
        short: '{{rate}} ฿/ชม. · ฟรี {{free}} แรกเมื่อซื้อสินค้า', perHour: '{{rate}} ฿/ชม.', baht: '{{amount}} ฿',
        hours: '{{count}} ชม.', minutes: '{{count}} นาที',
      },
      prices: { title: 'ราคา', byPrice: 'ถูกที่สุด', byDistance: 'ใกล้ที่สุด', free: 'ฟรี {{time}}', freeWithPurchase: 'ฟรี {{time}} เมื่อซื้อสินค้า' },
      time: { hm: '{{h}} ชม. {{m}} นาที', m: '{{m}} นาที' },
      mall: {
        floors: 'ชั้นจอดรถ', sortFree: 'ว่างมากสุด', sortOrder: 'เรียงตามชั้น', best: 'แนะนำ',
        freeOf: 'ว่าง {{free}} / {{total}}', fees: 'ค่าจอดรถ', hours: 'เปิด {{open}}–{{close}}',
        ev: 'EV', accessible: 'ผู้พิการ', family: 'ครอบครัว', floorLabel: '{{name}} ว่าง {{free}} จาก {{total}} ช่อง',
      },
      floor: {
        nearRamp: 'ใกล้ทางขึ้น', nearLift: 'ใกล้ทางเข้าห้าง', suggested: 'ช่องที่แนะนำ', chosen: 'ช่องที่คุณเลือก',
        noFree: 'ชั้นนี้ไม่มีช่องว่างในขณะนี้', bay: 'ช่อง {{id}}', distance: 'ขับ {{m}} ม.',
        parkedHere: 'ฉันจอดที่นี่', parkedSaved: 'บันทึกแล้ว คุณจอดที่ {{zone}}', tapHint: 'แตะช่องสีเขียวเพื่อเปลี่ยนเส้นทาง ใช้สองนิ้วเพื่อซูม',
        free: 'ว่าง', taken: 'ไม่ว่าง', route: 'เส้นทาง', lift: 'ลิฟต์ไปห้าง',
        bayLabel: 'ช่อง {{id}} {{zone}} {{status}}{{type}}', live: 'สด', offline: 'กำลังเชื่อมต่อใหม่…',
      },
      bayType: { ev: 'ชาร์จรถไฟฟ้า', accessible: 'ผู้พิการ', family: 'ครอบครัว', normal: '' },
      parking: {
        parked: 'กำลังจอด', left: 'ออกแล้ว', entered: 'เข้า {{time}}', leftAt: 'ออก {{time}}', unknownPlate: 'รถของคุณ',
        timeParked: 'เวลาที่จอด', totalTime: 'เวลาทั้งหมด', amountDue: 'ยอดที่ต้องจ่าย', amountPaid: 'ยอดที่จ่าย',
        paidSoFar: 'จ่ายแล้ว {{amount}} ฿', paidFromWallet: 'จ่ายจากกระเป๋าเงิน', paidAtMachine: 'จ่ายที่เครื่อง',
        navigate: 'นำทางไปที่รถ', pay: 'จ่าย {{amount}} ฿', end: 'สิ้นสุดการจอด', endAutoPay: 'สิ้นสุดการจอด (จ่ายตอนออก)',
        setPlace: 'บันทึกที่จอดรถ',
        banner: 'จอดที่ {{mall}} · {{time}} · {{amount}} ฿',
        notParked: 'ยังไม่ได้จอดรถ', notParkedHint: 'ขับเข้าห้างที่ร่วมโครงการ ไม้กั้นจะอ่านป้ายทะเบียน และการจอดจะแสดงที่นี่',
        lockedTitle: 'ยังไม่ได้เปิดการเข้าออกไม่ต้องใช้บัตร', lockedLogin: 'เข้าสู่ระบบด้วยอีเมลเพื่อใช้การเข้าออกไม่ต้องใช้บัตรและจ่ายจากกระเป๋าเงิน',
        lockedSetup: 'ยอมรับข้อกำหนดและเพิ่มป้ายทะเบียนเพื่อเริ่มใช้งาน', myPlates: 'ป้ายทะเบียนของฉัน', history: 'ประวัติ', noHistory: 'ยังไม่มีประวัติการจอด',
        paidToast: 'จ่าย {{amount}} ฿ ที่ {{mall}} แล้ว', leftToast: 'คุณออกจาก {{mall}} · {{time}} · {{amount}} ฿',
        enteredToast: 'คุณเข้า {{mall}} เวลา {{time}}',
      },
      howPay: {
        link: 'การจ่ายเงินทำงานอย่างไร', title: 'การจ่ายเงินทำงานอย่างไร',
        s1: 'ไม้กั้นอ่านป้ายทะเบียนรถของคุณ จึงไม่ต้องรับบัตร',
        s2: 'ค่าจอดจะเพิ่มขึ้นระหว่างที่จอด และดูได้ที่นี่',
        s3: 'จ่ายจากยอดเงินคงเหลือก่อนออก หรือระบบจะหักให้อัตโนมัติที่ไม้กั้นขาออกถ้ายอดเงินพอ',
        s4: 'ถ้าไม้กั้นอ่านป้ายไม่ได้ ให้ใช้เครื่องจ่ายบัตรตามปกติ',
      },
      wallet: {
        title: 'กระเป๋าเงิน', balance: 'ยอดเงินคงเหลือ', topUp: 'เติมเงิน', noTx: 'ยังไม่มีการเติมเงินหรือการจ่าย',
        demoBanner: 'การชำระเงินเดโม ไม่ใช่เงินจริง', toppedUp: 'เติม {{amount}} ฿ แล้ว ยอดคงเหลือ {{balance}} ฿',
        tx_topup: 'เติมเงิน', tx_payment: 'ค่าจอดรถ', tx_refund: 'คืนเงิน',
        method_promptpay: 'พร้อมเพย์', method_card: 'บัตร', method_wallet: 'กระเป๋าเงิน',
      },
      topup: {
        amount: 'จำนวนเงิน', custom: 'จำนวนอื่น (20–5,000 ฿)', method: 'จ่ายด้วย', card: 'บัตรเครดิต / เดบิต',
        qrNote: 'QR เดโม: ไม่มีการชำระเงินจริง แตะปุ่มด้านล่างเพื่อเติมเงิน',
        cardNote: 'เดโมเท่านั้น: ใช้บัตรทดสอบ 4242 4242 4242 4242 ห้ามใส่บัตรจริง',
        cardNumber: 'หมายเลขบัตร', expiry: 'วันหมดอายุ ดด/ปป', testOnly: 'เดโมใช้ได้เฉพาะบัตรทดสอบ 4242 4242 4242 4242',
        paidQr: 'ฉันจ่าย {{amount}} ฿ แล้ว (เดโม)', payCard: 'จ่าย {{amount}} ฿ ด้วยบัตร (เดโม)',
      },
      auth: {
        loginWithEmail: 'เข้าสู่ระบบด้วยอีเมล', logIn: 'เข้าสู่ระบบ', signUp: 'สมัครสมาชิก', logOut: 'ออกจากระบบ', createAccount: 'สร้างบัญชี',
        email: 'อีเมล', password: 'รหัสผ่าน', name: 'ชื่อของคุณ', welcome: 'ยินดีต้อนรับ', welcomeBack: 'ยินดีต้อนรับ {{name}}',
        whyLogin: 'เข้าสู่ระบบเพื่อใช้การเข้าออกไม่ต้องใช้บัตร กระเป๋าเงิน และประวัติการจอด',
        demoNote: 'บัญชีเดโม เก็บไว้ในโทรศัพท์เครื่องนี้', passwordHint: 'ใช้อย่างน้อย 6 ตัวอักษร อย่าใช้รหัสผ่านจริงซ้ำ',
      },
      demo: {
        title: 'เครื่องมือเดโม', addTicket: 'เพิ่มบัตรจอดรถเดโม', addTicketHint: 'จำลองว่ารถของคุณเข้าห้างมาสักพักแล้ว',
        started: 'เข้ามาแล้ว', ago: '{{time}} ที่แล้ว', create: 'สร้างบัตรจอดรถ',
        reset: 'รีเซ็ตข้อมูลเดโม', resetHint: 'ลบบัญชี ป้ายทะเบียน บัตรจอด และกระเป๋าเงินเดโมในเครื่องนี้',
        resetTitle: 'รีเซ็ตข้อมูลเดโม?', resetBody: 'บัญชี ป้ายทะเบียน บัตรจอด และข้อมูลกระเป๋าเงินเดโมทั้งหมดในเครื่องนี้จะถูกลบ',
        resetDone: 'รีเซ็ตข้อมูลเดโมแล้ว',
      },
      settings: {
        title: 'ตั้งค่า', language: 'ภาษา', theme: 'ธีม', system: 'ตามระบบ', light: 'สว่าง', dark: 'มืด',
        parked: 'ที่ที่ฉันจอด', none: 'ยังไม่ได้บันทึก', clear: 'ล้างที่จอดที่บันทึก',
        ticketless: 'เข้าออกไม่ต้องใช้บัตร', ticketlessHint: 'ลงทะเบียนป้ายทะเบียนรถ เพื่อให้ไม้กั้นเปิดเองโดยไม่ต้องรับบัตรจอดรถ',
        openTicketless: 'ตั้งค่าการเข้าออกไม่ต้องใช้บัตร',
        dataSource: 'แหล่งข้อมูล', demo: 'เดโม (ในเครื่องนี้)', server: 'เซิร์ฟเวอร์ (PC)',
        demoHint: 'ข้อมูลตัวอย่างจำลองในโทรศัพท์เครื่องนี้ ไม่ต้องใช้ PC หรืออินเทอร์เน็ต',
        serverHint: 'ใช้เซิร์ฟเวอร์จำลองที่ {{url}} ให้รัน "npm run server" บน PC',
      },
      terms: {
        title: 'ข้อกำหนดและข้อตกลงการเข้าออกไม่ต้องใช้บัตร',
        intro: 'ก่อนลงทะเบียนป้ายทะเบียน โปรดอ่านและยอมรับข้อกำหนดนี้ นี่คือแอปต้นแบบ ข้อกำหนดนี้เป็นตัวอย่าง ไม่ใช่คำแนะนำทางกฎหมาย',
        p1: 'ข้อมูลที่เก็บ: หมายเลขทะเบียนและจังหวัด และเวลาที่รถเข้าและออกจากห้างที่ร่วมโครงการ',
        p2: 'วัตถุประสงค์: เพื่อเปิดไม้กั้นให้รถของคุณ แสดงบัตรจอดรถอิเล็กทรอนิกส์ และคำนวณค่าจอดรถ',
        p3: 'ผู้ที่เห็นข้อมูล: เฉพาะผู้ให้บริการที่จอดรถของห้างที่คุณไป เราไม่ขายข้อมูลของคุณ',
        p4: 'ระยะเวลาเก็บ: เก็บประวัติเข้าออกเท่าที่จำเป็นสำหรับค่าจอดและกรณีโต้แย้ง ในแอปต้นแบบนี้ ข้อมูลทั้งหมดจะถูกลบเมื่อเซิร์ฟเวอร์รีสตาร์ท',
        p5: 'สิทธิของคุณตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA): ดู แก้ไข หรือลบป้ายทะเบียนได้ทุกเมื่อ และถอนความยินยอมได้ในแอป',
        p6: 'หากไม้กั้นอ่านป้ายทะเบียนไม่ได้ ให้ใช้เครื่องจ่ายบัตรตามปกติ ระบบนี้จะไม่ทำให้คุณเข้าห้างไม่ได้',
        acceptTerms: 'ฉันได้อ่านและยอมรับข้อกำหนดและข้อตกลง',
        acceptPdpa: 'ฉันยินยอมให้เก็บและใช้ข้อมูลป้ายทะเบียนรถตามที่ระบุข้างต้น (PDPA)',
        accept: 'ยอมรับและดำเนินการต่อ', decline: 'ไว้ทีหลัง',
      },
      plates: {
        title: 'ป้ายทะเบียนของฉัน', manage: 'จัดการป้ายทะเบียนและความยินยอม',
        intro: 'เมื่อไม้กั้นของห้างที่ร่วมโครงการอ่านป้ายเหล่านี้ได้ ไม้กั้นจะเปิดและบัตรจอดรถจะแสดงในหน้าจอดและจ่าย',
        number: 'หมายเลขทะเบียน เช่น 1กก 1234', province: 'จังหวัด เช่น กรุงเทพมหานคร', add: 'เพิ่มป้ายทะเบียน',
        carModel: 'รุ่นรถ (ไม่บังคับ) เช่น Honda City', carColor: 'สีรถ (ไม่บังคับ)',
        invalid: 'ตรวจสอบป้ายทะเบียน: หมายเลขแบบ "1กก 1234" หรือ "กข 123" และจังหวัดเป็นภาษาไทย',
        none: 'ยังไม่มีป้ายทะเบียน', delete: 'ลบ', deleteConfirm: 'ลบป้ายทะเบียน {{plate}} ใช่ไหม บัตรจอดรถของป้ายนี้จะถูกลบด้วย',
        withdraw: 'ถอนความยินยอมและลบป้ายทะเบียนทั้งหมด',
        withdrawConfirm: 'ป้ายทะเบียนและบัตรจอดรถทั้งหมดจะถูกลบ และปิดการเข้าออกไม่ต้องใช้บัตร',
        acceptedOn: 'ยอมรับข้อกำหนดเมื่อ {{date}}', cancel: 'ยกเลิก', confirm: 'ลบ',
      },
      tickets: { fee: 'ค่าจอด {{fee}} ฿', running: 'ตอนนี้ {{fee}} ฿', validated: 'ประทับตราซื้อสินค้าแล้ว' },
      gate: {
        title: 'ตัวจำลองไม้กั้น', intro: 'จำลองว่ากล้องที่ไม้กั้นของห้างอ่านป้ายทะเบียนได้',
        mall: 'ห้าง', plate: 'รถ', unregistered: 'รถที่ไม่ได้ลงทะเบียน', direction: 'ไม้กั้น', entry: 'ขาเข้า', exit: 'ขาออก',
        purchase: 'การซื้อสินค้า', noPurchase: 'ไม่ได้ซื้อ', withPurchase: 'ประทับตราซื้อสินค้าแล้ว', send: 'ส่งไปที่ไม้กั้น',
        opened: 'ไม้กั้นเปิด', fallback: 'ใช้เครื่องจ่ายบัตร', reason_unregistered: 'ป้ายนี้ไม่ได้ลงทะเบียน',
        reason_no_open_ticket: 'รถคันนี้ไม่มีบัตรที่ยังเปิดอยู่ที่ห้างนี้', reason_unknown_mall: 'ไม่รู้จักห้างนี้',
        needPlate: 'ลงทะเบียนป้ายทะเบียนก่อน หรือเลือก "รถที่ไม่ได้ลงทะเบียน"',
      },
      errors: {
        generic: 'เกิดข้อผิดพลาด โปรดลองอีกครั้ง', login_required: 'โปรดเข้าสู่ระบบก่อน',
        invalid_email: 'กรอกอีเมลให้ถูกต้อง', weak_password: 'ใช้รหัสผ่านอย่างน้อย 6 ตัวอักษร',
        invalid_name: 'กรอกชื่อของคุณ', email_taken: 'มีบัญชีที่ใช้อีเมลนี้แล้ว โปรดเข้าสู่ระบบ',
        bad_credentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', invalid_amount: 'เติมเงินได้ 20 ถึง 5,000 ฿',
        invalid_car: 'ตรวจสอบรุ่นและสีรถ', invalid_plate: 'ตรวจสอบหมายเลขทะเบียนและจังหวัด',
        not_found: 'ไม่พบข้อมูล อาจถูกลบไปแล้ว', insufficient_balance: 'ยอดเงินไม่พอ โปรดเติมเงินก่อน',
        nothing_due: 'ตอนนี้ไม่มียอดที่ต้องจ่าย', demo_only: 'ใช้ได้เฉพาะโหมดเดโม',
      },
      common: { error: 'เชื่อมต่อเซิร์ฟเวอร์ที่จอดรถไม่ได้', retry: 'ลองใหม่', loading: 'กำลังโหลด…', cancel: 'ยกเลิก', close: 'ปิด', gotIt: 'เข้าใจแล้ว' },
    },
  },
} as const;

export type AppLang = keyof typeof resources;
const KEY = 'app.language';

export function deviceLanguage(): AppLang {
  return getLocales()[0]?.languageCode === 'th' ? 'th' : 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Apply the saved choice once storage answers; the device language is used until then.
AsyncStorage.getItem(KEY).then((saved) => {
  if (saved === 'th' || saved === 'en') i18n.changeLanguage(saved);
}).catch(() => {});

export function setLanguage(lang: AppLang) {
  i18n.changeLanguage(lang);
  AsyncStorage.setItem(KEY, lang).catch(() => {});
}

/** Pick the Thai or English field of a record with name_th / name_en style keys. */
export function pick(obj: object, field: string, lang: string): string {
  const o = obj as Record<string, unknown>;
  return String(o[`${field}_${lang === 'th' ? 'th' : 'en'}`] ?? o[`${field}_en`] ?? '');
}

export default i18n;
