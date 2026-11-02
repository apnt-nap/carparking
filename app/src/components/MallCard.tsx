import { Building2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { MallSummary } from '../lib/api';
import { spots } from '../lib/format';
import { pick } from '../lib/i18n';
import { availabilityColor, elevation, radius, useTheme } from '../lib/theme';
import { Button, Txt } from './ui';

/**
 * UI-43: mall card in the Nearby sheet (inspired by Asia's reference): image tile, name, area,
 * spots in words and colour, price per hour, and "Choose a spot".
 * The tile is a placeholder illustration in the demo (no copyrighted photos).
 */
export function MallCard({ mall, onChoose, onOpen }: { mall: MallSummary; onChoose: () => void; onOpen: () => void }) {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const s = spots(mall, tr);
  const name = pick(mall, 'name', i18n.language);
  return (
    <View style={[styles.card, elevation(t), { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${name}, ${s.text}`} style={styles.top}>
        <View style={[styles.tile, { backgroundColor: t.primary }]}>
          <View style={[styles.tileStripe, { backgroundColor: t.accent }]} />
          <Building2 size={28} color={t.onPrimary} strokeWidth={1.6} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="heading" numberOfLines={1}>{name}</Txt>
          <Txt variant="caption" muted numberOfLines={1}>
            {pick(mall, 'area', i18n.language)}{mall.distance_km !== null ? ` · ${tr('map.kmAway', { km: mall.distance_km })}` : ''}
          </Txt>
          <Txt variant="label" color={availabilityColor(t, s.level)}>{s.text}</Txt>
        </View>
      </Pressable>
      <View style={styles.bottom}>
        <Txt variant="heading">{tr('price.perHour', { rate: mall.fees.hourly_thb })}</Txt>
        <Button primary small label={tr('map.chooseSpot')} onPress={onChoose} disabled={mall.free === 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.m, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
  top: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  tile: { width: 72, height: 72, borderRadius: radius.s, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tileStripe: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 14, opacity: 0.8 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});
