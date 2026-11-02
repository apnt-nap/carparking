import { MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { MallSummary } from '../lib/api';
import { priceText, spots } from '../lib/format';
import { pick } from '../lib/i18n';
import { availabilityColor, elevation, radius, TOUCH, useTheme } from '../lib/theme';
import { Txt } from './ui';

/** UI-5, UI-6: rounded pop-up under the search bar with up to 3 malls (name, distance, free spaces, price). */
export function SearchPopup({ title, malls, onPick, emptyText }: {
  title: string; malls: MallSummary[]; onPick: (m: MallSummary) => void; emptyText: string;
}) {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  return (
    <View style={[styles.card, elevation(t), { backgroundColor: t.surfaceElevated, borderColor: t.border }]} accessibilityRole="list">
      <Txt variant="caption" muted>{title}</Txt>
      {malls.length === 0 && <Txt muted>{emptyText}</Txt>}
      {malls.slice(0, 3).map((m) => {
        const s = spots(m, tr);
        const name = pick(m, 'name', i18n.language);
        return (
          <Pressable
            key={m.id}
            onPress={() => onPick(m)}
            accessibilityRole="button"
            accessibilityLabel={[name, m.distance_km !== null ? tr('map.kmAway', { km: m.distance_km }) : '', s.text].filter(Boolean).join(', ')}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
          >
            <View style={[styles.icon, { backgroundColor: t.accentTint }]}><MapPin size={18} color={t.accentText} /></View>
            <View style={{ flex: 1 }}>
              <Txt variant="label" numberOfLines={1}>{name}</Txt>
              <Txt variant="caption" muted numberOfLines={1}>{priceText(m.fees, tr)}</Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {m.distance_km !== null && <Txt variant="caption" muted>{tr('map.kmAway', { km: m.distance_km })}</Txt>}
              <Txt variant="caption" color={availabilityColor(t, s.level)}>{s.text}</Txt>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.m, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 4 },
  row: { minHeight: TOUCH + 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
