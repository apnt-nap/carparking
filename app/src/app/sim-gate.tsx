import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, QueryState, Segmented } from '../components/ui';
import { api, type GateRequest } from '../lib/api';
import { pick } from '../lib/i18n';
import { useTheme } from '../lib/theme';

// A car nobody registered, to show the ticket-machine fallback (FR-24).
const UNREGISTERED = { id: 'unregistered', number: 'กข 9999', province: 'ชลบุรี' };

/** FR-25: hidden prototype screen that sends LPR entry and exit events to POST /sim/gate. */
export default function SimGateScreen() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const lang = i18n.language;
  const qc = useQueryClient();
  const malls = useQuery({ queryKey: ['malls', 'names'], queryFn: () => api.malls() });
  const plates = useQuery({ queryKey: ['plates'], queryFn: api.plates });

  const [mallId, setMallId] = useState<string>();
  const [plateId, setPlateId] = useState<string>();
  const [direction, setDirection] = useState<'entry' | 'exit'>('entry');
  const [validated, setValidated] = useState<'no' | 'yes'>('no');

  const cars = [...(plates.data ?? []), UNREGISTERED];
  const mall = mallId ?? malls.data?.[0]?.id;
  const car = cars.find((c) => c.id === plateId) ?? cars[0];

  const gate = useMutation({
    mutationFn: (e: GateRequest) => api.gate(e),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
  const result = gate.data;

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={styles.page}>
      <Stack.Screen options={{ title: tr('gate.title') }} />
      <Text style={{ color: t.muted }}>{tr('gate.intro')}</Text>
      <QueryState loading={malls.isPending || plates.isPending} error={malls.error ?? plates.error} onRetry={() => { malls.refetch(); plates.refetch(); }}>
        <Text style={[styles.h, { color: t.text }]}>{tr('gate.mall')}</Text>
        <View style={styles.wrap}>
          {malls.data?.map((m) => (
            <Button key={m.id} label={pick(m, 'name', lang)} selected={m.id === mall} onPress={() => setMallId(m.id)} />
          ))}
        </View>

        <Text style={[styles.h, { color: t.text }]}>{tr('gate.plate')}</Text>
        <View style={styles.wrap}>
          {cars.map((c) => (
            <Button
              key={c.id}
              label={c.id === UNREGISTERED.id ? `${tr('gate.unregistered')} (${c.number})` : `${c.number} · ${c.province}`}
              selected={c.id === car.id}
              onPress={() => setPlateId(c.id)}
            />
          ))}
        </View>
        {!plates.data?.length && <Text style={{ color: t.muted }}>{tr('gate.needPlate')}</Text>}

        <Text style={[styles.h, { color: t.text }]}>{tr('gate.direction')}</Text>
        <Segmented
          options={[{ value: 'entry', label: `⬇ ${tr('gate.entry')}` }, { value: 'exit', label: `⬆ ${tr('gate.exit')}` }]}
          value={direction}
          onChange={setDirection}
        />
        {direction === 'exit' && (
          <>
            <Text style={[styles.h, { color: t.text }]}>{tr('gate.purchase')}</Text>
            <Segmented
              options={[{ value: 'no', label: tr('gate.noPurchase') }, { value: 'yes', label: tr('gate.withPurchase') }]}
              value={validated}
              onChange={setValidated}
            />
          </>
        )}

        <Button
          primary
          label={tr('gate.send')}
          disabled={!mall || gate.isPending}
          onPress={() => mall && gate.mutate({
            mall_id: mall, plate_number: car.number, province: car.province, direction, validated: direction === 'exit' && validated === 'yes',
          })}
        />
        {gate.error && <Text style={{ color: t.red }}>{tr('common.error')}</Text>}
        {result && (
          <View
            style={[styles.result, { backgroundColor: t.card, borderColor: result.action === 'open_gate' ? t.free : t.amber }]}
            accessibilityLiveRegion="polite"
          >
            {result.action === 'open_gate' ? (
              <>
                <Text style={[styles.big, { color: t.free }]}>🟢 {tr('gate.opened')}</Text>
                <Text style={{ color: t.text }}>
                  {result.ticket.status === 'open' ? tr('tickets.running', { fee: result.ticket.fee_thb }) : tr('tickets.fee', { fee: result.ticket.fee_thb })}
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.big, { color: t.amber }]}>🎟️ {tr('gate.fallback')}</Text>
                <Text style={{ color: t.text }}>{tr(`gate.reason_${result.reason}`)}</Text>
              </>
            )}
          </View>
        )}
      </QueryState>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12 },
  h: { fontSize: 16, fontWeight: '700' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  result: { padding: 16, borderRadius: 14, borderWidth: 2, gap: 4 },
  big: { fontSize: 20, fontWeight: '800' },
});
