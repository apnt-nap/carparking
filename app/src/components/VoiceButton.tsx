import { Mic, Square } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { TOUCH, useTheme } from '../lib/theme';

type SpeechModule = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

/** expo-speech-recognition is a native module that Expo Go doesn't include, so load it lazily and fail soft. */
function loadSpeech(): SpeechModule | undefined {
  try {
    return require('expo-speech-recognition').ExpoSpeechRecognitionModule as SpeechModule;
  } catch {
    return undefined;
  }
}

/**
 * FR-17 / UI-4: small mic icon inside the search bar. Pulses while listening (UI-34, off with reduced motion).
 * Recognised text goes to onText, which runs the normal search.
 */
export function VoiceButton({ lang, onText, onListening }: {
  lang: 'th-TH' | 'en-US'; onText: (text: string) => void; onListening?: (on: boolean) => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [listening, setListening] = useState(false);
  const speech = useRef(loadSpeech()).current;
  const reduced = useReducedMotion();
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  useEffect(() => {
    onListening?.(listening);
    if (listening && !reduced) pulse.value = withRepeat(withTiming(1.18, { duration: 600 }), -1, true);
    else { cancelAnimation(pulse); pulse.value = 1; }
  }, [listening, reduced, onListening, pulse]);

  useEffect(() => {
    if (!speech) return;
    const subs = [
      speech.addListener('result', (e) => {
        const text = e.results[0]?.transcript;
        if (text) onText(text);
      }),
      speech.addListener('end', () => setListening(false)),
      speech.addListener('error', () => {
        setListening(false);
        Alert.alert(tr('search.voiceError'));
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [speech, onText, tr]);

  const toggle = async () => {
    if (!speech || !speech.isRecognitionAvailable()) {
      Alert.alert(tr('search.voiceUnavailable'));
      return;
    }
    if (listening) {
      speech.stop();
      return;
    }
    const perm = await speech.requestPermissionsAsync();
    if (!perm.granted) return;
    speech.start({ lang, interimResults: true });
    setListening(true);
  };

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityState={{ selected: listening }}
      accessibilityLabel={listening ? tr('search.stop') : tr('search.mic')}
      hitSlop={6}
      style={styles.hit}
    >
      <Animated.View style={[styles.circle, { backgroundColor: listening ? t.primary : t.accentTint }, pulseStyle]}>
        {listening ? <Square size={14} color={t.onPrimary} fill={t.onPrimary} /> : <Mic size={18} color={t.accentText} strokeWidth={2} />}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
