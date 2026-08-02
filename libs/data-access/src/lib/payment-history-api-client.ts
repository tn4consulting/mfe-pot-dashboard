import { InjectionToken } from '@angular/core';
import { Payment } from './models';

/**
 * client-profile-service is the single source of truth for payment history
 * (see CLAUDE.md's "Backends: BFF pattern" section) -- the payment-history
 * widget (embedded live in employment-life-events, and shown on dashboard's
 * own overview) calls it directly rather than duplicating the data as
 * in-memory state.
 */
export interface PaymentHistoryApiClient {
  getPayments(sub: string): Promise<Payment[]>;
}

export const PAYMENT_HISTORY_API_CLIENT = new InjectionToken<PaymentHistoryApiClient>(
  'PAYMENT_HISTORY_API_CLIENT',
);
