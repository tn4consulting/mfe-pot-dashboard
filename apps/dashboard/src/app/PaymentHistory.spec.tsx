import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth/core';
import { DashboardFeaturePaymentHistory } from './PaymentHistory';

jest.mock('./asset-base-url', () => ({ assetBaseUrl: 'http://localhost:4201/' }));
jest.mock('../runtime-config', () => ({
  loadRuntimeConfig: jest.fn().mockResolvedValue({ dashboardBffBaseUrl: 'http://localhost:3004' }),
}));

describe('DashboardFeaturePaymentHistory', () => {
  afterEach(() => {
    clearSession();
    jest.restoreAllMocks();
  });

  it('renders payments fetched via its own self-configured API client', async () => {
    storeSession(createMockSession());
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: 'pay-1', date: '2026-07-15', benefit: 'EI', program: 'ei', status: 'complete', amount: 638 },
        ]),
    }) as unknown as typeof fetch;

    render(<DashboardFeaturePaymentHistory />);

    expect(await screen.findByText('EI')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText('$638.00')).toBeInTheDocument();
  });

  it('shows an alert when there is no active session', async () => {
    clearSession();
    render(<DashboardFeaturePaymentHistory />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Payment history is temporarily unavailable.');
  });

  it('shows an alert when the BFF call fails', async () => {
    storeSession(createMockSession());
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<DashboardFeaturePaymentHistory />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Payment history is temporarily unavailable.');
  });
});
