import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth/core';
import { Overview } from './Overview';

jest.mock('./register-scds', () => ({}));
jest.mock('./asset-base-url', () => ({ assetBaseUrl: 'http://localhost:4201/' }));

// Overview now renders DashboardFeaturePaymentHistory (the "Payments
// Activity" widget) directly, alongside NeedsAttentionList, matching the
// two-column layout in docs/msca-screenshots/dashboard.png -- same
// runtime-config/content-client/fetch mocking PaymentHistory.spec.tsx and
// App.spec.tsx already need for that widget.
jest.mock('../runtime-config', () => ({
  loadRuntimeConfig: jest.fn().mockResolvedValue({ dashboardBffBaseUrl: 'http://localhost:3004', strapiBaseUrl: undefined }),
}));

const getPageContentsMock = jest.fn().mockResolvedValue({
  'dashboard.payment-history.heading': { title: 'Payments Activity', body: '' },
  'dashboard.payment-history.table.program': { title: 'Program', body: '' },
  'dashboard.payment-history.table.status': { title: 'Status', body: '' },
  'dashboard.payment-history.table.date': { title: 'Date', body: '' },
  'dashboard.payment-history.table.amount': { title: 'Amount', body: '' },
  'dashboard.payment-history.status.complete': { title: 'Complete', body: '' },
  'dashboard.payment-history.status.pending': { title: 'Pending', body: '' },
  'dashboard.payment-history.error': { title: 'Payment history is temporarily unavailable.', body: '' },
});
jest.mock('./content-client', () => ({
  PAYMENT_HISTORY_CONTENT_KEYS: [
    'dashboard.payment-history.heading',
    'dashboard.payment-history.table.program',
    'dashboard.payment-history.table.status',
    'dashboard.payment-history.table.date',
    'dashboard.payment-history.table.amount',
    'dashboard.payment-history.status.complete',
    'dashboard.payment-history.status.pending',
    'dashboard.payment-history.error',
  ],
  createContentClient: () => ({ getPageContents: getPageContentsMock }),
}));

const useJobApplicationsWidgetLoaderMock = jest.fn();
const useEiReportingStatusWidgetLoaderMock = jest.fn();
jest.mock('@tn4consulting/shared-federation-runtime', () => ({
  useJobApplicationsWidgetLoader: () => useJobApplicationsWidgetLoaderMock(),
  useEiReportingStatusWidgetLoader: () => useEiReportingStatusWidgetLoaderMock(),
}));

function JobApplicationsWidgetStub() {
  return <p>Job applications widget content</p>;
}

describe('Overview', () => {
  beforeEach(() => {
    useJobApplicationsWidgetLoaderMock.mockReset().mockReturnValue(undefined);
    useEiReportingStatusWidgetLoaderMock.mockReset().mockReturnValue(undefined);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }) as unknown as typeof fetch;
  });

  afterEach(() => {
    clearSession();
    jest.restoreAllMocks();
  });

  it('greets the signed-in citizen by name', () => {
    storeSession(createMockSession());
    render(<Overview benefitOverview={null} />);

    expect(screen.getByText('Hello, Jordan Tremblay')).toBeInTheDocument();
  });

  it('renders the job applications widget once its loader resolves', async () => {
    storeSession(createMockSession());
    useJobApplicationsWidgetLoaderMock.mockReturnValue(async () => ({ component: JobApplicationsWidgetStub }));

    render(<Overview benefitOverview={null} />);

    expect(await screen.findByText('Job applications widget content')).toBeInTheDocument();
  });

  it('shows an alert for each widget when no loader is provided (no shell running)', async () => {
    storeSession(createMockSession());
    render(<Overview benefitOverview={null} />);

    expect(await screen.findByText('Job applications are temporarily unavailable.')).toBeInTheDocument();
    expect(screen.getByText('EI reporting status is temporarily unavailable.')).toBeInTheDocument();
  });
});
