import { clearSession, storeSession } from '@tn4consulting/shared-auth/core';
import { HttpPaymentHistoryApiClient } from './http-payment-history-api-client';

describe('HttpPaymentHistoryApiClient', () => {
  const originalFetch = global.fetch;
  const client = new HttpPaymentHistoryApiClient('http://localhost:3004');

  afterEach(() => {
    global.fetch = originalFetch;
    clearSession();
  });

  it('fetches payments for a given sub with no Authorization header when signed out', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'pay-1', date: '2026-07-15', benefit: 'EI', amount: 638 }],
    }) as unknown as typeof fetch;

    const payments = await client.getPayments('mock-citizen-001');
    expect(payments).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      new URL('http://localhost:3004/api/payments?sub=mock-citizen-001'),
      { headers: undefined },
    );
  });

  it('attaches the mock-idp access token as a Bearer header when signed in', async () => {
    storeSession({
      sub: 'citizen-abc123',
      name: 'Alex Chen',
      claims: [],
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      accessToken: 'real-looking.jwt.value',
    });
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock as unknown as typeof fetch;

    await client.getPayments('citizen-abc123');

    expect(fetchMock.mock.calls[0][1]).toEqual({ headers: { Authorization: 'Bearer real-looking.jwt.value' } });
  });

  it('throws when dashboard-bff fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    await expect(client.getPayments('mock-citizen-001')).rejects.toThrow('500');
  });
});
