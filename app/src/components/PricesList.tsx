import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { MallSummary } from '../lib/api';
import { freeTime } from '../lib/format';
import { pick } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import { Segmented, Txt } from './ui';

/** UI-42: all malls' prices side by side, sortable by price or distance. */
export function PricesList({ malls }: { malls: MallSummary[] }) {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const [sort, setSort] = useState<'price' | 'distance'>('price');
  const sorted = [...malls].sort((a, b) =>
    sort === 'price'
      ? a.fees.hourly_thb - b.fees.hourly_thb || b.fees.free_minutes_with_purchase - a.fees.free_minutes_with_purchase
      : (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
  return (
    <View style={{ gap: 12 }}>
      <Segmented
        options={[{ value: 'price', label: tr('prices.byPrice') }, { value: 'distance', label: tr('prices.byDistance') }]}
        value={sort}
        onChange={setSort}
      />
      {sorted.map((m) => (
        <View key={m.id} style={[styles.row, { borderBottomColor: t.border }]} accessible
          accessibilityLabel={`${pick(m, 'name', i18n.language)}, ${tr('price.perHour', { rate: m.fees.hourly_thb })}`}>
          <View style={{ flex: 1 }}>
            <Txt variant="label">{pick(m, 'name', i18n.language)}</Txt>
            <Txt variant="caption" muted>
              {tr('prices.free', { time: freeTime(m.fees.free_minutes, tr) })} · {tr('prices.freeWithPurchase', { time: freeTime(m.fees.free_minutes_with_purchase, tr) })}
            </Txt>
            <Txt variant="caption" muted>{tr('mall.hours', m.hours)}</Txt>
          </View>
          <Txt variant="heading">{tr('price.perHour', { rate: m.fees.hourly_thb })}</Txt>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
});
