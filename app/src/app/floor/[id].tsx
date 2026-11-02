import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { FloorPlan } from '../../components/FloorPlan';
import { Button, QueryState, Segmented } from '../../components/ui';
import { api, type Bay } from '../../lib/api';
import { pick } from '../../lib/i18n';
import { useLiveFloor } from '../../lib/live';
import { useParked } from '../../lib/parked';
import { routeTo, suggestBay, type Preference } from '../../lib/route';
import { useTheme } from '../../lib/theme';

/** FR-9 to FR-15: live floor plan, suggested bay with route, tap to reroute, "I parked here". */
export default function FloorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const lang = i18n.language;

  const floor = useQuery({ queryKey: ['floor', id], queryFn: () => api.floor(id) });
  const connected = useLiveFloor(id);
  const { parked, save } = useParked();
  const [pref, setPref] = useState<Preference>('ramp');
  const [chosenId, setChosenId] = useState<string>();
  const [savedMsg, setSavedMsg] = useState<string>();

  const f = floor.data;
  const mall = useQuery({ queryKey: ['mall', f?.mall_id, 'order'], queryFn: () => api.mall(f!.mall_id, 'order'), enabled: !!f });

  // A chosen bay that gets taken falls back to the suggestion (FR-13).
  const chosen = f?.bays.find((b) => b.id === chosenId && b.status === 'free');
  const route = useMemo(() => {
    if (!f) return undefined;
    return chosen ? routeTo(f, chosen) : suggestBay(f, pref);
  }, [f, chosen, pref]);

  const onBayPress = useCallback((b: Bay) => { setChosenId(b.id); setSavedMsg(undefined); }, []);

  const parkHere = async () => {
    if (!f || !route || !mall.data) return;
    const bay = route.bay;
    await save({
      mall_id: f.mall_id, mall_name_th: mall.data.name_th, mall_name_en: mall.data.name_en,
      floor_id: f.id, bay_id: bay.id, zone_name_th: bay.zone_name_th, zone_name_en: bay.zone_name_en,
      saved_at: new Date().toISOString(),
    });
    setSavedMsg(tr('floor.parkedSaved', { zone: pick(bay, 'zone_name', lang) }));
  };

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={styles.page}>
      <Stack.Screen options={{ title: f ? `${f.level} · ${pick(f, 'name', lang)}` : '' }} />
      <QueryState loading={floor.isPending} error={floor.error} onRetry={() => floor.refetch()}>
        {f && (
          <>
            <Text style={{ color: connected ? t.free : t.muted }} accessibilityLiveRegion="polite">
              {connected ? `● ${tr('floor.live')}` : tr('floor.offline')}
            </Text>
            <Segmented
              options={[{ value: 'ramp', label: tr('floor.nearRamp') }, { value: 'lift', label: tr('floor.nearLift') }]}
              value={pref}
              onChange={(p) => { setPref(p); setChosenId(undefined); }}
            />

            <FloorPlan floor={f} route={route} parkedBayId={parked?.floor_id === f.id ? parked.bay_id : undefined} onBayPress={onBayPress} width={width - 32} />
            <Text style={{ color: t.muted }}>{tr('floor.tapHint')}</Text>

            <View style={[styles.card, { backgroundColor: t.card }]} accessibilityLiveRegion="polite">
              {route ? (
                <>
                  <Text style={{ color: t.muted }}>{chosen ? tr('floor.chosen') : tr('floor.suggested')}</Text>
                  <Text style={[styles.big, { color: t.text }]}>{pick(route.bay, 'zone_name', lang)}</Text>
                  <Text style={{ color: t.text }}>
                    {tr('floor.bay', { id: route.bay.id.slice(-4) })} · {tr('floor.distance', { m: Math.round(route.distance_m) })}
                  </Text>
                  <Button primary label={tr('floor.parkedHere')} onPress={parkHere} />
                  {savedMsg && <Text style={{ color: t.free }}>{savedMsg}</Text>}
                </>
              ) : (
                <Text style={{ color: t.text }}>{tr('floor.noFree')}</Text>
              )}
            </View>

            <Legend />
          </>
        )}
      </QueryState>
    </ScrollView>
  );
}

function Legend() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const item = (swatch: ReactNode, label: string) => (
    <View style={styles.legendItem}>{swatch}<Text style={{ color: t.text }}>{label}</Text></View>
  );
  const box = (bg: string, border: string, mark = '') => (
    <View style={[styles.swatch, { backgroundColor: bg, borderColor: border }]}><Text style={{ color: border, fontSize: 10 }}>{mark}</Text></View>
  );
  return (
    <View style={styles.legend}>
      {item(box(t.freeFill, t.free), tr('floor.free'))}
      {item(box(t.takenFill, t.taken, '✕'), tr('floor.taken'))}
      {item(<View style={[styles.line, { backgroundColor: t.route }]} />, tr('floor.route'))}
      {item(<Text>⚡</Text>, tr('bayType.ev'))}
      {item(<Text>♿</Text>, tr('bayType.accessible'))}
      {item(<Text>👪</Text>, tr('bayType.family'))}
      {item(<Text>🛗</Text>, tr('floor.lift'))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12 },
  card: { padding: 14, borderRadius: 12, gap: 6 },
  big: { fontSize: 22, fontWeight: '800' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 18, height: 18, borderWidth: 1.5, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  line: { width: 18, height: 4, borderRadius: 2 },
});
