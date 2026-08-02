import { HttpPaymentHistoryApiClient } from './http-payment-history-api-client';

describe('HttpPaymentHistoryApiClient', () => {
  const originalFetch = global.fetch;
  const client = new HttpPaymentHistoryApiClient('http://localhost:3004');

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches payments for a given sub', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'pay-1', date: '2026-07-15', benefit: 'EI', amount: 638 }],
    }) as unknown as typeof fetch;

    const payments = await client.getPayments('mock-citizen-001');
    expect(payments).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      new URL('http://localhost:3004/api/payments?sub=mock-citizen-001'),
    );
  });

  it('throws when dashboard-bff fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    await expect(client.getPayments('mock-citizen-001')).rejects.toThrow('500');
  });
});
