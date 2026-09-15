import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { ApiError, createApi } from './api';
import type { CoverageRequest, Credentials, PersonalInfo, Quote } from './types';
interface QuoteState {
  quote: Quote | null;
  signedIn: boolean;
  signIn: (credentials: Credentials) => Promise<void>;
  signOut: () => void;
  savePersonal: (data: PersonalInfo) => Promise<void>;
  saveCoverage: (data: CoverageRequest) => Promise<void>;
  submit: () => Promise<void>;
  reload: () => Promise<void>;
  startNew: () => void;
}
const Context = createContext<QuoteState | null>(null);
const storageKey = 'clara-quote-id';
export function QuoteProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const api = useMemo(() => (credentials ? createApi(credentials) : null), [credentials]);
  const value = useMemo<QuoteState>(() => {
    function remember(next: Quote) {
      setQuote(next);
      sessionStorage.setItem(storageKey, next.id);
    }
    function startNew() {
      setQuote(null);
      sessionStorage.removeItem(storageKey);
    }
    async function signIn(next: Credentials) {
      const client = createApi(next);
      const id = sessionStorage.getItem(storageKey);
      if (id) {
        try {
          remember(await client.get(id));
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 404) throw error;
          startNew();
        }
      } else {
        await client.checkSession();
      }
      setCredentials(next);
    }
    function requireApi() {
      if (!api) throw new Error('Sign in to continue.');
      return api;
    }
    async function savePersonal(data: PersonalInfo) {
      if (
        quote &&
        quote.name === data.name &&
        quote.email === data.email &&
        quote.age === data.age &&
        quote.zipCode === data.zipCode
      )
        return;
      remember(await requireApi().create(data));
    }
    async function saveCoverage(data: CoverageRequest) {
      if (!quote) throw new Error('Enter your personal information first.');
      try {
        remember(await requireApi().coverage(quote.id, data));
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          try {
            remember(await requireApi().get(quote.id));
          } catch {
            /* Preserve the coverage error if reconciliation is unavailable. */
          }
        }
        throw error;
      }
    }
    async function reload() {
      if (quote) remember(await requireApi().get(quote.id));
    }
    async function submit() {
      if (!quote) throw new Error('No quote to submit.');
      try {
        remember(await requireApi().submit(quote.id));
      } catch (error) {
        // An interrupted response can hide a successful commit. Reconcile before offering retry.
        try {
          const latest = await requireApi().get(quote.id);
          remember(latest);
          if (latest.status === 'SUBMITTED') return;
        } catch {
          /* Preserve the original, actionable submission error. */
        }
        throw error;
      }
    }
    return {
      quote,
      signedIn: credentials !== null,
      signIn,
      signOut: () => {
        setCredentials(null);
        setQuote(null);
      },
      savePersonal,
      saveCoverage,
      submit,
      reload,
      startNew,
    };
  }, [api, credentials, quote]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
// Shared by routed steps, keeping the server response as the saved source of truth.
// eslint-disable-next-line react-refresh/only-export-components
export function useQuote() {
  const value = useContext(Context);
  if (!value) throw new Error('QuoteProvider is missing');
  return value;
}
