import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { CircleHelp, Lock, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { HistoryList } from '../../components/HistoryList';
import { PlateList } from '../../components/PlateList';
import { SessionCard } from '../../components/SessionCard';
import { Button, Card, QueryState, Sheet, Txt, useNow } from '../../components/ui';
import { api, ApiError, type Ticket } from '../../lib/api';
import { currentTicket, duration } from '../../lib/format';
import { pick } from '../../lib/i18n';
import { useParked } from '../../lib/parked';
import { useSession } from '../../lib/session';
import { showToast } from '../../lib/toast';
import { useConsent } from '../../lib/user';
import { space, useTheme } from '../../lib/theme';

/** UI-14 to UI-20, UI-35 to UI-40: everything about ticketless entry and paying, except adding plates. */
export default function ParkingScreen() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const lang = i18n.language;
  const { session, loading: sessionLoading } = useSession();
  const { accepted, loading: consentLoading } = useConsent();
  const [help, setHelp] = useState(false);
  const qc = useQueryClient();
  const now = useNow(1000);
  const { parked } = useParked();

  const ready = !!session && accepted;
  const plates = useQuery({ queryKey: ['plates'], queryFn: api.plates, enabled: ready });
  const tickets = useQuery({ queryKey: ['tickets'], queryFn: api.tickets, enabled: ready, refetchInterval: 15_000 });
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: api.wallet, enabled: !!session });
  const malls = useQuery({ queryKey: ['malls', 'names'], queryFn: () => api.malls() });

  const mallName = (id: string) => {
    const m = malls.data?.find((x) => x.id === id);
    return m ? pick(m, 'name', lang) : id;
  };
  const refresh = () => Promise.all(['tickets', 'wallet', 'plates'].map((k) => qc.invalidateQueries({ queryKey: [k] })));

  const pay = useMutation({
    mutationFn: (ticket: Ticket) => api.payTicket(ticket.id),
    onSuccess: (tk) => { showToast(tr('parking.paidToast', { amount: tk.paid_thb, mall: mallName(tk.mall_id) })); refresh(); },
    onError: (e) => {
      if (e instanceof ApiError && e.code === 'insufficient_balance') {
        Alert.alert(tr('errors.insufficient_balance'), undefined, [
          { text: tr('common.cancel'), style: 'cancel' },
          { text: tr('wallet.topUp'), onPress: () => router.push('/topup') },
        ]);
      } else Alert.alert(tr(`errors.${e instanceof ApiError && e.code ? e.code : 'generic'}`, { defaultValue: tr('common.error') }));
    },
  });

  /** Demo "End parking": the exit gate reads the plate, takes any amount still due, and closes the ticket (UI-16, UI-36). */
  const end = useMutation({
    mutationFn: async (ticket: Ticket) => {
      const plate = plates.data?.find((p) => p.id === ticket.plate_id);
      if (!plate) throw new ApiError(404, 'plate', 'not_found');
      return api.gate({ mall_id: ticket.mall_id, plate_number: plate.number, province: plate.province, direction: 'exit' });
    },
    onSuccess: (res) => {
      if (res.action === 'open_gate') {
        const tk = res.ticket;
        showToast(tr('parking.leftToast', {
          mall: mallName(tk.mall_id), time: duration(Date.parse(tk.exit_at!) - Date.parse(tk.entry_at), tr), amount: tk.fee_thb,
        }));
      }
      refresh();
    },
    onError: () => Alert.alert(tr('common.error')),
  });

  if (sessionLoading || consentLoading) return null;

  // UI-14: locked until logged in and ticketless entry is set up
  if (!ready) {
    return (
      <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={styles.page}>
        <Card style={styles.locked}>
          <View style={[styles.lockIcon, { backgroundColor: t.accentTint }]}><Lock size={28} color={t.accentText} /></View>
          <Txt variant="heading" style={{ textAlign: 'center' }}>{tr('parking.lockedTitle')}</Txt>
          <Txt muted style={{ textAlign: 'center' }}>{session ? tr('parking.lockedSetup') : tr('parking.lockedLogin')}</Txt>
          {session
            ? <Button primary label={tr('settings.openTicketless')} onPress={() => router.push('/plates')} />
            : <Button primary label={tr('auth.loginWithEmail')} onPress={() => router.push('/login')} />}
        </Card>
        <HowLink onPress={() => setHelp(true)} />
        <HowPaying visible={help} onClose={() => setHelp(false)} />
      </ScrollView>
    );
  }

  const ticket = tickets.data ? currentTicket(tickets.data, now) : undefined;
  const openIds = new Set((tickets.data ?? []).filter((x) => x.status === 'open').map((x) => x.plate_id));
  const place = ticket && parked && parked.mall_id === ticket.mall_id ? pick(parked, 'zone_name', lang) + ` · ${parked.bay_id.slice(-4)}` : undefined;

  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={styles.page}>
      <QueryState loading={tickets.isPending || plates.isPending} error={tickets.error ?? plates.error} onRetry={refresh}>
        {ticket ? (
          <SessionCard
            ticket={ticket}
            plate={plates.data?.find((p) => p.id === ticket.plate_id)}
            mallName={mallName(ticket.mall_id)}
            place={place}
            now={now}
            busy={pay.isPending || end.isPending}
            onPay={() => pay.mutate(ticket)}
            onEnd={() => end.mutate(ticket)}
            onNavigate={place ? () => router.push({ pathname: '/floor/[id]', params: { id: parked!.floor_id } }) : () => router.push(`/mall/${ticket.mall_id}`)}
            onSetPlace={() => router.push(`/mall/${ticket.mall_id}`)}
          />
        ) : (
          <Card>
            <Txt variant="heading">{tr('parking.notParked')}</Txt>
            <Txt muted>{tr('parking.notParkedHint')}</Txt>
          </Card>
        )}

        {/* UI-17: wallet summary */}
        <Card style={styles.walletRow}>
          <Wallet size={22} color={t.accentText} />
          <View style={{ flex: 1 }}>
            <Txt variant="caption" muted>{tr('wallet.balance')}</Txt>
            <Txt variant="heading">{tr('price.baht', { amount: wallet.data?.balance_thb ?? 0 })}</Txt>
          </View>
          <Button small label={tr('wallet.topUp')} onPress={() => router.push('/topup')} />
        </Card>

        <Txt variant="heading" accessibilityRole="header">{tr('parking.myPlates')}</Txt>
        <PlateList plates={plates.data ?? []} parkedPlateIds={openIds} />

        <Txt variant="heading" accessibilityRole="header">{tr('parking.history')}</Txt>
        <HistoryList tickets={tickets.data ?? []} mallName={mallName} onOpen={(v) => router.push({ pathname: '/visit/[id]', params: { id: v.id } })} />

        <HowLink onPress={() => setHelp(true)} />
      </QueryState>
      <HowPaying visible={help} onClose={() => setHelp(false)} />
    </ScrollView>
  );
}

function HowLink({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.how}>
      <CircleHelp size={18} color={t.accentText} />
      <Txt variant="label" color={t.accentText}>{tr('howPay.link')}</Txt>
    </Pressable>
  );
}

/** UI-20: how paying works, in four steps. */
function HowPaying({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Sheet visible={visible} onClose={onClose} title={tr('howPay.title')}>
      {(['s1', 's2', 's3', 's4'] as const).map((k, i) => (
        <View key={k} style={styles.step}>
          <View style={[styles.num, { backgroundColor: t.primary }]}><Txt variant="label" color={t.onPrimary}>{i + 1}</Txt></View>
          <Txt style={{ flex: 1 }}>{tr(`howPay.${k}`)}</Txt>
        </View>
      ))}
      <Button primary label={tr('common.gotIt')} onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  page: { padding: space.l, gap: space.l, paddingBottom: 48 },
  locked: { alignItems: 'center', gap: 12, paddingVertical: 28 },
  lockIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  walletRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  how: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  num: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
