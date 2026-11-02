import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Ticket } from '../lib/api';
import { dateOf, duration, history, timeOf } from '../lib/format';
import { TOUCH, useTheme } from '../lib/theme';
import { Txt } from './ui';

/** UI-40: past visits, newest first: mall, date, in/out time, duration, amount. */
export function HistoryList({ tickets, mallName, onOpen }: {
  tickets: Ticket[]; mallName: (id: string) => string; onOpen: (t: Ticket) => void;
}) {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const lang = i18n.language;
  const visits = history(tickets);
  if (visits.length === 0) return <Txt muted>{tr('parking.noHistory')}</Txt>;
  return (
    <View>
      {visits.map((v) => {
        const total = duration(Date.parse(v.exit_at!) - Date.parse(v.entry_at), tr);
        return (
          <Pressable
            key={v.id}
            onPress={() => onOpen(v)}
            accessibilityRole="button"
            accessibilityLabel={`${mallName(v.mall_id)}, ${dateOf(v.entry_at, lang)}, ${total}, ${tr('price.baht', { amount: v.fee_thb })}`}
            style={[styles.row, { borderBottomColor: t.border }]}
          >
            <View style={{ flex: 1 }}>
              <Txt variant="label">{mallName(v.mall_id)}</Txt>
              <Txt variant="caption" muted>
                {dateOf(v.entry_at, lang)} · {timeOf(v.entry_at, lang)}–{timeOf(v.exit_at!, lang)} · {total}
              </Txt>
            </View>
            <Txt variant="label">{tr('price.baht', { amount: v.fee_thb })}</Txt>
            <ChevronRight size={18} color={t.textMuted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: TOUCH + 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
});
