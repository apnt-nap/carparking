import { Accessibility, Baby, Star, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { FloorSummary } from '../lib/api';
import { pick } from '../lib/i18n';
import { radius, TOUCH, useTheme } from '../lib/theme';
import { FONT, Txt } from './ui';

const SPECIAL_ICON = { ev: Zap, accessible: Accessibility, family: Baby } as const;

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
      style={({ pressed }) => [styles.row, { backgroundColor: t.surface, borderColor: floor.best_choice ? t.primary : t.border, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.head}>
        <Txt variant="heading" style={{ flexShrink: 1 }}>{name}</Txt>
        {floor.best_choice && (
          <View style={[styles.badge, { backgroundColor: t.primary }]}>
            <Star size={14} color={t.onPrimary} fill={t.onPrimary} />
            <Txt variant="caption" color={t.onPrimary} style={{ fontFamily: FONT.semibold }}>{tr('mall.best')}</Txt>
          </View>
        )}
      </View>
      <Txt>{tr('mall.freeOf', { free: floor.free, total: floor.total })}</Txt>
      <View style={[styles.bar, { backgroundColor: t.takenFill }]} accessibilityElementsHidden importantForAccessibility="no">
        <View style={{ width: `${Math.round(full * 100)}%`, height: '100%', backgroundColor: t.taken, borderRadius: 4 }} />
      </View>
      {special.length > 0 && (
        <View style={styles.specials}>
          {special.map((k) => {
            const Icon = SPECIAL_ICON[k];
            return (
              <View key={k} style={styles.special}>
                <Icon size={14} color={t.textMuted} />
                <Txt variant="caption" muted>{`${tr(`mall.${k}`)} ${floor.special[k].free}/${floor.special[k].total}`}</Txt>
              </View>
            );
          })}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: TOUCH, padding: 16, borderRadius: radius.m, borderWidth: 1.5, gap: 6 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 2, borderRadius: radius.pill },
  specials: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  special: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
});
