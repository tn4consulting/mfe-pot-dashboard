import { PaymentHistoryApiClient } from './payment-history-api-client';
import { Payment } from './models';

/**
 * Calls this app's own BFF (dashboard-bff), which proxies to
 * client-profile-service server-side -- client-profile-service is BFF-only
 * and unreachable directly from the browser (see payment-history-api-client.ts).
 */
export class HttpPaymentHistoryApiClient implements PaymentHistoryApiClient {
  constructor(private readonly baseUrl: string) {}

  async getPayments(sub: string): Promise<Payment[]> {
    const url = new URL(`${this.baseUrl}/api/payments`);
    url.searchParams.set('sub', sub);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`dashboard-bff returned ${response.status} for /api/payments`);
    }
    return (await response.json()) as Payment[];
  }
}
