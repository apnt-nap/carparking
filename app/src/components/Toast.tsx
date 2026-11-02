import { Info } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onToast } from '../lib/toast';
import { elevation, radius, useTheme } from '../lib/theme';
import { Txt } from './ui';

/** Shows the latest in-app message for 4 s at the top of the screen (UI-36). */
export function ToastHost() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [msg, setMsg] = useState<{ text: string; key: number }>();
  useEffect(() => onToast((text) => setMsg({ text, key: Date.now() })), []);
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(undefined), 4000);
    return () => clearTimeout(id);
  }, [msg]);
  if (!msg) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 8 }]}>
      <Animated.View
        key={msg.key}
        entering={reduced ? undefined : FadeInUp.duration(220)}
        exiting={reduced ? undefined : FadeOutUp.duration(200)}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[styles.toast, elevation(t), { backgroundColor: t.primary }]}
      >
        <Info size={18} color={t.onPrimary} />
        <Txt variant="label" color={t.onPrimary} style={{ flexShrink: 1 }}>{msg.text}</Txt>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 100 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.m, maxWidth: 520 },
});
