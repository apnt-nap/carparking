import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Car, ChevronRight, LogOut, RotateCcw, SquareParking, Ticket, TrafficCone, Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Segmented, Txt } from '../../components/ui';
import { api, API_BASE } from '../../lib/api';
import { setMode, useDataMode, type DataMode } from '../../lib/dataSource';
import { dateOf } from '../../lib/format';
import { pick, setLanguage, type AppLang } from '../../lib/i18n';
import { saveParked, useParked } from '../../lib/parked';
import { useSession } from '../../lib/session';
import { showToast } from '../../lib/toast';
import { consentStore, useConsent } from '../../lib/user';
import { radius, space, themePrefStore, TOUCH, useTheme, useThemePref, type ThemePref } from '../../lib/theme';

/** UI-21 to UI-26, UI-44: profile and login first, then wallet, ticketless entry, demo tools and settings. */
export default function AccountScreen() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const lang = i18n.language;
  const { session, signOut } = useSession();
  const { accepted } = useConsent();
  const { parked } = useParked();
  const mode = useDataMode();
  const themePref = useThemePref();
  const qc = useQueryClient();
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: api.wallet, enabled: !!session });

  const resetDemo = () =>
    Alert.alert(tr('demo.resetTitle'), tr('demo.resetBody'), [
      { text: tr('common.cancel'), style: 'cancel' },
      {
        text: tr('demo.reset'), style: 'destructive',
        onPress: async () => {
          await api.resetDemo();
          await Promise.all([signOut(), consentStore.set(null), saveParked(null)]);
          qc.clear();
          showToast(tr('demo.resetDone'));
        },
      },
    ]);

  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={styles.page}>
      {/* UI-44: login is the first thing on the page */}
      <Card raised style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: t.primary }]}>
          <Txt variant="heading" color={t.onPrimary}>{session ? session.display_name.slice(0, 1).toUpperCase() : '?'}</Txt>
        </View>
        <View style={{ flex: 1 }}>
          {session ? (
            <>
              <Txt variant="heading">{session.display_name}</Txt>
              <Txt variant="caption" muted>{session.email}</Txt>
            </>
          ) : (
            <>
              <Txt variant="heading">{tr('auth.welcome')}</Txt>
              <Txt variant="caption" muted>{tr('auth.whyLogin')}</Txt>
            </>
          )}
          <Txt variant="caption" muted>{tr('auth.demoNote')}</Txt>
        </View>
      </Card>
      {session
        ? <Button icon={LogOut} label={tr('auth.logOut')} onPress={() => { signOut(); qc.clear(); }} />
        : <Button primary label={tr('auth.loginWithEmail')} onPress={() => router.push('/login')} />}

      {session && (
        <>
          <Section title={tr('wallet.title')} />
          <Card>
            <View style={styles.between}>
              <View>
                <Txt variant="caption" muted>{tr('wallet.balance')}</Txt>
                <Txt variant="big">{tr('price.baht', { amount: wallet.data?.balance_thb ?? 0 })}</Txt>
              </View>
              <Button primary small icon={Wallet} label={tr('wallet.topUp')} onPress={() => router.push('/topup')} />
            </View>
            <Txt variant="caption" muted>{tr('wallet.demoBanner')}</Txt>
            {(wallet.data?.transactions ?? []).slice(0, 6).map((x) => (
              <View key={x.id} style={[styles.tx, { borderTopColor: t.border }]}>
                <View style={{ flex: 1 }}>
                  <Txt variant="label">{tr(`wallet.tx_${x.type}`)} · {tr(`wallet.method_${x.method}`)}</Txt>
                  <Txt variant="caption" muted>{dateOf(x.created_at, lang)}</Txt>
                </View>
                <Txt variant="label" color={x.type === 'payment' ? t.text : t.success}>
                  {x.type === 'payment' ? '−' : '+'}{tr('price.baht', { amount: x.amount_thb })}
                </Txt>
              </View>
            ))}
            {wallet.data && wallet.data.transactions.length === 0 && <Txt muted>{tr('wallet.noTx')}</Txt>}
          </Card>
        </>
      )}

      <Section title={tr('settings.ticketless')} />
      <LinkRow
        icon={SquareParking}
        label={accepted ? tr('plates.manage') : tr('settings.openTicketless')}
        hint={session ? tr('settings.ticketlessHint') : tr('parking.lockedLogin')}
        onPress={() => router.push(session ? '/plates' : '/login')}
      />

      <Section title={tr('demo.title')} />
      <LinkRow icon={Ticket} label={tr('demo.addTicket')} hint={tr('demo.addTicketHint')} onPress={() => router.push(session ? '/demo-ticket' : '/login')} />
      <LinkRow icon={TrafficCone} label={tr('gate.title')} hint={tr('gate.intro')} onPress={() => router.push('/sim-gate')} />
      {mode === 'demo' && <LinkRow icon={RotateCcw} label={tr('demo.reset')} hint={tr('demo.resetHint')} onPress={resetDemo} />}

      <Section title={tr('settings.title')} />
      <Txt variant="label">{tr('settings.language')}</Txt>
      <Segmented<AppLang> options={[{ value: 'th', label: 'ไทย' }, { value: 'en', label: 'English' }]} value={lang === 'th' ? 'th' : 'en'} onChange={setLanguage} />
      <Txt variant="label">{tr('settings.theme')}</Txt>
      <Segmented<ThemePref>
        options={[{ value: 'system', label: tr('settings.system') }, { value: 'light', label: tr('settings.light') }, { value: 'dark', label: tr('settings.dark') }]}
        value={themePref}
        onChange={(v) => themePrefStore.set(v)}
      />
      <Txt variant="label">{tr('settings.dataSource')}</Txt>
      <Segmented<DataMode>
        options={[{ value: 'demo', label: tr('settings.demo') }, { value: 'server', label: tr('settings.server') }]}
        value={mode ?? 'demo'}
        onChange={(m) => setMode(m).then(() => qc.resetQueries())}
      />
      <Txt variant="caption" muted>{mode === 'server' ? tr('settings.serverHint', { url: API_BASE }) : tr('settings.demoHint')}</Txt>
      <LinkRow
        icon={Car}
        label={tr('settings.parked')}
        hint={parked ? `${pick(parked, 'zone_name', lang)} · ${pick(parked, 'mall_name', lang)}` : tr('settings.none')}
        onPress={parked ? () => router.push({ pathname: '/floor/[id]', params: { id: parked.floor_id } }) : undefined}
      />
      {parked && <Button kind="ghost" small label={tr('settings.clear')} onPress={() => saveParked(null)} style={{ alignSelf: 'flex-start' }} />}
    </ScrollView>
  );
}

function Section({ title }: { title: string }) {
  return <Txt variant="heading" accessibilityRole="header" style={{ marginTop: space.s }}>{title}</Txt>;
}

function LinkRow({ icon: Icon, label, hint, onPress }: { icon: typeof Car; label: string; hint?: string; onPress?: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      style={({ pressed }) => [styles.link, { backgroundColor: t.surface, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.linkIcon, { backgroundColor: t.accentTint }]}><Icon size={20} color={t.accentText} /></View>
      <View style={{ flex: 1 }}>
        <Txt variant="label">{label}</Txt>
        {hint && <Txt variant="caption" muted numberOfLines={2}>{hint}</Txt>}
      </View>
      {onPress && <ChevronRight size={18} color={t.textMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { padding: space.l, gap: space.m, paddingBottom: 48 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  tx: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  link: { minHeight: TOUCH + 16, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.m },
  linkIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
