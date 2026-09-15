import { afterEach, it, expect, vi } from 'vitest';
import { createApi } from './api';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it('sends runtime authentication and preserves backend field errors', async () => {
  const fetcher = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        code: 'VALIDATION_ERROR',
        message: 'Invalid data',
        fieldErrors: { age: 'Too young' },
      }),
      { status: 400 },
    ),
  );
  vi.stubGlobal('fetch', fetcher);
  await expect(
    createApi({ username: 'reviewer', password: 'password' }).list(),
  ).rejects.toMatchObject({ status: 400, fieldErrors: { age: 'Too young' } });
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Basic cmV2aWV3ZXI6cGFzc3dvcmQ=');
});
it('turns an offline service into an actionable error', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
  await expect(createApi({ username: 'x', password: 'y' }).list()).rejects.toMatchObject({
    code: 'NETWORK_ERROR',
    status: 0,
  });
});
it('preserves the HTTP status when an error response is not JSON', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Unavailable', { status: 503 })));
  await expect(createApi({ username: 'x', password: 'y' }).list()).rejects.toMatchObject({
    code: 'HTTP_ERROR',
    status: 503,
  });
});
it('reads successful JSON and accepts an empty session response', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 })),
  );
  const api = createApi({ username: 'x', password: 'y' });
  await expect(api.list()).resolves.toEqual([]);
  await expect(api.checkSession()).resolves.toBeNull();
});
