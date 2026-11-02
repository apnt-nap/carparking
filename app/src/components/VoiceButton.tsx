import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { Button } from './ui';

type SpeechModule = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

/** expo-speech-recognition is a native module that Expo Go doesn't include, so load it lazily and fail soft. */
function loadSpeech(): SpeechModule | undefined {
  try {
    return require('expo-speech-recognition').ExpoSpeechRecognitionModule as SpeechModule;
  } catch {
    return undefined;
  }
}

/** FR-17: microphone button. Recognised text goes to onText, which runs the normal search. */
export function VoiceButton({ lang, onText }: { lang: 'th-TH' | 'en-US'; onText: (text: string) => void }) {
  const { t } = useTranslation();
  const [listening, setListening] = useState(false);
  const speech = useRef(loadSpeech()).current;

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
        Alert.alert(t('search.voiceError'));
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [speech, onText, t]);

  const toggle = async () => {
    if (!speech || !speech.isRecognitionAvailable()) {
      Alert.alert(t('search.voiceUnavailable'));
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
    <Button
      label={listening ? '■' : '🎤'}
      selected={listening}
      onPress={toggle}
      accessibilityLabel={listening ? t('search.stop') : t('search.mic')}
    />
  );
}
