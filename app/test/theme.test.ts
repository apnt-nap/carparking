import { resolveTheme, themes, type Theme } from '../src/lib/theme';

// WCAG 2.x relative luminance and contrast ratio
function lum(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// Text-on-background pairs used by the UI (A6c). Accent in light mode is a fill only, so it is not listed as text.
const pairs: [keyof Theme, keyof Theme][] = [
  ['text', 'background'], ['text', 'surface'], ['text', 'surfaceElevated'], ['textMuted', 'background'], ['textMuted', 'surface'],
  ['onPrimary', 'primary'], ['accentText', 'background'], ['accentText', 'surface'], ['text', 'accentTint'],
  ['success', 'background'], ['warning', 'background'], ['danger', 'background'],
  ['success', 'surface'], ['warning', 'surface'], ['danger', 'surface'],
];

describe('theme (UI-27 to UI-30)', () => {
  it.each(['light', 'dark'] as const)('%s theme: every text colour meets WCAG AA (4.5:1)', (mode) => {
    const t = themes[mode];
    for (const [fg, bg] of pairs) {
      expect({ pair: `${fg} on ${bg}`, ratio: Number(ratio(t[fg] as string, t[bg] as string).toFixed(2)) })
        .toEqual({ pair: `${fg} on ${bg}`, ratio: expect.any(Number) });
      expect(ratio(t[fg] as string, t[bg] as string)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('uses the confirmed palette: navy primary, sky accent, white background', () => {
    expect(themes.light).toMatchObject({ primary: '#0B2A4A', accent: '#4DA3FF', background: '#FFFFFF' });
    expect(themes.dark).toMatchObject({ background: '#0A1424', primary: '#4DA3FF' });
  });

  it('System follows the phone; Light and Dark override it', () => {
    expect(resolveTheme('system', 'dark').dark).toBe(true);
    expect(resolveTheme('system', 'light').dark).toBe(false);
    expect(resolveTheme('system', null).dark).toBe(false);
    expect(resolveTheme('light', 'dark').dark).toBe(false);
    expect(resolveTheme('dark', 'light').dark).toBe(true);
  });
});
