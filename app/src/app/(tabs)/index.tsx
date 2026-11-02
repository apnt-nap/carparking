import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MallRow } from '../../components/MallRow';
import { Button, QueryState, Segmented } from '../../components/ui';
import { api, type MallSummary } from '../../lib/api';
import { pick } from '../../lib/i18n';
import { useUserLocation } from '../../lib/location';
import { useParked } from '../../lib/parked';
import { availabilityColor, useTheme } from '../../lib/theme';

/** FR-1 to FR-4: map of supported malls coloured by availability, with a Nearby list. */
export default function MapScreen() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const location = useUserLocation();
  const { parked } = useParked();
  const [view, setView] = useState<'map' | 'list'>('map');
  const [selected, setSelected] = useState<MallSummary>();

  const malls = useQuery({
    queryKey: ['malls', location?.origin],
    queryFn: () => api.malls(location!.origin),
    enabled: !!location,
    refetchInterval: 15_000,
  });
  const openMall = (id: string) => router.push(`/mall/${id}`);
  const lang = i18n.language;

  if (!location) return <Text style={[styles.note, { color: t.muted }]}>{tr('map.locating')}</Text>;

  return (
    <View style={[styles.flex, { backgroundColor: t.bg }]}>
      <View style={styles.top}>
        <Segmented
          options={[{ value: 'map', label: tr('map.mapView') }, { value: 'list', label: tr('map.listView') }]}
          value={view}
          onChange={setView}
        />
        {!location.granted && <Text style={{ color: t.muted }}>{tr('map.noPermission')}</Text>}
        {parked && (
          <Button
            label={`🚗 ${pick(parked, 'zone_name', lang)} · ${pick(parked, 'mall_name', lang)}`}
            onPress={() => router.push({ pathname: '/floor/[id]', params: { id: parked.floor_id } })}
          />
        )}
      </View>

      <QueryState loading={malls.isPending} error={malls.error} onRetry={() => malls.refetch()}>
        {view === 'map' ? (
          <View style={styles.flex}>
            <MapView
              style={styles.flex}
              showsUserLocation={location.granted}
              initialRegion={{ latitude: location.origin.lat, longitude: location.origin.lng, latitudeDelta: 0.15, longitudeDelta: 0.15 }}
              onPress={() => setSelected(undefined)}
            >
              {malls.data?.map((m) => (
                <Marker
                  key={m.id}
                  coordinate={{ latitude: m.lat, longitude: m.lng }}
                  onPress={(e) => { e.stopPropagation(); setSelected(m); }}
                  accessibilityLabel={tr('map.markerLabel', { name: pick(m, 'name', lang), free: m.free, total: m.total, level: tr(`map.level_${m.availability}`) })}
                >
                  {/* Colour plus the free count, so colour is never the only signal (NFR-4) */}
                  <View style={[styles.marker, { backgroundColor: availabilityColor(t, m.availability), borderColor: t.bg }]}>
                    <Text style={styles.markerText}>{m.free}</Text>
                  </View>
                </Marker>
              ))}
            </MapView>
            {selected && <MallSheet mall={malls.data?.find((m) => m.id === selected.id) ?? selected} onOpen={openMall} />}
          </View>
        ) : (
          <FlatList
            data={malls.data}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <MallRow mall={item} onPress={() => openMall(item.id)} />}
          />
        )}
      </QueryState>
    </View>
  );
}

/** FR-3: bottom card for the tapped marker. */
function MallSheet({ mall, onOpen }: { mall: MallSummary; onOpen: (id: string) => void }) {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <View style={[styles.sheet, { backgroundColor: t.bg, borderColor: t.border }]} accessibilityLiveRegion="polite">
      <Text style={[styles.sheetTitle, { color: t.text }]}>{pick(mall, 'name', lang)}</Text>
      <Text style={{ color: t.text }}>
        {tr('map.free', { count: mall.free })}
        {mall.distance_km !== null ? ` · ${tr('map.kmAway', { km: mall.distance_km })}` : ''}
      </Text>
      <Text style={{ color: t.muted }}>{pick(mall, 'fees_summary', lang)}</Text>
      <Button primary label={tr('map.openMall')} onPress={() => onOpen(mall.id)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { padding: 12, gap: 8 },
  note: { padding: 24 },
  list: { padding: 12, gap: 10 },
  marker: { minWidth: 44, height: 44, borderRadius: 22, borderWidth: 3, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  markerText: { color: '#FFFFFF', fontWeight: '800' },
  sheet: { position: 'absolute', left: 12, right: 12, bottom: 12, padding: 16, borderRadius: 16, borderWidth: 1, gap: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
});
