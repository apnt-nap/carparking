import { storedValue } from './stored';

/** Bump when the terms text changes; users must accept again. */
export const TERMS_VERSION = '2026-11-02';

export interface Consent {
  version: string;
  accepted_at: string;
}

/** FR-21 / UI-24: Terms & Agreement + PDPA consent, required before plate entry can be used. */
export const consentStore = storedValue<Consent>('app.consent');

export function useConsent() {
  const consent = consentStore.useValue();
  return {
    loading: consent === undefined,
    consent: consent ?? null,
    accepted: !!consent && consent.version === TERMS_VERSION,
    accept: () => consentStore.set({ version: TERMS_VERSION, accepted_at: new Date().toISOString() }),
    withdraw: () => consentStore.set(null),
  };
}
