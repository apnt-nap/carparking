import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TermsForm } from '../components/TermsForm';
import { Button, QueryState } from '../components/ui';
import { api, ApiError, type Plate } from '../lib/api';
import { consentStore, useConsent } from '../lib/user';
import { TOUCH, useTheme } from '../lib/theme';

const plateText = (p: Plate) => `${p.number} · ${p.province}`;

/** FR-21 and NFR-5: Terms & Agreement first, then register, list and delete plates. */
export default function PlatesScreen() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const { loading, accepted, accept, withdraw } = useConsent();
  const consent = consentStore.useValue();
  const qc = useQueryClient();
  const [number, setNumber] = useState('');
  const [province, setProvince] = useState('');
  const [error, setError] = useState<string>();

  const plates = useQuery({ queryKey: ['plates'], queryFn: api.plates, enabled: accepted });
  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: ['plates'] }),
    qc.invalidateQueries({ queryKey: ['tickets'] }),
  ]);

  const add = useMutation({
    mutationFn: () => api.addPlate(number, province),
    onSuccess: () => { setNumber(''); setProvince(''); setError(undefined); refresh(); },
    onError: (e) => setError(e instanceof ApiError && e.status === 400 ? tr('plates.invalid') : tr('common.error')),
  });

  const confirmDelete = (p: Plate) =>
    Alert.alert(tr('plates.deleteConfirm', { plate: plateText(p) }), undefined, [
      { text: tr('plates.cancel'), style: 'cancel' },
      { text: tr('plates.confirm'), style: 'destructive', onPress: () => api.deletePlate(p.id).then(refresh, () => Alert.alert(tr('common.error'))) },
    ]);

  // PDPA: withdrawing consent deletes every plate (and so every ticket) on the server first.
  const confirmWithdraw = () =>
    Alert.alert(tr('plates.withdraw'), tr('plates.withdrawConfirm'), [
      { text: tr('plates.cancel'), style: 'cancel' },
      {
        text: tr('plates.confirm'), style: 'destructive',
        onPress: async () => {
          try {
            const list = await api.plates();
            await Promise.all(list.map((p) => api.deletePlate(p.id)));
            await withdraw();
            refresh();
          } catch {
            Alert.alert(tr('common.error'));
          }
        },
      },
    ]);

  if (loading) return <ActivityIndicator style={{ margin: 24 }} />;

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: tr('settings.ticketless') }} />
      {!accepted ? (
        <TermsForm onAccept={accept} onDecline={() => router.back()} />
      ) : (
        <>
          {/* Hidden entry to the gate simulator (FR-25) */}
          <Pressable onLongPress={() => router.push('/sim-gate')} accessibilityHint={tr('plates.hiddenHint')}>
            <Text style={[styles.h, { color: t.text }]} accessibilityRole="header">{tr('plates.title')}</Text>
          </Pressable>
          <Text style={{ color: t.muted }}>{tr('plates.intro')}</Text>

          <QueryState loading={plates.isPending} error={plates.error} onRetry={() => plates.refetch()}>
            {plates.data?.length ? plates.data.map((p) => (
              <View key={p.id} style={[styles.plate, { backgroundColor: t.card, borderColor: t.border }]}>
                <Text style={[styles.plateText, { color: t.text }]}>🚘 {plateText(p)}</Text>
                <Button danger label={tr('plates.delete')} onPress={() => confirmDelete(p)} accessibilityLabel={`${tr('plates.delete')} ${plateText(p)}`} />
              </View>
            )) : <Text style={{ color: t.muted }}>{tr('plates.none')}</Text>}
          </QueryState>

          <TextInput
            value={number} onChangeText={setNumber} placeholder={tr('plates.number')} placeholderTextColor={t.muted}
            accessibilityLabel={tr('plates.number')} autoCorrect={false}
            style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.card }]}
          />
          <TextInput
            value={province} onChangeText={setProvince} placeholder={tr('plates.province')} placeholderTextColor={t.muted}
            accessibilityLabel={tr('plates.province')} autoCorrect={false}
            style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.card }]}
          />
          {error && <Text style={{ color: t.red }} accessibilityLiveRegion="polite">{error}</Text>}
          <Button primary label={tr('plates.add')} disabled={!number.trim() || !province.trim() || add.isPending} onPress={() => add.mutate()} />

          <Button label={`🎫 ${tr('plates.tickets')}`} onPress={() => router.push('/tickets')} />

          {consent && (
            <Text style={{ color: t.muted }}>
              {tr('plates.acceptedOn', { date: new Date(consent.accepted_at).toLocaleString(i18n.language === 'th' ? 'th-TH' : 'en-GB') })}
            </Text>
          )}
          <Button danger label={tr('plates.withdraw')} onPress={confirmWithdraw} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12 },
  h: { fontSize: 20, fontWeight: '800' },
  plate: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
  plateText: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  input: { minHeight: TOUCH, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 16 },
});
