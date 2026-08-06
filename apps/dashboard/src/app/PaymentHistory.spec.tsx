import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth/core';
import { DashboardFeaturePaymentHistory } from './PaymentHistory';

jest.mock('./asset-base-url', () => ({ assetBaseUrl: 'http://localhost:4201/' }));
jest.mock('../runtime-config', () => ({
  loadRuntimeConfig: jest.fn().mockResolvedValue({ dashboardBffBaseUrl: 'http://localhost:3004' }),
}));

// No strapiBaseUrl configured above, so content comes from the real
// StaticContentClient's fetched fallback (content-client.ts) -- mock that
// fetch alongside whatever URL the current test also needs for /api/payments.
const FALLBACK_EN = {
  'dashboard.payment-history.heading': { title: 'Payment history', body: '' },
  'dashboard.payment-history.table.program': { title: 'Program', body: '' },
  'dashboard.payment-history.table.status': { title: 'Status', body: '' },
  'dashboard.payment-history.table.date': { title: 'Date', body: '' },
  'dashboard.payment-history.table.amount': { title: 'Amount', body: '' },
  'dashboard.payment-history.status.complete': { title: 'Complete', body: '' },
  'dashboard.payment-history.status.pending': { title: 'Pending', body: '' },
  'dashboard.payment-history.error': { title: 'Payment history is temporarily unavailable.', body: '' },
};

function mockFetch(paymentsResponse: () => Promise<Response>) {
  global.fetch = jest.fn((url: RequestInfo | URL) => {
    if (url.toString().includes('content-fallback')) {
      return Promise.resolve({ json: () => Promise.resolve(FALLBACK_EN) } as Response);
    }
    return paymentsResponse();
  }) as unknown as typeof fetch;
}

describe('DashboardFeaturePaymentHistory', () => {
  afterEach(() => {
    clearSession();
    jest.restoreAllMocks();
  });

  it('renders payments fetched via its own self-configured API client', async () => {
    storeSession(createMockSession());
    mockFetch(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 'pay-1', date: '2026-07-15', benefit: 'EI', program: 'ei', status: 'complete', amount: 638 },
          ]),
      } as Response),
    );

    render(<DashboardFeaturePaymentHistory />);

    expect(await screen.findByText('EI')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText('$638.00')).toBeInTheDocument();
  });

  it('shows an alert when there is no active session', async () => {
    clearSession();
    mockFetch(() => Promise.reject(new Error('should not be called without a session')));

    render(<DashboardFeaturePaymentHistory />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Payment history is temporarily unavailable.');
  });

  it('shows an alert when the BFF call fails', async () => {
    storeSession(createMockSession());
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockFetch(() => Promise.resolve({ ok: false, status: 500 } as Response));

    render(<DashboardFeaturePaymentHistory />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Payment history is temporarily unavailable.');
  });
});
