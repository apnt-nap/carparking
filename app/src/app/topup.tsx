import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { CreditCard, QrCode } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, FONT, Segmented, Txt } from '../components/ui';
import { api, ApiError, type TopUpMethod } from '../lib/api';
import { isTestCard } from '../lib/card';
import { showToast } from '../lib/toast';
import { radius, space, TOUCH, useTheme } from '../lib/theme';

const PRESETS = [100, 300, 500, 1000];

/**
 * UI-23: demo top-up. PromptPay shows a placeholder QR; the card form accepts only the test card 4242 4242 4242 4242.
 * Card details are checked here and then dropped: never stored, logged or sent anywhere (NFR-9).
 */
export default function TopUpScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const qc = useQueryClient();
  const [amount, setAmount] = useState(300);
  const [custom, setCustom] = useState('');
  const [method, setMethod] = useState<TopUpMethod>('promptpay');
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '' });
  const [error, setError] = useState<string>();
  const value = custom ? Number(custom) : amount;
  const cardOk = isTestCard(card.number) && /^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry) && /^\d{3}$/.test(card.cvc);

  const topUp = useMutation({
    mutationFn: () => api.topUp(value, method),
    onSuccess: (w) => {
      setCard({ number: '', expiry: '', cvc: '' });
      qc.invalidateQueries({ queryKey: ['wallet'] });
      showToast(tr('wallet.toppedUp', { amount: value, balance: w.balance_thb }));
      router.back();
    },
    onError: (e) => setError(tr(`errors.${e instanceof ApiError && e.code ? e.code : 'generic'}`, { defaultValue: tr('common.error') })),
  });

  const input = [styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.surface, fontFamily: FONT.regular }];
  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: tr('wallet.topUp') }} />
      <View style={[styles.banner, { backgroundColor: t.accentTint }]}>
        <Txt variant="label" color={t.text}>{tr('wallet.demoBanner')}</Txt>
      </View>

      <Txt variant="heading">{tr('topup.amount')}</Txt>
      <View style={styles.wrap}>
        {PRESETS.map((a) => (
          <Button key={a} small selected={!custom && a === amount} label={tr('price.baht', { amount: a.toLocaleString() })}
            onPress={() => { setAmount(a); setCustom(''); }} />
        ))}
      </View>
      <TextInput value={custom} onChangeText={(s) => setCustom(s.replace(/[^0-9]/g, ''))} keyboardType="number-pad"
        placeholder={tr('topup.custom')} placeholderTextColor={t.textMuted} accessibilityLabel={tr('topup.custom')} style={input} />

      <Txt variant="heading">{tr('topup.method')}</Txt>
      <Segmented options={[{ value: 'promptpay', label: 'PromptPay' }, { value: 'card', label: tr('topup.card') }]} value={method} onChange={setMethod} />

      {method === 'promptpay' ? (
        <Card style={{ alignItems: 'center' }}>
          <View style={[styles.qr, { borderColor: t.border, backgroundColor: t.surfaceElevated }]}>
            <QrCode size={120} color={t.text} strokeWidth={1.2} />
          </View>
          <Txt variant="caption" muted style={{ textAlign: 'center' }}>{tr('topup.qrNote')}</Txt>
        </Card>
      ) : (
        <Card>
          <View style={styles.row}><CreditCard size={20} color={t.textMuted} /><Txt variant="caption" muted style={{ flex: 1 }}>{tr('topup.cardNote')}</Txt></View>
          <TextInput value={card.number} onChangeText={(n) => setCard({ ...card, number: n })} keyboardType="number-pad" maxLength={19}
            placeholder="4242 4242 4242 4242" placeholderTextColor={t.textMuted} accessibilityLabel={tr('topup.cardNumber')} style={input} />
          <View style={styles.row}>
            <TextInput value={card.expiry} onChangeText={(e) => setCard({ ...card, expiry: e })} maxLength={5}
              placeholder="MM/YY" placeholderTextColor={t.textMuted} accessibilityLabel={tr('topup.expiry')} style={[input, { flex: 1 }]} />
            <TextInput value={card.cvc} onChangeText={(c) => setCard({ ...card, cvc: c })} keyboardType="number-pad" maxLength={3} secureTextEntry
              placeholder="CVC" placeholderTextColor={t.textMuted} accessibilityLabel="CVC" style={[input, { flex: 1 }]} />
          </View>
          {card.number.length >= 16 && !isTestCard(card.number) && <Txt color={t.danger}>{tr('topup.testOnly')}</Txt>}
        </Card>
      )}

      {error && <Txt color={t.danger} accessibilityLiveRegion="polite">{error}</Txt>}
      <Button
        primary
        label={method === 'promptpay' ? tr('topup.paidQr', { amount: value || 0 }) : tr('topup.payCard', { amount: value || 0 })}
        disabled={!value || topUp.isPending || (method === 'card' && !cardOk)}
        onPress={() => { setError(undefined); topUp.mutate(); }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: space.l, gap: space.m, paddingBottom: 48 },
  banner: { borderRadius: radius.s, padding: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { minHeight: TOUCH + 6, borderWidth: 1, borderRadius: radius.s, paddingHorizontal: 14, fontSize: 16 },
  qr: { padding: 16, borderRadius: radius.m, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
