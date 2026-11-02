import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Car, List, LocateFixed, Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MallCard } from '../../components/MallCard';
import { MallLabel, type LabelSize } from '../../components/MallLabel';
import { PricesList } from '../../components/PricesList';
import { SearchPopup } from '../../components/SearchPopup';
import { Button, Fab, FONT, QueryState, Segmented, Sheet, Txt, useNow } from '../../components/ui';
import { VoiceButton } from '../../components/VoiceButton';
import { api, type MallSummary } from '../../lib/api';
import { clock, nearestThree, priceText, spots } from '../../lib/format';
import { pick } from '../../lib/i18n';
import { BANGKOK, useUserLocation } from '../../lib/location';
import { useParked } from '../../lib/parked';
import { useSession } from '../../lib/session';
import { storedValue } from '../../lib/stored';
import { availabilityColor, darkMapStyle, elevation, radius, TOUCH, useTheme } from '../../lib/theme';

const recentStore = storedValue<string[]>('app.recentMalls');

/** UI-12: shrink labels when zoomed out, and to dots where they would overlap a bigger mall's label. */
function labelSizes(malls: MallSummary[], latDelta: number): Map<string, LabelSize> {
  const base: LabelSize = latDelta > 0.35 ? 'dot' : latDelta > 0.12 ? 'name' : 'full';
  const near = latDelta * (base === 'full' ? 0.1 : 0.06);
  const placed: MallSummary[] = [];
  const out = new Map<string, LabelSize>();
  for (const m of [...malls].sort((a, b) => b.total - a.total)) {
    const clash = placed.some((p) => Math.abs(p.lat - m.lat) < near && Math.abs(p.lng - m.lng) < near * 1.6);
    out.set(m.id, clash ? 'dot' : base);
    if (!clash && base !== 'dot') placed.push(m);
  }
  return out;
}

