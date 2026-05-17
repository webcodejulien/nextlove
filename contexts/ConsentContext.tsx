import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Keys ─────────────────────────────────────────────────────────────────────

const CONSENT_KEY = '@nextlove:rgpd_consent';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConsentLevel = 'none' | 'essential' | 'full';

export interface ConsentChoices {
  /** Nécessaires au fonctionnement — non refusables */
  essential: true;
  /** Mesure d'audience anonymisée */
  analytics: boolean;
  /** Communications marketing (emails, push promos) */
  marketing: boolean;
  /** Personnalisation de l'expérience via données de navigation */
  personalization: boolean;
}

export interface ConsentState {
  /** null = pas encore vu la bannière */
  hasConsented: boolean | null;
  choices: ConsentChoices;
  consentDate: string | null;
  version: number;
}

interface ConsentContextType {
  consent: ConsentState;
  loading: boolean;
  /** Accepter tout */
  acceptAll: () => Promise<void>;
  /** Refuser les non-essentiels */
  rejectAll: () => Promise<void>;
  /** Sauvegarder des choix granulaires */
  saveChoices: (choices: Partial<Omit<ConsentChoices, 'essential'>>) => Promise<void>;
  /** Réinitialiser (pour "modifier mes préférences") */
  resetConsent: () => Promise<void>;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const CURRENT_VERSION = 1;

const DEFAULT_CHOICES: ConsentChoices = {
  essential: true,
  analytics: false,
  marketing: false,
  personalization: false,
};

const DEFAULT_STATE: ConsentState = {
  hasConsented: null,
  choices: DEFAULT_CHOICES,
  consentDate: null,
  version: CURRENT_VERSION,
};

// ─── Context ──────────────────────────────────────────────────────────────────

const ConsentContext = createContext<ConsentContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  // ── Load from storage ───────────────────────────────────────────────────────

  useEffect(() => {
    AsyncStorage.getItem(CONSENT_KEY)
      .then((raw) => {
        if (!raw) {
          setConsent(DEFAULT_STATE);
          return;
        }
        const parsed: ConsentState = JSON.parse(raw);
        // If legal version changed, re-ask consent
        if (parsed.version < CURRENT_VERSION) {
          setConsent({ ...DEFAULT_STATE, hasConsented: null });
          AsyncStorage.removeItem(CONSENT_KEY);
        } else {
          setConsent(parsed);
        }
      })
      .catch(() => setConsent(DEFAULT_STATE))
      .finally(() => setLoading(false));
  }, []);

  // ── Persist helper ──────────────────────────────────────────────────────────

  const persist = useCallback(async (state: ConsentState) => {
    setConsent(state);
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const acceptAll = useCallback(async () => {
    await persist({
      hasConsented: true,
      choices: { essential: true, analytics: true, marketing: true, personalization: true },
      consentDate: new Date().toISOString(),
      version: CURRENT_VERSION,
    });
  }, [persist]);

  const rejectAll = useCallback(async () => {
    await persist({
      hasConsented: true,
      choices: DEFAULT_CHOICES,
      consentDate: new Date().toISOString(),
      version: CURRENT_VERSION,
    });
  }, [persist]);

  const saveChoices = useCallback(
    async (choices: Partial<Omit<ConsentChoices, 'essential'>>) => {
      const merged: ConsentChoices = {
        essential: true,
        analytics: choices.analytics ?? false,
        marketing: choices.marketing ?? false,
        personalization: choices.personalization ?? false,
      };
      await persist({
        hasConsented: true,
        choices: merged,
        consentDate: new Date().toISOString(),
        version: CURRENT_VERSION,
      });
    },
    [persist]
  );

  const resetConsent = useCallback(async () => {
    await AsyncStorage.removeItem(CONSENT_KEY);
    setConsent(DEFAULT_STATE);
  }, []);

  return (
    <ConsentContext.Provider
      value={{ consent, loading, acceptAll, rejectAll, saveChoices, resetConsent }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
