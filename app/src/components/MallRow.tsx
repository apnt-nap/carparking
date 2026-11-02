import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MallSummary } from '../lib/api';
import { pick } from '../lib/i18n';
import { availabilityColor, TOUCH, useTheme } from '../lib/theme';

/** A mall in the Nearby list or search results (FR-4, FR-18): name, distance, free spaces. */
export function MallRow({ mall, onPress }: { mall: MallSummary; onPress: () => void }) {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const name = pick(mall, 'name', i18n.language);
  const colour = availabilityColor(t, mall.availability);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${tr('map.markerLabel', { name, free: mall.free, total: mall.total, level: tr(`map.level_${mall.availability}`) })}${mall.distance_km !== null ? `, ${tr('map.kmAway', { km: mall.distance_km })}` : ''}`}
      style={({ pressed }) => [styles.row, { borderColor: t.border, backgroundColor: t.card, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.dot, { backgroundColor: colour }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: t.text }]}>{name}</Text>
        {mall.distance_km !== null && <Text style={{ color: t.muted }}>{tr('map.kmAway', { km: mall.distance_km })}</Text>}
      </View>
      <Text style={[styles.free, { color: colour }]}>{tr('map.free', { count: mall.free })}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: TOUCH + 12, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  name: { fontSize: 16, fontWeight: '600' },
  free: { fontWeight: '700' },
});