/** UI-3 to UI-13, UI-35 banner, UI-41 to UI-43: the map with floating search, buttons, labels and Nearby sheet. */
export default function MapScreen() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const lang = i18n.language;
  const insets = useSafeAreaInsets();
  const location = useUserLocation();
  const mapRef = useRef<MapView>(null);
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'th-TH' | 'en-US'>(lang === 'th' ? 'th-TH' : 'en-US');
  const [selected, setSelected] = useState<string>();
  const [sheet, setSheet] = useState(false);
  const [sheetView, setSheetView] = useState<'nearby' | 'prices'>('nearby');
  const [latDelta, setLatDelta] = useState(0.1);
  const recent = recentStore.useValue() ?? [];
  const origin = location?.granted ? location.origin : undefined;

  useEffect(() => setVoiceLang(lang === 'th' ? 'th-TH' : 'en-US'), [lang]);
  useEffect(() => {
    const id = setTimeout(() => setQuery(text.trim()), 250);
    return () => clearTimeout(id);
  }, [text]);

  const malls = useQuery({
    queryKey: ['malls', location?.origin],
    queryFn: () => api.malls(location?.granted ? location.origin : undefined),
    enabled: !!location,
    refetchInterval: 15_000,
  });
  const results = useQuery({
    queryKey: ['search', query, lang, origin],
    queryFn: () => api.search(query, lang, origin),
    enabled: query.length > 0,
  });

  const sizes = useMemo(() => labelSizes(malls.data ?? [], latDelta), [malls.data, latDelta]);
  const popupMalls = query ? (results.data ?? []).slice(0, 3) : nearestThree(malls.data ?? [], recent);
  const current = malls.data?.find((m) => m.id === selected);

  const pickMall = useCallback((m: MallSummary) => {
    recentStore.set([m.id, ...recent.filter((id) => id !== m.id)].slice(0, 5));
    Keyboard.dismiss();
    setFocused(false);
    setText('');
    setSelected(m.id);
    mapRef.current?.animateToRegion({ latitude: m.lat - 0.004, longitude: m.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 400);
  }, [recent]);

  const recentre = () => {
    const o = location?.origin ?? BANGKOK;
    mapRef.current?.animateToRegion({ latitude: o.lat, longitude: o.lng, latitudeDelta: 0.1, longitudeDelta: 0.1 }, 400);
  };

  /** UI-43: "Choose a spot" opens the best floor (FR-6) with its suggested bay. */
  const chooseSpot = async (id: string) => {
    setSheet(false);
    try {
      const mall = await api.mall(id, 'free');
      const best = mall.floors.find((f) => f.best_choice) ?? mall.floors[0];
      router.push(best ? { pathname: '/floor/[id]', params: { id: best.id } } : `/mall/${id}`);
    } catch {
      router.push(`/mall/${id}`);
    }
  };

  if (!location) return <View style={[styles.flex, { backgroundColor: t.background }]}><Txt muted style={{ padding: 24 }}>{tr('map.locating')}</Txt></View>;

  return (
    <View style={[styles.flex, { backgroundColor: t.background }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsUserLocation={location.granted}
        showsMyLocationButton={false}
        userInterfaceStyle={t.dark ? 'dark' : 'light'}
        customMapStyle={t.dark ? darkMapStyle : []}
        initialRegion={{ latitude: location.origin.lat, longitude: location.origin.lng, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
        onRegionChangeComplete={(r: Region) => setLatDelta(r.latitudeDelta)}
        onPress={() => { setSelected(undefined); setFocused(false); Keyboard.dismiss(); }}
      >
        {malls.data?.map((m) => {
          const size = sizes.get(m.id) ?? 'full';
          return (
            <Marker
              key={`${m.id}-${size}-${m.free}-${t.dark}-${lang}`}
              coordinate={{ latitude: m.lat, longitude: m.lng }}
              anchor={{ x: 0.5, y: size === 'dot' ? 0.5 : 1 }}
              tracksViewChanges={false}
              onPress={(e) => { e.stopPropagation(); setSelected(m.id); }}
              accessibilityLabel={`${pick(m, 'name', lang)}, ${spots(m, tr).text}`}
            >
              <MallLabel mall={m} size={size} />
            </Marker>
          );
        })}
      </MapView>

      {/* UI-3, UI-4: floating search pill with the mic inside */}
      <View style={[styles.top, { top: insets.top + 8 }]} pointerEvents="box-none">
        <View style={[styles.pill, elevation(t), { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
          <Search size={20} color={t.textMuted} />
          <TextInput
            value={listening ? '' : text}
            onChangeText={setText}
            onFocus={() => setFocused(true)}
            placeholder={listening ? tr('search.listening') : tr('search.placeholder')}
            placeholderTextColor={listening ? t.accentText : t.textMuted}
            accessibilityLabel={tr('search.placeholder')}
            returnKeyType="search"
            autoCorrect={false}
            style={[styles.input, { color: t.text, fontFamily: FONT.regular }]}
          />
          {text.length > 0 && (
            <Pressable onPress={() => setText('')} accessibilityRole="button" accessibilityLabel={tr('search.clear')} hitSlop={8}>
              <X size={18} color={t.textMuted} />
            </Pressable>
          )}
          <VoiceButton lang={voiceLang} onText={(s) => { setText(s); setFocused(true); }} onListening={setListening} />
        </View>

        {focused && (
          <>
            <SearchPopup
              title={query ? tr('search.bestMatches') : location.granted ? tr('search.nearest') : recent.length ? tr('search.recent') : tr('search.popular')}
              malls={popupMalls}
              onPick={pickMall}
              emptyText={tr('search.noResults')}
            />
            <View style={styles.voiceRow}>
              <Txt variant="caption" muted>{tr('search.voiceLang')}</Txt>
              <Segmented
                options={[{ value: 'th-TH', label: 'ไทย' }, { value: 'en-US', label: 'English' }]}
                value={voiceLang}
                onChange={setVoiceLang}
              />
            </View>
          </>
        )}

        {!focused && <ParkedBanner />}
      </View>

      {/* UI-8: floating buttons on the right, lower half */}
      <View style={[styles.fabs, { bottom: current ? 230 : 32 }]}>
        <Fab icon={LocateFixed} onPress={recentre} label={tr('map.myLocation')} />
        <Fab icon={List} onPress={() => setSheet(true)} label={tr('map.nearby')} />
      </View>

      {current && !focused && (
        <View style={[styles.mallCard, elevation(t), { backgroundColor: t.surfaceElevated, borderColor: t.border }]} accessibilityLiveRegion="polite">
          <Txt variant="heading">{pick(current, 'name', lang)}</Txt>
          <Txt color={availabilityColor(t, spots(current, tr).level)} variant="label">
            {spots(current, tr).text}{current.distance_km !== null ? `  ·  ${tr('map.kmAway', { km: current.distance_km })}` : ''}
          </Txt>
          <Txt variant="caption" muted>{priceText(current.fees, tr)}</Txt>
          <View style={styles.row}>
            <Button label={tr('map.openMall')} onPress={() => router.push(`/mall/${current.id}`)} style={styles.flex} />
            <Button primary label={tr('map.chooseSpot')} onPress={() => chooseSpot(current.id)} disabled={current.free === 0} style={styles.flex} />
          </View>
        </View>
      )}

      {/* UI-8, UI-42, UI-43: Nearby sheet with mall cards and a Prices view */}
      <Sheet visible={sheet} onClose={() => setSheet(false)} title={tr('map.nearby')}>
        <Segmented
          options={[{ value: 'nearby', label: tr('map.nearby') }, { value: 'prices', label: tr('prices.title') }]}
          value={sheetView}
          onChange={setSheetView}
        />
        <QueryState loading={malls.isPending} error={malls.error} onRetry={() => malls.refetch()}>
          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
            {sheetView === 'nearby'
              ? [...(malls.data ?? [])]
                  .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity))
                  .map((m) => (
                    <MallCard key={m.id} mall={m} onChoose={() => chooseSpot(m.id)} onOpen={() => { setSheet(false); router.push(`/mall/${m.id}`); }} />
                  ))
              : <PricesList malls={malls.data ?? []} />}
          </ScrollView>
        </QueryState>
      </Sheet>
    </View>
  );
}

/** UI-35: compact banner while parked (open ticket), or the saved "I parked here" spot (FR-15). */
function ParkedBanner() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const { session } = useSession();
  const { parked } = useParked();
  const tickets = useQuery({ queryKey: ['tickets'], queryFn: api.tickets, enabled: !!session, refetchInterval: 15_000 });
  const malls = useQuery({ queryKey: ['malls', 'names'], queryFn: () => api.malls(), enabled: !!session });
  const open = tickets.data?.find((x) => x.status === 'open');
  const now = useNow(1000);
  const lang = i18n.language;

  if (!open && !parked) return null;
  const mall = open && malls.data?.find((m) => m.id === open.mall_id);
  const label = open
    ? tr('parking.banner', {
        mall: mall ? pick(mall, 'name', lang) : '', time: clock(now - Date.parse(open.entry_at)),
        amount: Math.max(0, open.fee_thb - open.paid_thb),
      })
    : `${pick(parked!, 'zone_name', lang)} · ${pick(parked!, 'mall_name', lang)}`;
  return (
    <Pressable
      onPress={() => (open ? router.push('/(tabs)/parking') : router.push({ pathname: '/floor/[id]', params: { id: parked!.floor_id } }))}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.banner, elevation(t), { backgroundColor: t.primary }]}
    >
      <Car size={18} color={t.onPrimary} />
      <Txt variant="label" color={t.onPrimary} numberOfLines={1} style={{ flexShrink: 1, fontVariant: ['tabular-nums'] }}>{label}</Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { position: 'absolute', left: 16, right: 16, gap: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 54, borderRadius: radius.pill,
    paddingLeft: 18, paddingRight: 4, borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, fontSize: 16, minHeight: TOUCH, paddingVertical: 0 },
  voiceRow: { gap: 6 },
  fabs: { position: 'absolute', right: 16, gap: 12 },
  mallCard: { position: 'absolute', left: 16, right: 16, bottom: 16, borderRadius: radius.l, padding: 18, gap: 6, borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', maxWidth: '100%', paddingHorizontal: 16, minHeight: TOUCH, borderRadius: radius.pill },
});
