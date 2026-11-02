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
      settings: { language: 'Language', parked: 'Where I parked', none: 'Nothing saved yet.', clear: 'Clear', open: 'Show on floor plan' },
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
      settings: { language: 'ภาษา', parked: 'ที่ที่ฉันจอด', none: 'ยังไม่ได้บันทึก', clear: 'ล้าง', open: 'ดูบนแผนผังชั้น' },
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
