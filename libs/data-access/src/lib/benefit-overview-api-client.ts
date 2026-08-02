import { InjectionToken } from '@angular/core';
import { BenefitOverview } from './models';

/**
 * MSCA-D's cross-benefit overview -- backed by benefit-aggregation-bff,
 * which itself composes job-bank-bff, employment-insurance-bff, and
 * client-profile-service over HTTP with a partial-failure contract (see
 * CLAUDE.md's "Backends: BFF pattern" section). This app renders each tile
 * independently based on its own `UpstreamResult` status, so one degraded
 * tile never blocks the rest of the overview from rendering.
 */
export interface BenefitOverviewApiClient {
  getOverview(sub: string): Promise<BenefitOverview>;
}

export const BENEFIT_OVERVIEW_API_CLIENT = new InjectionToken<BenefitOverviewApiClient>(
  'BENEFIT_OVERVIEW_API_CLIENT',
);
