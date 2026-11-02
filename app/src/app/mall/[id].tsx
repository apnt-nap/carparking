import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FloorRow } from '../../components/FloorRow';
import { QueryState, Segmented } from '../../components/ui';
import { api } from '../../lib/api';
import { pick } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';

/** FR-5 to FR-8: floors with free spaces, sorted by most free (default) or floor order, plus fees and hours. */
export default function MallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const [sort, setSort] = useState<'free' | 'order'>('free');
  const mall = useQuery({ queryKey: ['mall', id, sort], queryFn: () => api.mall(id, sort), refetchInterval: 5_000 });
  const lang = i18n.language;
  const m = mall.data;

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={styles.page}>
      <Stack.Screen options={{ title: m ? pick(m, 'name', lang) : '' }} />
      <QueryState loading={mall.isPending} error={mall.error} onRetry={() => mall.refetch()}>
        {m && (
          <>
            <View style={[styles.card, { backgroundColor: t.card }]}>
              <Text style={{ color: t.muted }}>{pick(m, 'address', lang)}</Text>
              <Text style={{ color: t.text }}>{tr('mall.hours', m.hours)}</Text>
              <Text style={[styles.h, { color: t.text }]}>{tr('mall.fees')}</Text>
              <Text style={{ color: t.text }}>{pick(m.fees, 'summary', lang)}</Text>
            </View>

            <Text style={[styles.h, { color: t.text }]}>{tr('mall.floors')}</Text>
            <Segmented
              options={[{ value: 'free', label: tr('mall.sortFree') }, { value: 'order', label: tr('mall.sortOrder') }]}
              value={sort}
              onChange={setSort}
            />
            {m.floors.map((f) => (
              <FloorRow key={f.id} floor={f} onPress={() => router.push({ pathname: '/floor/[id]', params: { id: f.id } })} />
            ))}
          </>
        )}
      </QueryState>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12 },
  card: { padding: 14, borderRadius: 12, gap: 4 },
  h: { fontSize: 17, fontWeight: '700' },
});
