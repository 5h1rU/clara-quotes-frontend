import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from './App';
import { QuoteProvider, useQuote } from './QuoteContext';
import type { Quote } from './types';

const credentials = { username: 'reviewer', password: 'password' };
const draft: Quote = {
  id: 'quote-1',
  name: 'Test Person',
  email: 'test@example.com',
  age: 30,
  zipCode: '90210',
  status: 'DRAFT',
  coverageType: null,
  estimatedMonthlyPremium: null,
  hasPreexistingConditions: null,
  conditions: [],
  takesPrescriptionMedication: null,
  usesTobacco: null,
  needsSpouseCoverage: null,
  submittedAt: null,
  createdAt: '2026-09-15T10:00:00Z',
  updatedAt: '2026-09-15T10:00:00Z',
};
const conflict = { code: 'INVALID_STATE', message: 'This quote cannot be changed.' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
afterEach(() => vi.unstubAllGlobals());

it('does not redraw context readers when the provider parent renders without state changes', () => {
  const redraw = vi.fn();
  function Reader() {
    const { signedIn } = useQuote();
    redraw();
    return <span>{signedIn ? 'Signed in' : 'Signed out'}</span>;
  }
  const child = <Reader />;
  const { rerender } = render(<QuoteProvider>{child}</QuoteProvider>);
  rerender(<QuoteProvider>{child}</QuoteProvider>);
  expect(redraw).toHaveBeenCalledTimes(1);
});

it('checks credentials without downloading quotes', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetcher);
  const { result } = renderHook(useQuote, { wrapper: QuoteProvider });
  await act(() => result.current.signIn(credentials));
  expect(result.current.signedIn).toBe(true);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][0]).toMatch(/\/session$/);
});

it.each(['EXPIRED', 'SUBMITTED'] as const)(
  'refreshes a %s quote after a coverage conflict',
  async (status) => {
    sessionStorage.setItem('clara-quote-id', draft.id);
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(json(draft))
      .mockResolvedValueOnce(json(conflict, 409))
      .mockResolvedValueOnce(json({ ...draft, status }));
    vi.stubGlobal('fetch', fetcher);
    const { result } = renderHook(useQuote, { wrapper: QuoteProvider });
    await act(() => result.current.signIn(credentials));
    await act(async () => {
      await expect(result.current.saveCoverage({ coverageType: 'BASIC' })).rejects.toMatchObject({
        status: 409,
      });
    });
    expect(result.current.quote?.status).toBe(status);
    expect(fetcher.mock.calls[2][0]).toMatch(/\/quotes\/quote-1$/);
  },
);

it('preserves the original coverage error when refreshing fails', async () => {
  sessionStorage.setItem('clara-quote-id', draft.id);
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(json(draft))
      .mockResolvedValueOnce(json(conflict, 409))
      .mockRejectedValueOnce(new TypeError('offline')),
  );
  const { result } = renderHook(useQuote, { wrapper: QuoteProvider });
  await act(() => result.current.signIn(credentials));
  await act(async () => {
    await expect(result.current.saveCoverage({ coverageType: 'BASIC' })).rejects.toMatchObject({
      status: 409,
      message: conflict.message,
    });
  });
  expect(result.current.quote?.status).toBe('DRAFT');
});

it('leaves the expired coverage step and lets the user start again', async () => {
  sessionStorage.setItem('clara-quote-id', draft.id);
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(json(draft))
      .mockResolvedValueOnce(json(conflict, 409))
      .mockResolvedValueOnce(json({ ...draft, status: 'EXPIRED' })),
  );
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/coverage']}>
      <QuoteProvider>
        <App />
      </QuoteProvider>
    </MemoryRouter>,
  );
  await user.type(screen.getByLabelText('Username'), credentials.username);
  await user.type(screen.getByLabelText('Password'), credentials.password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  await user.click(await screen.findByRole('button', { name: 'Review quote' }));
  expect(await screen.findByRole('heading', { name: 'This quote has expired.' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Start a new quote' }));
  expect(await screen.findByLabelText('Full name')).toHaveValue('');
  expect(sessionStorage.getItem('clara-quote-id')).toBeNull();
});
