import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { TOUCH, useTheme } from '../lib/theme';

/** Button with a 44 pt minimum touch target (NFR-4). */
export function Button({ label, onPress, primary, selected, disabled, danger, style, accessibilityLabel }: {
  label: string; onPress: () => void; primary?: boolean; selected?: boolean; disabled?: boolean; danger?: boolean;
  style?: StyleProp<ViewStyle>; accessibilityLabel?: string;
}) {
  const t = useTheme();
  const filled = primary || selected;
  const colour = danger ? t.red : t.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: filled ? colour : t.card, borderColor: colour, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Text style={{ color: filled ? t.onAccent : colour, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

/** Tick box with a 44 pt target; the glyph changes as well as the colour (NFR-4). */
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
      <Text style={{ fontSize: 24, color: checked ? t.accent : t.muted }}>{checked ? '☑' : '☐'}</Text>
      <Text style={{ color: t.text, flex: 1 }}>{label}</Text>
    </Pressable>
  );
}

/** Two or more options where one is selected (sort order, language, preference). */
export function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {options.map((o) => (
        <Button key={o.value} label={o.label} selected={o.value === value} onPress={() => onChange(o.value)} style={styles.flex} />
      ))}
    </View>
  );
}

/** Loading and error states for a query. */
export function QueryState({ loading, error, onRetry, children }: {
  loading: boolean; error: unknown; onRetry: () => void; children: ReactNode;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  if (loading) return <ActivityIndicator style={{ margin: 24 }} accessibilityLabel={tr('common.loading')} />;
  if (error) {
    return (
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ color: t.text }}>{tr('common.error')}</Text>
        <Button label={tr('common.retry')} onPress={onRetry} />
      </View>
    );
  }
  return <>{children}</>;
}

export const styles = StyleSheet.create({
  button: { minHeight: TOUCH, minWidth: TOUCH, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  check: { minHeight: TOUCH, flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
});
