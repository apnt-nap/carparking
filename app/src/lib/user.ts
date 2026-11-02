import AsyncStorage from '@react-native-async-storage/async-storage';
import { storedValue } from './stored';

const KEY = 'app.userId';
let userId: Promise<string> | undefined;

// shortcut: a random id per install stands in for a real account; replace with sign-in before real plates (DECISIONS.md).
export function getUserId(): Promise<string> {
  userId ??= AsyncStorage.getItem(KEY).then(async (id) => {
    if (id) return id;
    const fresh = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(KEY, fresh);
    return fresh;
  });
  return userId;
}

/** Bump when the terms text changes; users must accept again. */
export const TERMS_VERSION = '2026-11-02';

export interface Consent {
  version: string;
  accepted_at: string;
}

/** FR-21: Terms & Agreement + PDPA consent, required before plate entry can be used. */
export const consentStore = storedValue<Consent>('app.consent');

export function useConsent() {
  const consent = consentStore.useValue();
  return {
    loading: consent === undefined,
    accepted: !!consent && consent.version === TERMS_VERSION,
    accept: () => consentStore.set({ version: TERMS_VERSION, accepted_at: new Date().toISOString() }),
    withdraw: () => consentStore.set(null),
  };
}
