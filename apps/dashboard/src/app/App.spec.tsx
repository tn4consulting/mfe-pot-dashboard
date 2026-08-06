import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth/core';
import { App } from './App';

jest.mock('./asset-base-url', () => ({ assetBaseUrl: 'http://localhost:4201/' }));
jest.mock('./register-scds', () => ({}));

jest.mock('../runtime-config', () => ({
  loadRuntimeConfig: jest.fn().mockResolvedValue({ dashboardBffBaseUrl: 'http://localhost:3004', strapiBaseUrl: undefined }),
}));

const getPageContentMock = jest.fn();
jest.mock('./content-client', () => ({
  OVERVIEW_CONTENT_KEY: 'dashboard.overview.intro',
  createContentClient: () => ({ getPageContent: getPageContentMock }),
}));

jest.mock('@tn4consulting/shared-federation-runtime', () => ({
  useJobApplicationsWidgetLoader: () => undefined,
  useEiReportingStatusWidgetLoader: () => undefined,
}));

describe('App', () => {
  beforeEach(() => {
    getPageContentMock.mockReset().mockResolvedValue(null);
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;
  });

  afterEach(() => {
    clearSession();
    jest.restoreAllMocks();
  });

  it('renders its feature components when there is an active session', async () => {
    storeSession(createMockSession());
    render(<App />);

    // gcds-heading is an unregistered custom element in this test
    // environment (register-scds is mocked out), so it carries no
    // implicit heading role -- match on its text content instead, same
    // pattern used for scds-card elsewhere in this family's specs.
    expect(await screen.findByText('Hello, Jordan Tremblay')).toBeInTheDocument();
    expect(screen.getByText('Program')).toBeInTheDocument();
  });

  it('renders intro content fetched via ContentClient', async () => {
    storeSession(createMockSession());
    getPageContentMock.mockResolvedValue({
      key: 'dashboard.overview.intro',
      title: 'Welcome to your account',
      body: 'Here is an overview of your benefits, payments, and tasks.',
    });

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Welcome to your account' })).toBeInTheDocument();
  });

  it('blocks its own content when there is no active session, independent of the shell', async () => {
    clearSession();
    render(<App />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('auth.signInRequired');
    expect(screen.queryByText('Payment history')).not.toBeInTheDocument();
  });
});
