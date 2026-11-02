import { requireOptionalNativeModule } from 'expo';

export type SpeechModule = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

let cached: SpeechModule | null | undefined;

/**
 * FR-17: the ONLY place that loads expo-speech-recognition. Expo Go doesn't include this native module, and
 * the package throws "Cannot find native module 'ExpoSpeechRecognition'" as soon as it is evaluated.
 * So check for the native module first (requireOptionalNativeModule returns null instead of throwing)
 * and only then load the package. Never import 'expo-speech-recognition' anywhere else.
 */
export function getSpeech(): SpeechModule | null {
  if (cached !== undefined) return cached;
  cached = null;
  try {
    if (requireOptionalNativeModule('ExpoSpeechRecognition')) {
      cached = (require('expo-speech-recognition') as typeof import('expo-speech-recognition')).ExpoSpeechRecognitionModule;
    }
  } catch {
    cached = null;
  }
  return cached;
}

/** True when voice search can work here (a development or store build, not Expo Go). */
export function isVoiceAvailable(): boolean {
  const s = getSpeech();
  try {
    return !!s && s.isRecognitionAvailable();
  } catch {
    return false;
  }
}
