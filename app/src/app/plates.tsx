import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { CarFront, Check, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { TermsForm } from '../components/TermsForm';
import { Button, Card, FONT, QueryState, Txt } from '../components/ui';
import { api, ApiError, type Plate } from '../lib/api';
import { locale } from '../lib/format';
import { useSession } from '../lib/session';
import { radius, space, TOUCH, useTheme } from '../lib/theme';
import { useConsent } from '../lib/user';

const plateText = (p: Plate) => `${p.number} · ${p.province}`;
// UI-38: optional car colour for the session card's car drawing
const CAR_COLORS = ['#F5F7FA', '#1B1F27', '#8A96A8', '#C62828', '#1E64C8', '#2E7D32', '#9A5B00'];

/** UI-24: the only place to add plates. Terms & Agreement first (two ticks), then add, delete, withdraw consent. */
export default function PlatesScreen() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const { session, loading: sessionLoading } = useSession();
  const { loading, accepted, consent, accept, withdraw } = useConsent();
  const qc = useQueryClient();
  const [number, setNumber] = useState('');
  const [province, setProvince] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState<string>();
  const [error, setError] = useState<string>();

  const plates = useQuery({ queryKey: ['plates'], queryFn: api.plates, enabled: accepted && !!session });
  const refresh = () => Promise.all(['plates', 'tickets'].map((k) => qc.invalidateQueries({ queryKey: [k] })));

  const add = useMutation({
    mutationFn: () => api.addPlate(number, province, { car_model: model.trim() || undefined, car_color: color }),
    onSuccess: () => { setNumber(''); setProvince(''); setModel(''); setColor(undefined); setError(undefined); refresh(); },
    onError: (e) => setError(e instanceof ApiError && e.status === 400 ? tr('plates.invalid') : tr('common.error')),
  });

  const confirmDelete = (p: Plate) =>
    Alert.alert(tr('plates.deleteConfirm', { plate: plateText(p) }), undefined, [
      { text: tr('plates.cancel'), style: 'cancel' },
      { text: tr('plates.confirm'), style: 'destructive', onPress: () => api.deletePlate(p.id).then(refresh, () => Alert.alert(tr('common.error'))) },
    ]);

  // PDPA: withdrawing consent deletes every plate (and so every ticket) first.
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

  if (loading || sessionLoading) return <ActivityIndicator style={{ margin: 24 }} />;

  const input = [styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.surface, fontFamily: FONT.regular }];
  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: tr('settings.ticketless') }} />
      {!session ? (
        <Card>
          <Txt>{tr('parking.lockedLogin')}</Txt>
          <Button primary label={tr('auth.loginWithEmail')} onPress={() => router.replace('/login')} />
        </Card>
      ) : !accepted ? (
        <TermsForm onAccept={accept} onDecline={() => router.back()} />
      ) : (
        <>
          <Txt variant="title" accessibilityRole="header">{tr('plates.title')}</Txt>
          <Txt muted>{tr('plates.intro')}</Txt>

          <QueryState loading={plates.isPending} error={plates.error} onRetry={() => plates.refetch()}>
            {plates.data?.length ? plates.data.map((p) => (
              <View key={p.id} style={[styles.plate, { backgroundColor: t.surface }]}>
                <CarFront size={22} color={p.car_color ?? t.textMuted} />
                <View style={{ flex: 1 }}>
                  <Txt variant="label">{plateText(p)}</Txt>
                  {p.car_model && <Txt variant="caption" muted>{p.car_model}</Txt>}
                </View>
                <Button danger small icon={Trash2} label={tr('plates.delete')} onPress={() => confirmDelete(p)} accessibilityLabel={`${tr('plates.delete')} ${plateText(p)}`} />
              </View>
            )) : <Txt muted>{tr('plates.none')}</Txt>}
          </QueryState>

          <Card>
            <Txt variant="heading">{tr('plates.add')}</Txt>
            <TextInput value={number} onChangeText={setNumber} placeholder={tr('plates.number')} placeholderTextColor={t.textMuted}
              accessibilityLabel={tr('plates.number')} autoCorrect={false} style={input} />
            <TextInput value={province} onChangeText={setProvince} placeholder={tr('plates.province')} placeholderTextColor={t.textMuted}
              accessibilityLabel={tr('plates.province')} autoCorrect={false} style={input} />
            <TextInput value={model} onChangeText={setModel} placeholder={tr('plates.carModel')} placeholderTextColor={t.textMuted}
              accessibilityLabel={tr('plates.carModel')} maxLength={40} style={input} />
            <Txt variant="caption" muted>{tr('plates.carColor')}</Txt>
            <View style={styles.swatches}>
              {CAR_COLORS.map((c) => (
                <Pressable key={c} onPress={() => setColor(color === c ? undefined : c)} accessibilityRole="radio"
                  accessibilityState={{ selected: color === c }} accessibilityLabel={c} style={styles.swatchHit}>
                  <View style={[styles.swatch, { backgroundColor: c, borderColor: color === c ? t.primary : t.border }]}>
                    {color === c && <Check size={16} color={c === '#F5F7FA' ? '#0B1B33' : '#FFFFFF'} strokeWidth={3} />}
                  </View>
                </Pressable>
              ))}
            </View>
            {error && <Txt color={t.danger} accessibilityLiveRegion="polite">{error}</Txt>}
            <Button primary label={tr('plates.add')} disabled={!number.trim() || !province.trim() || add.isPending} onPress={() => add.mutate()} />
          </Card>

          {consent && (
            <Txt variant="caption" muted>
              {tr('plates.acceptedOn', { date: new Date(consent.accepted_at).toLocaleString(locale(i18n.language)) })}
            </Txt>
          )}
          <Button danger label={tr('plates.withdraw')} onPress={confirmWithdraw} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: space.l, gap: space.m, paddingBottom: 48 },
  plate: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.m },
  input: { minHeight: TOUCH + 6, borderWidth: 1, borderRadius: radius.s, paddingHorizontal: 14, fontSize: 16 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  swatchHit: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
