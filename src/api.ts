import type { CoverageRequest, Credentials, PersonalInfo, Quote } from './types';
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}
const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
export function createApi(credentials: Credentials) {
  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 12000);
    try {
      const bytes = new TextEncoder().encode(`${credentials.username}:${credentials.password}`);
      const authorization = `Basic ${btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))}`;
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json', Authorization: authorization },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new ApiError(
          body?.message ?? 'The request could not be completed.',
          response.status,
          body?.code ?? 'HTTP_ERROR',
          body?.fieldErrors ?? {},
        );
      }
      return (await response.json().catch(() => null)) as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        controller.signal.aborted
          ? 'The request timed out. Your quote may have been saved; reload before trying again.'
          : 'Cannot reach the quote service. Check your connection and try again.',
        0,
        controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR',
      );
    } finally {
      window.clearTimeout(timer);
    }
  }
  return {
    checkSession: () => request<void>('/session'),
    list: () => request<Quote[]>('/quotes'),
    get: (id: string) => request<Quote>(`/quotes/${id}`),
    create: (data: PersonalInfo) =>
      request<Quote>('/quotes', { method: 'POST', body: JSON.stringify(data) }),
    coverage: (id: string, data: CoverageRequest) =>
      request<Quote>(`/quotes/${id}/coverage`, { method: 'PATCH', body: JSON.stringify(data) }),
    submit: (id: string) => request<Quote>(`/quotes/${id}/submit`, { method: 'POST' }),
  };
}
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
