import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { MallRow } from '../../components/MallRow';
import { QueryState, Segmented } from '../../components/ui';
import { VoiceButton } from '../../components/VoiceButton';
import { api } from '../../lib/api';
import { useUserLocation } from '../../lib/location';
import { TOUCH, useTheme } from '../../lib/theme';

type VoiceLang = 'th-TH' | 'en-US';

/** FR-16 to FR-18: one search bar with a mic button; typed and spoken text use the same server search. */
export default function SearchScreen() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const location = useUserLocation();
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [voiceLang, setVoiceLang] = useState<VoiceLang>(i18n.language === 'th' ? 'th-TH' : 'en-US');

  // Voice follows the app language until the user flips the toggle (FR-17).
  useEffect(() => setVoiceLang(i18n.language === 'th' ? 'th-TH' : 'en-US'), [i18n.language]);
  useEffect(() => {
    const id = setTimeout(() => setQuery(text.trim()), 250);
    return () => clearTimeout(id);
  }, [text]);

  const results = useQuery({
    queryKey: ['search', query, i18n.language, location?.origin],
    queryFn: () => api.search(query, i18n.language, location?.origin),
    enabled: query.length > 0,
  });

  return (
    <View style={[styles.flex, { backgroundColor: t.bg }]}>
      <View style={styles.top}>
        <View style={styles.row}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={tr('search.placeholder')}
            placeholderTextColor={t.muted}
            accessibilityLabel={tr('search.placeholder')}
            returnKeyType="search"
            autoCorrect={false}
            style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.card }]}
          />
          <VoiceButton lang={voiceLang} onText={setText} />
        </View>
        <Text style={{ color: t.muted }}>{tr('search.voiceLang')}</Text>
        <Segmented
          options={[{ value: 'th-TH', label: 'ไทย (th-TH)' }, { value: 'en-US', label: 'English (en-US)' }]}
          value={voiceLang}
          onChange={setVoiceLang}
        />
      </View>
      {query.length > 0 && (
        <QueryState loading={results.isPending} error={results.error} onRetry={() => results.refetch()}>
          <FlatList
            data={results.data}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={{ color: t.muted }}>{tr('search.noResults')}</Text>}
            renderItem={({ item }) => <MallRow mall={item} onPress={() => router.push(`/mall/${item.id}`)} />}
          />
        </QueryState>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { padding: 12, gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, minHeight: TOUCH, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 16 },
  list: { padding: 12, gap: 10 },
});
