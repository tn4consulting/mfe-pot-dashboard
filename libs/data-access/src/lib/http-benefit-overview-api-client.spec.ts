import { clearSession, storeSession } from '@tn4consulting/shared-auth/core';
import { HttpBenefitOverviewApiClient } from './http-benefit-overview-api-client';

describe('HttpBenefitOverviewApiClient', () => {
  const originalFetch = global.fetch;
  const client = new HttpBenefitOverviewApiClient('http://localhost:3004');

  afterEach(() => {
    global.fetch = originalFetch;
    clearSession();
  });

  it('fetches the overview for a given sub', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ eligibleBenefits: { status: 'ok', data: [] } }),
    }) as unknown as typeof fetch;

    const overview = await client.getOverview('mock-citizen-001');
    expect(overview.eligibleBenefits).toEqual({ status: 'ok', data: [] });
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(calledUrl.toString()).toBe('http://localhost:3004/api/overview?sub=mock-citizen-001');
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
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ eligibleBenefits: null }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    await client.getOverview('citizen-abc123');

    expect(fetchMock.mock.calls[0][1]).toEqual({ headers: { Authorization: 'Bearer real-looking.jwt.value' } });
  });

  it('throws when the aggregation service fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    await expect(client.getOverview('mock-citizen-001')).rejects.toThrow('500');
  });
});
