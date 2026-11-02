import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { SessionCard } from '../../components/SessionCard';
import { QueryState, Txt } from '../../components/ui';
import { api } from '../../lib/api';
import { dateOf } from '../../lib/format';
import { pick } from '../../lib/i18n';
import { space, useTheme } from '../../lib/theme';

/** UI-40: one past visit, in the same layout as the session card (status Left). */
export default function VisitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const tickets = useQuery({ queryKey: ['tickets'], queryFn: api.tickets });
  const plates = useQuery({ queryKey: ['plates'], queryFn: api.plates });
  const malls = useQuery({ queryKey: ['malls', 'names'], queryFn: () => api.malls() });
  const ticket = tickets.data?.find((x) => x.id === id);
  const mall = ticket && malls.data?.find((m) => m.id === ticket.mall_id);
  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={{ padding: space.l, gap: space.m }}>
      <Stack.Screen options={{ title: ticket ? dateOf(ticket.entry_at, i18n.language) : tr('parking.history') }} />
      <QueryState loading={tickets.isPending} error={tickets.error} onRetry={() => tickets.refetch()}>
        {ticket
          ? <SessionCard ticket={ticket} plate={plates.data?.find((p) => p.id === ticket.plate_id)} mallName={mall ? pick(mall, 'name', i18n.language) : ticket.mall_id} now={Date.now()} />
          : <Txt muted>{tr('parking.noHistory')}</Txt>}
      </QueryState>
    </ScrollView>
  );
}
