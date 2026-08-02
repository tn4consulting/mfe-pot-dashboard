import { HttpBenefitOverviewApiClient } from './http-benefit-overview-api-client';

describe('HttpBenefitOverviewApiClient', () => {
  const originalFetch = global.fetch;
  const client = new HttpBenefitOverviewApiClient('http://localhost:3004');

  afterEach(() => {
    global.fetch = originalFetch;
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

  it('throws when the aggregation service fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    await expect(client.getOverview('mock-citizen-001')).rejects.toThrow('500');
  });
});
