import { Check, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator, Modal, Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { elevation, radius, space, TOUCH, useTheme } from '../lib/theme';

/** UI-32: IBM Plex Sans Thai, loaded in the root layout. Falls back to the system font until loaded. */
export const FONT = {
  regular: 'IBMPlexSansThai_400Regular',
  medium: 'IBMPlexSansThai_500Medium',
  semibold: 'IBMPlexSansThai_600SemiBold',
  bold: 'IBMPlexSansThai_700Bold',
} as const;

const VARIANTS: Record<string, TextStyle> = {
  title: { fontSize: 26, lineHeight: 36, fontFamily: FONT.bold },
  heading: { fontSize: 18, lineHeight: 28, fontFamily: FONT.semibold },
  body: { fontSize: 16, lineHeight: 24, fontFamily: FONT.regular },
  label: { fontSize: 15, lineHeight: 22, fontFamily: FONT.medium },
  caption: { fontSize: 13, lineHeight: 20, fontFamily: FONT.regular },
  // Thai tone marks need generous line height; tabular digits keep the timer steady (UI-35)
  timer: { fontSize: 44, lineHeight: 56, fontFamily: FONT.semibold, fontVariant: ['tabular-nums'] },
  big: { fontSize: 30, lineHeight: 40, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
};

/** Text in the app font and type scale (UI-32). */
export function Txt({ variant = 'body', color, muted, style, ...rest }: TextProps & {
  variant?: keyof typeof VARIANTS; color?: string; muted?: boolean;
}) {
  const t = useTheme();
  return <Text {...rest} style={[VARIANTS[variant], { color: color ?? (muted ? t.textMuted : t.text) }, style]} />;
}

type ButtonKind = 'primary' | 'secondary' | 'danger' | 'ghost';

/** Pill button, 48 pt high (A6c, NFR-8). */
export function Button({ label, onPress, kind = 'secondary', primary, selected, disabled, danger, icon: Icon, style, accessibilityLabel, small }: {
  label: string; onPress: () => void; kind?: ButtonKind; primary?: boolean; selected?: boolean; disabled?: boolean;
  danger?: boolean; icon?: LucideIcon; style?: StyleProp<ViewStyle>; accessibilityLabel?: string; small?: boolean;
}) {
  const t = useTheme();
  const k: ButtonKind = danger ? 'danger' : primary || selected ? 'primary' : kind;
  const filled = k === 'primary';
  const fg = filled ? t.onPrimary : k === 'danger' ? t.danger : k === 'ghost' ? t.accentText : t.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.button,
        small && styles.small,
        {
          backgroundColor: filled ? t.primary : k === 'ghost' ? 'transparent' : t.background,
          borderColor: filled ? t.primary : k === 'danger' ? t.danger : k === 'ghost' ? 'transparent' : t.border,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {Icon && <Icon size={18} color={fg} strokeWidth={2} />}
      <Txt variant="label" color={fg} numberOfLines={1}>{label}</Txt>
    </Pressable>
  );
}

/** Round floating icon button (UI-8, UI-9). */
export function Fab({ icon: Icon, onPress, label, active }: { icon: LucideIcon; onPress: () => void; label: string; active?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.fab,
        elevation(t),
        { backgroundColor: active ? t.primary : t.surfaceElevated, borderColor: t.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Icon size={22} color={active ? t.onPrimary : t.text} strokeWidth={1.8} />
    </Pressable>
  );
}

/** Options where one is selected (sort order, language, theme…). */
export function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: t.surface }]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            style={[styles.segmentItem, on && [{ backgroundColor: t.surfaceElevated }, elevation(t)]]}
          >
            <Txt variant="label" color={on ? t.text : t.textMuted} numberOfLines={1}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Rounded card surface. */
export function Card({ children, style, raised }: { children: ReactNode; style?: StyleProp<ViewStyle>; raised?: boolean }) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: raised ? t.surfaceElevated : t.surface }, raised && elevation(t), style]}>
      {children}
    </View>
  );
}

/** Small status chip; always text plus colour (UI-11, NFR-4). */
export function Chip({ label, color, tint }: { label: string; color: string; tint?: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: tint ?? 'transparent', borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Txt variant="caption" color={color} style={{ fontFamily: FONT.semibold }}>{label}</Txt>
    </View>
  );
}

/** Tick box with a 44 pt target; the mark changes as well as the colour (NFR-4). */
export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.check}
    >
      <View style={[styles.box, { borderColor: checked ? t.primary : t.border, backgroundColor: checked ? t.primary : 'transparent' }]}>
        {checked && <Check size={16} color={t.onPrimary} strokeWidth={3} />}
      </View>
      <Txt style={{ flex: 1 }}>{label}</Txt>
    </Pressable>
  );
}

/** Bottom sheet with rounded top corners. Closes on backdrop tap or back (UI-7, NFR-7). Slides unless reduced motion (UI-34). */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const reduced = useReducedMotion();
  return (
    <Modal visible={visible} transparent animationType={reduced ? 'none' : 'slide'} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={tr('common.close')} />
      <View style={[styles.sheet, { backgroundColor: t.surfaceElevated }]}>
        <View style={[styles.grabber, { backgroundColor: t.border }]} />
        {title && <Txt variant="heading" accessibilityRole="header" style={{ marginBottom: space.s }}>{title}</Txt>}
        {children}
      </View>
    </Modal>
  );
}

/** Loading and error states for a query. */
export function QueryState({ loading, error, onRetry, children }: {
  loading: boolean; error: unknown; onRetry: () => void; children: ReactNode;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  if (loading) return <ActivityIndicator color={t.accentText} style={{ margin: 24 }} accessibilityLabel={tr('common.loading')} />;
  if (error) {
    return (
      <View style={{ padding: 16, gap: 12 }}>
        <Txt>{tr('common.error')}</Txt>
        <Button label={tr('common.retry')} onPress={onRetry} />
      </View>
    );
  }
  return <>{children}</>;
}

/** A row in a settings-style list. */
export function Row({ icon: Icon, label, value, onPress }: { icon?: LucideIcon; label: string; value?: string; onPress?: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} style={styles.row}>
      {Icon && <Icon size={20} color={t.textMuted} strokeWidth={1.8} />}
      <Txt style={{ flex: 1 }}>{label}</Txt>
      {value !== undefined && <Txt muted>{value}</Txt>}
    </Pressable>
  );
}

/** Ticks forward every second while mounted (live timers, UI-15, UI-35). */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export const styles = StyleSheet.create({
  button: {
    minHeight: 48, minWidth: TOUCH, paddingHorizontal: 20, borderRadius: radius.pill, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
  },
  small: { minHeight: TOUCH, paddingHorizontal: 14 },
  fab: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  segment: { flexDirection: 'row', borderRadius: radius.pill, padding: 4, gap: 4 },
  segmentItem: { flex: 1, minHeight: TOUCH - 4, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  card: { borderRadius: radius.m, padding: space.l, gap: space.s },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  check: { minHeight: TOUCH, flexDirection: 'row', alignItems: 'center', gap: 12 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(5,12,24,0.45)' },
  sheet: { borderTopLeftRadius: radius.l, borderTopRightRadius: radius.l, padding: space.l, paddingBottom: 32, gap: space.m, maxHeight: '85%' },
  grabber: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 4 },
  row: { minHeight: TOUCH, flexDirection: 'row', alignItems: 'center', gap: space.m },
  flex: { flex: 1 },
});
