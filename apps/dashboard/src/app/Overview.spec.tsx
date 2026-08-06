import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth/core';
import { Overview } from './Overview';

jest.mock('./register-scds', () => ({}));

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
  });

  afterEach(() => clearSession());

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
