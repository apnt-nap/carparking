import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../lib/theme';
import { Button, Checkbox } from './ui';

const POINTS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'] as const;

/**
 * FR-21: users must willingly accept the Terms & Agreement and give PDPA consent before using plate entry.
 * Both boxes start unticked; Accept stays disabled until both are ticked.
 */
export function TermsForm({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [terms, setTerms] = useState(false);
  const [pdpa, setPdpa] = useState(false);

  return (
    <View style={styles.gap}>
      <Text style={[styles.h, { color: t.text }]} accessibilityRole="header">{tr('terms.title')}</Text>
      <Text style={{ color: t.muted }}>{tr('terms.intro')}</Text>
      <View style={[styles.card, { backgroundColor: t.card }]}>
        {POINTS.map((p) => <Text key={p} style={{ color: t.text }}>• {tr(`terms.${p}`)}</Text>)}
      </View>
      <Checkbox label={tr('terms.acceptTerms')} checked={terms} onChange={setTerms} />
      <Checkbox label={tr('terms.acceptPdpa')} checked={pdpa} onChange={setPdpa} />
      <Button primary label={tr('terms.accept')} disabled={!terms || !pdpa} onPress={onAccept} />
      <Button label={tr('terms.decline')} onPress={onDecline} />
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 12 },
  h: { fontSize: 20, fontWeight: '800' },
  card: { padding: 14, borderRadius: 12, gap: 8 },
});
