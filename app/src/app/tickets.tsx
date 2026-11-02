import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { QueryState } from '../components/ui';
import { api, type Ticket } from '../lib/api';
import { pick } from '../lib/i18n';
import { useTheme } from '../lib/theme';

/** FR-22, FR-23: e-tickets. Open tickets show a running fee that refreshes; closed ones show the final fee. */
export default function TicketsScreen() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const lang = i18n.language;
  const tickets = useQuery({ queryKey: ['tickets'], queryFn: api.tickets, refetchInterval: 10_000 });
  const malls = useQuery({ queryKey: ['malls', 'names'], queryFn: () => api.malls() });
  const plates = useQuery({ queryKey: ['plates'], queryFn: api.plates });

  const time = (iso: string) => new Date(iso).toLocaleString(lang === 'th' ? 'th-TH' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const mallName = (id: string) => {
    const m = malls.data?.find((x) => x.id === id);
    return m ? pick(m, 'name', lang) : id;
  };
  const plate = (id: string) => plates.data?.find((p) => p.id === id);
  const sorted = [...(tickets.data ?? [])].sort(
    (a, b) => Number(b.status === 'open') - Number(a.status === 'open') || b.entry_at.localeCompare(a.entry_at),
  );

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={styles.page}>
      <Stack.Screen options={{ title: tr('tickets.title') }} />
      <QueryState loading={tickets.isPending} error={tickets.error} onRetry={() => tickets.refetch()}>
        {sorted.length === 0 && <Text style={{ color: t.muted }}>{tr('tickets.none')}</Text>}
        {sorted.map((tk: Ticket) => {
          const open = tk.status === 'open';
          const p = plate(tk.plate_id);
          return (
            <View
              key={tk.id}
              style={[styles.card, { backgroundColor: t.card, borderColor: open ? t.free : t.border }]}
              accessible
              accessibilityLiveRegion={open ? 'polite' : 'none'}
            >
              <Text style={{ color: open ? t.free : t.muted, fontWeight: '700' }}>{open ? `🟢 ${tr('tickets.open')}` : `✓ ${tr('tickets.closed')}`}</Text>
              <Text style={[styles.mall, { color: t.text }]}>🎫 {mallName(tk.mall_id)}</Text>
              {p && <Text style={{ color: t.text }}>{tr('tickets.plate', { plate: `${p.number} · ${p.province}` })}</Text>}
              <Text style={{ color: t.text }}>{tr('tickets.entered', { time: time(tk.entry_at) })}</Text>
              {tk.exit_at && <Text style={{ color: t.text }}>{tr('tickets.exited', { time: time(tk.exit_at) })}</Text>}
              <Text style={[styles.fee, { color: t.text }]}>
                {open ? tr('tickets.running', { fee: tk.fee_thb }) : tr('tickets.fee', { fee: tk.fee_thb })}
              </Text>
              {tk.validated && <Text style={{ color: t.muted }}>{tr('tickets.validated')}</Text>}
              {open && <Text style={{ color: t.muted }}>{tr('tickets.openHint')}</Text>}
            </View>
          );
        })}
      </QueryState>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12 },
  card: { padding: 16, borderRadius: 14, borderWidth: 1.5, gap: 4 },
  mall: { fontSize: 18, fontWeight: '700' },
  fee: { fontSize: 20, fontWeight: '800', marginTop: 4 },
});
