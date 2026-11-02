import { CarFront } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { Plate } from '../lib/api';
import { useTheme } from '../lib/theme';
import { Chip, Txt } from './ui';

/** UI-18: read-only list of registered plates, marking the one parked now. Adding plates is only in Account (UI-24). */
export function PlateList({ plates, parkedPlateIds }: { plates: Plate[]; parkedPlateIds: Set<string> }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  if (plates.length === 0) return <Txt muted>{tr('plates.none')}</Txt>;
  return (
    <View style={{ gap: 8 }}>
      {plates.map((p) => (
        <View key={p.id} style={[styles.row, { borderColor: t.border }]}>
          <CarFront size={22} color={p.car_color ?? t.textMuted} strokeWidth={1.8} />
          <View style={{ flex: 1 }}>
            <Txt variant="label">{p.number} · {p.province}</Txt>
            {p.car_model && <Txt variant="caption" muted>{p.car_model}</Txt>}
          </View>
          {parkedPlateIds.has(p.id) && <Chip label={tr('parking.parked')} color={t.success} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12 },
});
