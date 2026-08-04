import { getAccessToken } from '@tn4consulting/shared-auth';
import { PaymentHistoryApiClient } from './payment-history-api-client';
import { Payment } from './models';

/**
 * Calls this app's own BFF (dashboard-bff), which serves payment history
 * from its own local data (see payment-history-api-client.ts).
 */
export class HttpPaymentHistoryApiClient implements PaymentHistoryApiClient {
  constructor(private readonly baseUrl: string) {}

  async getPayments(sub: string): Promise<Payment[]> {
    const url = new URL(`${this.baseUrl}/api/payments`);
    url.searchParams.set('sub', sub);
    // Attaches the mock-idp-issued bearer token (if signed in) so
    // dashboard-bff can independently verify it -- see mfe-pot's plan doc.
    const token = getAccessToken();
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (!response.ok) {
      throw new Error(`dashboard-bff returned ${response.status} for /api/payments`);
    }
    return (await response.json()) as Payment[];
  }
}
