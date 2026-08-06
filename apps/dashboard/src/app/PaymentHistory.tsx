// See App.tsx's own comment on this same import -- required for the
// classic JSX transform this app's tsconfig uses.
import * as React from 'react';
import { useEffect, useState } from 'react';
import { getStoredSession } from '@tn4consulting/shared-auth/core';
import type { Payment, PaymentHistoryApiClient } from 'dashboard-data-access';
import { HttpPaymentHistoryApiClient } from 'dashboard-data-access';
import { loadRuntimeConfig } from '../runtime-config';
import { assetBaseUrl } from './asset-base-url';

/**
 * Exposed as `./PaymentHistoryWidget` for employment-life-events to embed,
 * and also rendered inline on dashboard's own overview -- either way it's
 * fully self-configuring (fetches its own runtime config, builds its own
 * API client), since there's no host-provided REMOTE_PROVIDERS equivalent
 * for a React remote to receive. Exported under this exact name --
 * `DashboardFeaturePaymentHistory` -- because mfe-pot-shell's routes.tsx
 * already resolves the widget module by this name.
 */
export function DashboardFeaturePaymentHistory() {
  const [apiClient, setApiClient] = useState<PaymentHistoryApiClient | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadRuntimeConfig(assetBaseUrl).then((runtimeConfig) => {
      if (!cancelled) {
        setApiClient(new HttpPaymentHistoryApiClient(runtimeConfig.dashboardBffBaseUrl));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!apiClient) {
      return;
    }
    const session = getStoredSession();
    if (!session) {
      setLoadError(true);
      return;
    }
    let cancelled = false;
    apiClient
      .getPayments(session.sub)
      .then((result) => {
        if (!cancelled) {
          setPayments(result);
        }
      })
      .catch((err) => {
        console.error('Failed to load payment history', err);
        if (!cancelled) {
          setLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient]);

  return (
    <section className="payment-history-widget">
      <gcds-heading tag="h2">Payment history</gcds-heading>
      {loadError ? (
        <p role="alert">Payment history is temporarily unavailable.</p>
      ) : (
        <table>
          <caption className="visually-hidden">Payment history</caption>
          <thead>
            <tr>
              <th scope="col">Program</th>
              <th scope="col">Status</th>
              <th scope="col">Date</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.benefit}</td>
                <td>
                  <span className={`status-pill${payment.status === 'complete' ? ' status-pill--complete' : ''}`}>
                    {payment.status === 'complete' ? 'Complete' : 'Pending'}
                  </span>
                </td>
                <td>{payment.date}</td>
                <td>${payment.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
