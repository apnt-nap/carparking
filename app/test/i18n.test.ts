import { pick, resources } from '../src/lib/i18n';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

describe('i18n (FR-19, FR-20)', () => {
  it('Thai and English have exactly the same keys', () => {
    expect(keys(resources.th).sort()).toEqual(keys(resources.en).sort());
  });

  it('no empty translations except the normal bay type', () => {
    for (const lang of ['th', 'en'] as const) {
      for (const k of keys(resources[lang])) {
        if (k === 'translation.bayType.normal') continue;
        const value = k.split('.').reduce<any>((o, p) => o[p], resources[lang]);
        expect(value).not.toBe('');
      }
    }
  });

  it('pick chooses the field for the language, falling back to English', () => {
    const mall = { name_th: 'สยามพารากอน', name_en: 'Siam Paragon' };
    expect(pick(mall, 'name', 'th')).toBe('สยามพารากอน');
    expect(pick(mall, 'name', 'en')).toBe('Siam Paragon');
    expect(pick({ name_en: 'Only English' }, 'name', 'th')).toBe('Only English');
  });
});
