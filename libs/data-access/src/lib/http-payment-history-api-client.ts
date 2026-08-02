import { PaymentHistoryApiClient } from './payment-history-api-client';
import { Payment } from './models';

/** Local dev / integration tests: calls the real client-profile-service over HTTP. */
export class HttpPaymentHistoryApiClient implements PaymentHistoryApiClient {
  constructor(private readonly baseUrl: string) {}

  async getPayments(sub: string): Promise<Payment[]> {
    const response = await fetch(`${this.baseUrl}/api/profile/${encodeURIComponent(sub)}/payments`);
    if (!response.ok) {
      throw new Error(`client-profile-service returned ${response.status} for /payments`);
    }
    return (await response.json()) as Payment[];
  }
}
