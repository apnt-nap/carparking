import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, QueryState, Txt } from '../components/ui';
import { api } from '../lib/api';
import { timeOf } from '../lib/format';
import { pick } from '../lib/i18n';
import { showToast } from '../lib/toast';
import { space, useTheme } from '../lib/theme';

const AGO = [30, 80, 150];

/** UI-25: create an active ticket that started a while ago, so Parking & Pay can be shown without the gate simulator. */
export default function DemoTicketScreen() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const lang = i18n.language;
  const qc = useQueryClient();
  const malls = useQuery({ queryKey: ['malls', 'names'], queryFn: () => api.malls() });
  const plates = useQuery({ queryKey: ['plates'], queryFn: api.plates });
  const [mallId, setMallId] = useState<string>();
  const [plateId, setPlateId] = useState<string>();
  const [ago, setAgo] = useState(80);
  const mall = mallId ?? malls.data?.[0]?.id;
  const plate = plateId ?? plates.data?.[0]?.id;

  const create = useMutation({
    mutationFn: () => api.addDemoTicket(plate!, mall!, ago),
    onSuccess: (tk) => {
      const m = malls.data?.find((x) => x.id === tk.mall_id);
      showToast(tr('parking.enteredToast', { mall: m ? pick(m, 'name', lang) : '', time: timeOf(tk.entry_at, lang) }));
      qc.invalidateQueries({ queryKey: ['tickets'] });
      router.replace('/(tabs)/parking');
    },
  });

  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={styles.page}>
      <Stack.Screen options={{ title: tr('demo.addTicket') }} />
      <Txt muted>{tr('demo.addTicketHint')}</Txt>
      <QueryState loading={malls.isPending || plates.isPending} error={malls.error ?? plates.error} onRetry={() => { malls.refetch(); plates.refetch(); }}>
        {!plates.data?.length ? (
          <>
            <Txt>{tr('gate.needPlate')}</Txt>
            <Button primary label={tr('settings.openTicketless')} onPress={() => router.replace('/plates')} />
          </>
        ) : (
          <>
            <Txt variant="heading">{tr('gate.mall')}</Txt>
            <View style={styles.wrap}>
              {malls.data?.map((m) => <Button key={m.id} small selected={m.id === mall} label={pick(m, 'name', lang)} onPress={() => setMallId(m.id)} />)}
            </View>
            <Txt variant="heading">{tr('gate.plate')}</Txt>
            <View style={styles.wrap}>
              {plates.data.map((p) => <Button key={p.id} small selected={p.id === plate} label={`${p.number} · ${p.province}`} onPress={() => setPlateId(p.id)} />)}
            </View>
            <Txt variant="heading">{tr('demo.started')}</Txt>
            <View style={styles.wrap}>
              {AGO.map((m) => <Button key={m} small selected={m === ago} label={tr('demo.ago', { time: tr('time.hm', { h: Math.floor(m / 60), m: m % 60 }) })} onPress={() => setAgo(m)} />)}
            </View>
            {create.error && <Txt color={t.danger}>{tr('common.error')}</Txt>}
            <Button primary label={tr('demo.create')} disabled={!mall || !plate || create.isPending} onPress={() => create.mutate()} />
          </>
        )}
      </QueryState>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: space.l, gap: space.m, paddingBottom: 48 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
