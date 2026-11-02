// Plate rules shared by the server and the app's on-device demo mode, so this file must not import Node modules.

// Thai private-car plates: optional leading digit, 1–2 Thai consonants, 1–4 digits (e.g. "1กก 1234", "กข 123").
const PLATE_RE = /^[0-9]?[ก-ฮ]{1,2}[0-9]{1,4}$/u;
// shortcut: checks the province is Thai text, not that it is one of the 77 provinces; add the list before real use.
const PROVINCE_RE = /^[฀-๿ ]{2,40}$/u;

export function plateKey(number: string, province: string): string {
  return `${number.replace(/\s+/g, '')}|${province.trim()}`;
}

export function isValidPlate(number: string): boolean {
  return PLATE_RE.test(number.replace(/\s+/g, ''));
}

export function isValidProvince(province: string): boolean {
  return PROVINCE_RE.test(province.trim());
}
