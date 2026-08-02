import { getPayments } from './payments';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('getPayments', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns payments from client-profile-service', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse([{ id: 'pay-1', date: '2026-07-15', benefit: 'EI', amount: 638 }]),
    ) as unknown as typeof fetch;

    const payments = await getPayments('mock-citizen-001');

    expect(payments).toEqual([{ id: 'pay-1', date: '2026-07-15', benefit: 'EI', amount: 638 }]);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3003/api/profile/mock-citizen-001/payments',
    );
  });

  it('throws when client-profile-service fails', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({}, 500)) as unknown as typeof fetch;
    await expect(getPayments('mock-citizen-001')).rejects.toThrow('500');
  });
});
