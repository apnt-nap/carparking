import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FloorSummary } from '../lib/api';
import { pick } from '../lib/i18n';
import { TOUCH, useTheme } from '../lib/theme';

/** FR-5 to FR-7: one parking floor with free/total, a fullness bar, "Best choice" and special-bay counts. */
export function FloorRow({ floor, onPress }: { floor: FloorSummary; onPress: () => void }) {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const name = `${floor.level} · ${pick(floor, 'name', i18n.language)}`;
  const full = floor.total ? 1 - floor.free / floor.total : 1;
  const special = (['ev', 'accessible', 'family'] as const).filter((k) => floor.special[k].total > 0);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${tr('mall.floorLabel', { name, free: floor.free, total: floor.total })}${floor.best_choice ? `, ${tr('mall.best')}` : ''}`}
      style={({ pressed }) => [styles.row, { backgroundColor: t.card, borderColor: floor.best_choice ? t.free : t.border, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.head}>
        <Text style={[styles.name, { color: t.text }]}>{name}</Text>
        {floor.best_choice && (
          <Text style={[styles.badge, { backgroundColor: t.free, color: t.bg }]}>★ {tr('mall.best')}</Text>
        )}
      </View>
      <Text style={{ color: t.text }}>{tr('mall.freeOf', { free: floor.free, total: floor.total })}</Text>
      <View style={[styles.bar, { backgroundColor: t.takenFill }]} accessibilityElementsHidden importantForAccessibility="no">
        <View style={{ width: `${Math.round(full * 100)}%`, height: '100%', backgroundColor: t.taken, borderRadius: 4 }} />
      </View>
      {special.length > 0 && (
        <Text style={{ color: t.muted }}>
          {special.map((k) => `${k === 'ev' ? '⚡' : k === 'accessible' ? '♿' : '👪'} ${tr(`mall.${k}`)} ${floor.special[k].free}/${floor.special[k].total}`).join('   ')}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: TOUCH, padding: 14, borderRadius: 12, borderWidth: 1.5, gap: 6 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontSize: 17, fontWeight: '600', flexShrink: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden', fontWeight: '700' },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
});
