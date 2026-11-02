import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Segmented } from '../../components/ui';
import { API_BASE } from '../../lib/api';
import { setMode, useDataMode, type DataMode } from '../../lib/dataSource';
import { pick, setLanguage, type AppLang } from '../../lib/i18n';
import { useParked } from '../../lib/parked';
import { useTheme } from '../../lib/theme';

/** FR-19 language switch and FR-15 "where I parked". */
export default function SettingsScreen() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const { parked, save } = useParked();
  const mode = useDataMode();
  const qc = useQueryClient();
  const lang = i18n.language;

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={styles.page}>
      <Text style={[styles.h, { color: t.text }]}>{tr('settings.language')}</Text>
      <Segmented<AppLang>
        options={[{ value: 'th', label: 'ไทย' }, { value: 'en', label: 'English' }]}
        value={lang === 'th' ? 'th' : 'en'}
        onChange={setLanguage}
      />

      <Text style={[styles.h, { color: t.text }]}>{tr('settings.dataSource')}</Text>
      <Segmented<DataMode>
        options={[{ value: 'demo', label: tr('settings.demo') }, { value: 'server', label: tr('settings.server') }]}
        value={mode ?? 'demo'}
        onChange={(m) => setMode(m).then(() => qc.resetQueries())}
      />
      <Text style={{ color: t.muted }}>{mode === 'server' ? tr('settings.serverHint', { url: API_BASE }) : tr('settings.demoHint')}</Text>

      <Text style={[styles.h, { color: t.text }]}>{tr('settings.parked')}</Text>
      {parked ? (
        <View style={styles.gap}>
          <Text style={{ color: t.text, fontSize: 16 }}>
            🚗 {pick(parked, 'zone_name', lang)} · {pick(parked, 'mall_name', lang)}
          </Text>
          <Text style={{ color: t.muted }}>{new Date(parked.saved_at).toLocaleString(lang === 'th' ? 'th-TH' : 'en-GB')}</Text>
          <Button primary label={tr('settings.open')} onPress={() => router.push({ pathname: '/floor/[id]', params: { id: parked.floor_id } })} />
          <Button label={tr('settings.clear')} onPress={() => save(null)} />
        </View>
      ) : (
        <Text style={{ color: t.muted }}>{tr('settings.none')}</Text>
      )}

      <Text style={[styles.h, { color: t.text }]}>{tr('settings.ticketless')}</Text>
      <Text style={{ color: t.muted }}>{tr('settings.ticketlessHint')}</Text>
      <Button label={`🚘 ${tr('settings.openTicketless')}`} onPress={() => router.push('/plates')} />
      <Button label={`🎫 ${tr('plates.tickets')}`} onPress={() => router.push('/tickets')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12 },
  h: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  gap: { gap: 8 },
});
