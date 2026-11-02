import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

/** FR-19: every UI string lives here. Mall, floor and zone names come from the data in both languages (FR-20). */
export const resources = {
  en: {
    translation: {
      tabs: { map: 'Map', search: 'Search', settings: 'Settings' },
      map: {
        mapView: 'Map', listView: 'Nearby', openMall: 'Open mall', free: '{{count}} free',
        kmAway: '{{km}} km away', locating: 'Finding your location…', noPermission: 'Location is off. Showing central Bangkok.',
        markerLabel: '{{name}}, {{free}} of {{total}} spaces free, {{level}}',
        level_green: 'plenty of space', level_amber: 'filling up', level_red: 'almost full', level_grey: 'no data',
      },
      mall: {
        floors: 'Parking floors', sortFree: 'Most free', sortOrder: 'Floor order', best: 'Best choice',
        freeOf: '{{free}} / {{total}} free', fees: 'Parking fees', hours: 'Opening hours {{open}}–{{close}}',
        ev: 'EV', accessible: 'Accessible', family: 'Family',
        floorLabel: '{{name}}, {{free}} of {{total}} free',
      },
      floor: {
        nearRamp: 'Near the ramp', nearLift: 'Near the mall entrance', suggested: 'Suggested bay', chosen: 'Your chosen bay',
        noFree: 'No free bays on this floor right now.', bay: 'Bay {{id}}', distance: '{{m}} m drive',
        parkedHere: 'I parked here', parkedSaved: 'Saved. You parked at {{zone}}.', tapHint: 'Tap any green bay to go there instead. Pinch to zoom.',
        free: 'Free', taken: 'Taken', route: 'Route', lift: 'Lifts to mall', ramp: 'Ramp',
        bayLabel: 'Bay {{id}}, {{zone}}, {{status}}{{type}}', live: 'Live', offline: 'Reconnecting…',
      },
      bayType: { ev: 'EV charging', accessible: 'Accessible', family: 'Family', normal: '' },
      search: {
        placeholder: 'Search malls, e.g. Paragon or พารากอน', mic: 'Search by voice', stop: 'Stop listening',
        listening: 'Listening…', noResults: 'No malls found.', voiceLang: 'Voice language', voiceUnavailable:
          'Voice search needs a development build (it does not work in Expo Go).', voiceError: 'Could not hear that. Try again.',
      },
      settings: {
        language: 'Language', parked: 'Where I parked', none: 'Nothing saved yet.', clear: 'Clear', open: 'Show on floor plan',
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
        title: 'My licence plates', intro: 'When a participating mall\'s gate reads one of these plates, it opens and your e-ticket appears in the app.',
        number: 'Plate number, e.g. 1กก 1234', province: 'Province, e.g. กรุงเทพมหานคร', add: 'Add plate',
        invalid: 'Check the plate: number like "1กก 1234" or "กข 123", and the province written in Thai.',
        none: 'No plates yet.', delete: 'Delete', deleteConfirm: 'Delete plate {{plate}}? Its tickets are deleted too.',
        tickets: 'My e-tickets', withdraw: 'Withdraw consent and delete all my plates',
        withdrawConfirm: 'This deletes all your plates and tickets and turns ticketless entry off.',
        acceptedOn: 'Terms accepted on {{date}}', cancel: 'Cancel', confirm: 'Delete',
        hiddenHint: 'Long-press the title to open the gate simulator.',
      },
      tickets: {
        title: 'My e-tickets', none: 'No tickets yet. Drive into a participating mall, or use the gate simulator.',
        open: 'Parked now', closed: 'Finished', entered: 'Entered {{time}}', exited: 'Left {{time}}',
        running: '{{fee}} THB so far', fee: 'Fee {{fee}} THB', validated: 'Purchase validated', plate: 'Plate {{plate}}',
        openHint: 'The gate reads your plate again when you leave and works out the fee.',
      },
      gate: {
        title: 'Simulate gate', intro: 'Prototype tool: pretend a mall\'s camera has read a plate at the gate.',
        mall: 'Mall', plate: 'Car', unregistered: 'Unregistered car', direction: 'Gate', entry: 'Entry', exit: 'Exit',
        purchase: 'Purchase', noPurchase: 'No purchase', withPurchase: 'Purchase validated', send: 'Send to gate',
        opened: 'Gate opens', fallback: 'Use the ticket machine', reason_unregistered: 'This plate isn\'t registered.',
        reason_no_open_ticket: 'No open ticket for this car at this mall.', reason_unknown_mall: 'Unknown mall.',
        needPlate: 'Register a plate first, or choose "Unregistered car".',
      },
      common: { error: 'Could not reach the parking server.', retry: 'Retry', loading: 'Loading…' },
    },
  },
  th: {
    translation: {
      tabs: { map: 'แผนที่', search: 'ค้นหา', settings: 'ตั้งค่า' },
      map: {
        mapView: 'แผนที่', listView: 'ใกล้ฉัน', openMall: 'ดูห้าง', free: 'ว่าง {{count}} ช่อง',
        kmAway: 'ห่าง {{km}} กม.', locating: 'กำลังหาตำแหน่งของคุณ…', noPermission: 'ไม่ได้เปิดตำแหน่ง แสดงใจกลางกรุงเทพฯ',
        markerLabel: '{{name}} ว่าง {{free}} จาก {{total}} ช่อง {{level}}',
        level_green: 'ที่ว่างเยอะ', level_amber: 'ใกล้เต็ม', level_red: 'เกือบเต็ม', level_grey: 'ไม่มีข้อมูล',
      },
      mall: {
        floors: 'ชั้นจอดรถ', sortFree: 'ว่างมากสุด', sortOrder: 'เรียงตามชั้น', best: 'แนะนำ',
        freeOf: 'ว่าง {{free}} / {{total}}', fees: 'ค่าจอดรถ', hours: 'เวลาเปิด {{open}}–{{close}}',
        ev: 'EV', accessible: 'ผู้พิการ', family: 'ครอบครัว',
        floorLabel: '{{name}} ว่าง {{free}} จาก {{total}} ช่อง',
      },
      floor: {
        nearRamp: 'ใกล้ทางขึ้น', nearLift: 'ใกล้ทางเข้าห้าง', suggested: 'ช่องที่แนะนำ', chosen: 'ช่องที่คุณเลือก',
        noFree: 'ชั้นนี้ไม่มีช่องว่างในขณะนี้', bay: 'ช่อง {{id}}', distance: 'ขับ {{m}} ม.',
        parkedHere: 'ฉันจอดที่นี่', parkedSaved: 'บันทึกแล้ว คุณจอดที่ {{zone}}', tapHint: 'แตะช่องสีเขียวเพื่อเปลี่ยนเส้นทาง ใช้สองนิ้วเพื่อซูม',
        free: 'ว่าง', taken: 'ไม่ว่าง', route: 'เส้นทาง', lift: 'ลิฟต์ไปห้าง', ramp: 'ทางลาด',
        bayLabel: 'ช่อง {{id}} {{zone}} {{status}}{{type}}', live: 'สด', offline: 'กำลังเชื่อมต่อใหม่…',
      },
      bayType: { ev: 'ชาร์จรถไฟฟ้า', accessible: 'ผู้พิการ', family: 'ครอบครัว', normal: '' },
      search: {
        placeholder: 'ค้นหาห้าง เช่น พารากอน หรือ Paragon', mic: 'ค้นหาด้วยเสียง', stop: 'หยุดฟัง',
        listening: 'กำลังฟัง…', noResults: 'ไม่พบห้าง', voiceLang: 'ภาษาเสียง', voiceUnavailable:
          'การค้นหาด้วยเสียงต้องใช้ development build (ใช้ใน Expo Go ไม่ได้)', voiceError: 'ฟังไม่ชัด ลองอีกครั้ง',
      },
      settings: {
        language: 'ภาษา', parked: 'ที่ที่ฉันจอด', none: 'ยังไม่ได้บันทึก', clear: 'ล้าง', open: 'ดูบนแผนผังชั้น',
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
        title: 'ป้ายทะเบียนของฉัน', intro: 'เมื่อไม้กั้นของห้างที่ร่วมโครงการอ่านป้ายเหล่านี้ได้ ไม้กั้นจะเปิดและบัตรจอดรถจะแสดงในแอป',
        number: 'หมายเลขทะเบียน เช่น 1กก 1234', province: 'จังหวัด เช่น กรุงเทพมหานคร', add: 'เพิ่มป้ายทะเบียน',
        invalid: 'ตรวจสอบป้ายทะเบียน: หมายเลขแบบ "1กก 1234" หรือ "กข 123" และจังหวัดเป็นภาษาไทย',
        none: 'ยังไม่มีป้ายทะเบียน', delete: 'ลบ', deleteConfirm: 'ลบป้ายทะเบียน {{plate}} ใช่ไหม บัตรจอดรถของป้ายนี้จะถูกลบด้วย',
        tickets: 'บัตรจอดรถของฉัน', withdraw: 'ถอนความยินยอมและลบป้ายทะเบียนทั้งหมด',
        withdrawConfirm: 'ป้ายทะเบียนและบัตรจอดรถทั้งหมดจะถูกลบ และปิดการเข้าออกไม่ต้องใช้บัตร',
        acceptedOn: 'ยอมรับข้อกำหนดเมื่อ {{date}}', cancel: 'ยกเลิก', confirm: 'ลบ',
        hiddenHint: 'กดค้างที่หัวข้อเพื่อเปิดตัวจำลองไม้กั้น',
      },
      tickets: {
        title: 'บัตรจอดรถของฉัน', none: 'ยังไม่มีบัตร ขับเข้าห้างที่ร่วมโครงการ หรือใช้ตัวจำลองไม้กั้น',
        open: 'กำลังจอด', closed: 'เสร็จสิ้น', entered: 'เข้า {{time}}', exited: 'ออก {{time}}',
        running: 'ตอนนี้ {{fee}} บาท', fee: 'ค่าจอด {{fee}} บาท', validated: 'ประทับตราซื้อสินค้าแล้ว', plate: 'ทะเบียน {{plate}}',
        openHint: 'ไม้กั้นจะอ่านป้ายทะเบียนอีกครั้งตอนออก และคำนวณค่าจอดให้',
      },
      gate: {
        title: 'จำลองไม้กั้น', intro: 'เครื่องมือต้นแบบ: จำลองว่ากล้องที่ไม้กั้นของห้างอ่านป้ายทะเบียนได้',
        mall: 'ห้าง', plate: 'รถ', unregistered: 'รถที่ไม่ได้ลงทะเบียน', direction: 'ไม้กั้น', entry: 'ขาเข้า', exit: 'ขาออก',
        purchase: 'การซื้อสินค้า', noPurchase: 'ไม่ได้ซื้อ', withPurchase: 'ประทับตราซื้อสินค้าแล้ว', send: 'ส่งไปที่ไม้กั้น',
        opened: 'ไม้กั้นเปิด', fallback: 'ใช้เครื่องจ่ายบัตร', reason_unregistered: 'ป้ายนี้ไม่ได้ลงทะเบียน',
        reason_no_open_ticket: 'รถคันนี้ไม่มีบัตรที่ยังเปิดอยู่ที่ห้างนี้', reason_unknown_mall: 'ไม่รู้จักห้างนี้',
        needPlate: 'ลงทะเบียนป้ายทะเบียนก่อน หรือเลือก "รถที่ไม่ได้ลงทะเบียน"',
      },
      common: { error: 'เชื่อมต่อเซิร์ฟเวอร์ที่จอดรถไม่ได้', retry: 'ลองใหม่', loading: 'กำลังโหลด…' },
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
