import { BenefitOverviewApiClient } from './benefit-overview-api-client';
import { BenefitOverview } from './models';

/** Local dev / integration tests: calls the real benefit-aggregation-bff over HTTP. */
export class HttpBenefitOverviewApiClient implements BenefitOverviewApiClient {
  constructor(private readonly baseUrl: string) {}

  async getOverview(sub: string): Promise<BenefitOverview> {
    const url = new URL(`${this.baseUrl}/api/overview`);
    url.searchParams.set('sub', sub);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`benefit-aggregation-bff returned ${response.status} for /api/overview`);
    }
    return (await response.json()) as BenefitOverview;
  }
}
