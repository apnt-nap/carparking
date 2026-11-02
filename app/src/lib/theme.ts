import { useColorScheme } from 'react-native';

/** NFR-4: light and dark palettes. Bay and marker colours always come with a second signal (icon, pattern or text). */
const light = {
  bg: '#FFFFFF', card: '#F4F5F7', text: '#111418', muted: '#5B6470', border: '#D5D9DE', accent: '#1565C0',
  free: '#2E7D32', freeFill: '#C8E6C9', taken: '#9AA0A6', takenFill: '#E3E5E8', amber: '#B26A00', red: '#C62828', grey: '#757575',
  lane: '#B0B7BF', route: '#1565C0', lobby: '#FFE0B2', ramp: '#D1C4E9', onAccent: '#FFFFFF',
};
const dark: typeof light = {
  bg: '#0F1115', card: '#1A1D23', text: '#ECEFF3', muted: '#9AA3AE', border: '#2C3139', accent: '#64B5F6',
  free: '#81C784', freeFill: '#1F4023', taken: '#7A808A', takenFill: '#2A2E35', amber: '#FFB74D', red: '#EF5350', grey: '#9E9E9E',
  lane: '#4A525C', route: '#64B5F6', lobby: '#5D4325', ramp: '#3E3558', onAccent: '#0F1115',
};

export type Theme = typeof light;
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? dark : light);

export const availabilityColor = (t: Theme, a: string) =>
  a === 'green' ? t.free : a === 'amber' ? t.amber : a === 'red' ? t.red : t.grey;

/** NFR-4: minimum touch target in points. */
export const TOUCH = 44;
