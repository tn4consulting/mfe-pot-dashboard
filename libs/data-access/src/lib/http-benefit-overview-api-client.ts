import { getAccessToken } from '@tn4consulting/shared-auth';
import { BenefitOverviewApiClient } from './benefit-overview-api-client';
import { BenefitOverview } from './models';

/** Local dev / integration tests: calls the real dashboard-bff over HTTP. */
export class HttpBenefitOverviewApiClient implements BenefitOverviewApiClient {
  constructor(private readonly baseUrl: string) {}

  async getOverview(sub: string): Promise<BenefitOverview> {
    const url = new URL(`${this.baseUrl}/api/overview`);
    url.searchParams.set('sub', sub);
    // Attaches the mock-idp-issued bearer token (if signed in) so
    // dashboard-bff can independently verify it -- see mfe-pot's plan doc.
    const token = getAccessToken();
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (!response.ok) {
      throw new Error(`dashboard-bff returned ${response.status} for /api/overview`);
    }
    return (await response.json()) as BenefitOverview;
  }
}
