import { useColorScheme, type ViewStyle } from 'react-native';
import { storedValue } from './stored';

/**
 * UI-28 / A6c: one set of colour tokens for light and dark (UPDATE_LAYOUT_V2.md).
 * Contrast pairs are checked in test/theme.test.ts (UI-30, WCAG AA).
 * The short names at the end (bg, card, muted, free…) are used by the floor plan and older components.
 */
const light = {
  dark: false,
  background: '#FFFFFF',
  surface: '#F3F6FA',
  surfaceElevated: '#FFFFFF',
  text: '#0B1B33',
  textMuted: '#4A5B73',
  border: '#D6DEE8',
  primary: '#0B2A4A',
  onPrimary: '#FFFFFF',
  accent: '#4DA3FF', // fill only in light mode (2.6:1 on white)
  accentText: '#1E64C8',
  accentTint: '#E6F1FF',
  success: '#1B7F3B',
  warning: '#9A5B00',
  danger: '#C62828',
  neutral: '#5E6B7E',
  // floor plan and legacy names
  bg: '#FFFFFF',
  card: '#F3F6FA',
  muted: '#4A5B73',
  free: '#1B7F3B',
  freeFill: '#DDF3E4',
  taken: '#8A96A8',
  takenFill: '#E9EDF2',
  amber: '#9A5B00',
  red: '#C62828',
  grey: '#5E6B7E',
  lane: '#C9D3E0',
  route: '#1E64C8',
  lobby: '#E6F1FF',
  ramp: '#DCE6F3',
  onAccent: '#FFFFFF',
};

const dark: typeof light = {
  dark: true,
  background: '#0A1424',
  surface: '#12203A',
  surfaceElevated: '#1A2B4A',
  text: '#EAF1FB',
  textMuted: '#9FB0C8',
  border: '#26385A',
  primary: '#4DA3FF',
  onPrimary: '#0A1424',
  accent: '#7CC0FF',
  accentText: '#7CC0FF',
  accentTint: '#173257',
  success: '#5FD38A',
  warning: '#FFC266',
  danger: '#FF7A7A',
  neutral: '#9FB0C8',
  bg: '#0A1424',
  card: '#12203A',
  muted: '#9FB0C8',
  free: '#5FD38A',
  freeFill: '#173A27',
  taken: '#6F7F99',
  takenFill: '#1B2840',
  amber: '#FFC266',
  red: '#FF7A7A',
  grey: '#9FB0C8',
  lane: '#2C3E60',
  route: '#7CC0FF',
  lobby: '#173257',
  ramp: '#22365A',
  onAccent: '#0A1424',
};

export const themes = { light, dark };
export type Theme = typeof light;

/** UI-27: System (default), Light or Dark, saved on the phone and applied straight away. */
export type ThemePref = 'system' | 'light' | 'dark';
export const themePrefStore = storedValue<ThemePref>('app.theme');

export function resolveTheme(pref: ThemePref, system: 'light' | 'dark' | null | undefined): Theme {
  const mode = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;
  return themes[mode];
}

export function useThemePref(): ThemePref {
  return themePrefStore.useValue() ?? 'system';
}

export function useTheme(): Theme {
  const system = useColorScheme();
  return resolveTheme(useThemePref(), system === 'dark' ? 'dark' : 'light');
}

export const availabilityColor = (t: Theme, a: string) =>
  a === 'green' ? t.success : a === 'amber' ? t.warning : a === 'red' ? t.danger : t.neutral;

/** NFR-8: minimum touch target in points. */
export const TOUCH = 44;

/** UI-31: spacing and corner scales. */
export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24 } as const;
export const radius = { s: 12, m: 16, l: 24, pill: 999 } as const;

/** Soft shadow in light mode; dark mode uses lighter surfaces instead (UI-31). */
export function elevation(t: Theme): ViewStyle {
  if (t.dark) return {};
  return { shadowColor: '#0B2A4A', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4 };
}

/** UI-29: Google Maps dark style for Android; iOS uses userInterfaceStyle="dark". */
export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#12203a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9fb0c8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a1424' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2b4a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#26385a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1424' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#173257' }] },
];
