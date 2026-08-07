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
  'dashboard.payment-history.table.actions': { title: 'Actions', body: '' },
  'dashboard.payment-history.table.actions-label': { title: 'Actions', body: '' },
  'dashboard.payment-history.status.complete': { title: 'Complete', body: '' },
  'dashboard.payment-history.status.pending': { title: 'Pending', body: '' },
  'dashboard.payment-history.error': { title: 'Payment history is temporarily unavailable.', body: '' },
  'dashboard.payment-history.view-all': { title: 'View payment history', body: '' },
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

    const { container } = render(<DashboardFeaturePaymentHistory />);

    expect(await screen.findByText('EI')).toBeInTheDocument();
    // scds-badge is an unregistered custom element in this test
    // environment -- its `label`/`tone` props land as plain attributes
    // (no shadow DOM to render `label` as visible text), same pattern used
    // for scds-card/scds-notice elsewhere in this family's specs.
    const badge = container.querySelector('scds-badge');
    expect(badge?.getAttribute('label')).toBe('Complete');
    expect(badge?.getAttribute('tone')).toBe('success');
    expect(screen.getByText('$638.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions — EI' })).toBeInTheDocument();
    // scds-link is an unregistered custom element in this test
    // environment -- same reasoning as scds-badge above, its slotted text
    // is still real visible content though.
    expect(screen.getByText('View payment history')).toBeInTheDocument();
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
