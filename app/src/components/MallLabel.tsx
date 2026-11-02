import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MallSummary } from '../lib/api';
import { pick } from '../lib/i18n';
import { availabilityColor, elevation, radius, useTheme } from '../lib/theme';
import { FONT, Txt } from './ui';

export type LabelSize = 'full' | 'name' | 'dot';

/**
 * UI-10 to UI-12: a mall marker as a rounded tag: bold name, smaller free count underneath, a pointer at the bottom.
 * The availability colour is the border; the count is always written, so colour is never the only signal.
 */
export function MallLabel({ mall, size = 'full' }: { mall: MallSummary; size?: LabelSize }) {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const colour = availabilityColor(t, mall.availability);
  if (size === 'dot') return <View style={[styles.dot, { backgroundColor: colour, borderColor: t.surfaceElevated }]} />;
  return (
    <View style={styles.wrap}>
      <View style={[styles.tag, elevation(t), { backgroundColor: t.surfaceElevated, borderColor: colour }]}>
        <Txt variant="label" style={{ fontFamily: FONT.bold }} numberOfLines={1}>{pick(mall, 'name', i18n.language)}</Txt>
        {size === 'full' && (
          <Txt variant="caption" color={colour === t.neutral ? t.textMuted : colour} style={styles.count}>
            {mall.availability === 'grey' ? tr('map.noData') : tr('map.free', { count: mall.free })}
          </Txt>
        )}
      </View>
      <View style={[styles.pointer, { borderTopColor: colour }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  tag: { borderWidth: 2, borderRadius: radius.s, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center', maxWidth: 200 },
  count: { fontSize: 12, lineHeight: 16, fontFamily: FONT.semibold },
  pointer: { width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
});
