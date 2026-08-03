import { getBenefitOverview } from './overview';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('getBenefitOverview', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('composes a full overview when every upstream succeeds', async () => {
    global.fetch = jest.fn(async (url: string | URL | Request) => {
      const href = url.toString();
      if (href.includes('/api/applications')) {
        return jsonResponse([
          { id: 'app-1', jobId: 'job-001', status: 'submitted', jobTitle: 'Warehouse Associate', employer: 'Northgate Logistics' },
        ]);
      }
      if (href.includes('/api/reporting-status')) {
        return jsonResponse({
          claimId: 'claim-1',
          nextReportDue: '2026-07-22T00:00:00.000Z',
          daysUntilDue: 7,
          status: 'not_yet_due',
        });
      }
      if (href.includes('/api/claims')) {
        return jsonResponse({ id: 'claim-1', status: 'approved', weeklyBenefitAmount: 638 });
      }
      if (href.includes('/payments')) {
        return jsonResponse([{ id: 'pay-1', date: '2026-07-15', benefit: 'EI', program: 'EI', status: 'pending', amount: 638 }]);
      }
      if (href.includes('/correspondence')) {
        return jsonResponse([{ id: 'corr-1', date: '2026-07-10', subject: 'Approved' }]);
      }
      throw new Error(`Unexpected URL in test: ${href}`);
    }) as unknown as typeof fetch;

    const overview = await getBenefitOverview('mock-citizen-001');

    expect(overview.eligibleBenefits.status).toBe('ok');
    expect(overview.activeApplications).toEqual({
      status: 'ok',
      data: [
        { type: 'job', id: 'app-1', summary: 'Application for job-001', status: 'submitted' },
        { type: 'ei', id: 'claim-1', summary: 'Employment Insurance claim', status: 'approved' },
      ],
    });
    expect(overview.tasks).toEqual({ status: 'ok', data: ['Submit your next EI report'] });
    expect(overview.payments.status).toBe('ok');
    expect(overview.correspondence.status).toBe('ok');
    expect(overview.eiReportingStatus).toEqual({
      status: 'ok',
      data: {
        claimId: 'claim-1',
        nextReportDue: '2026-07-22T00:00:00.000Z',
        daysUntilDue: 7,
        status: 'not_yet_due',
      },
    });
    expect(overview.jobApplications).toEqual({
      status: 'ok',
      data: [
        {
          id: 'app-1',
          jobId: 'job-001',
          status: 'submitted',
          jobTitle: 'Warehouse Associate',
          employer: 'Northgate Logistics',
        },
      ],
    });
  });

  it('treats "no EI claim on file" (404) as a legitimate empty state, not a failure', async () => {
    global.fetch = jest.fn(async (url: string | URL | Request) => {
      const href = url.toString();
      if (href.includes('/api/claims') || href.includes('/api/reporting-status')) {
        return jsonResponse({ error: 'not found' }, 404);
      }
      if (href.includes('/api/applications')) {
        return jsonResponse([]);
      }
      return jsonResponse([]);
    }) as unknown as typeof fetch;

    const overview = await getBenefitOverview('mock-citizen-001');

    expect(overview.activeApplications).toEqual({ status: 'ok', data: [] });
    expect(overview.tasks).toEqual({
      status: 'ok',
      data: ['Consider applying for Employment Insurance'],
    });
    expect(overview.eiReportingStatus).toEqual({ status: 'ok', data: null });
  });

  it('produces a due-soon/overdue task message driven by real reporting status', async () => {
    global.fetch = jest.fn(async (url: string | URL | Request) => {
      const href = url.toString();
      if (href.includes('/api/reporting-status')) {
        return jsonResponse({
          claimId: 'claim-1',
          nextReportDue: '2026-07-16T00:00:00.000Z',
          daysUntilDue: -1,
          status: 'overdue',
        });
      }
      if (href.includes('/api/claims')) {
        return jsonResponse({ id: 'claim-1', status: 'approved', weeklyBenefitAmount: 638 });
      }
      return jsonResponse([]);
    }) as unknown as typeof fetch;

    const overview = await getBenefitOverview('mock-citizen-001');

    expect(overview.tasks).toEqual({
      status: 'ok',
      data: ['Your EI report is overdue — submit it as soon as possible'],
    });
  });

  it('degrades only the affected tile when client-profile-service is unreachable', async () => {
    global.fetch = jest.fn(async (url: string | URL | Request) => {
      const href = url.toString();
      if (href.includes('/payments') || href.includes('/correspondence')) {
        throw new Error('connection refused');
      }
      if (href.includes('/api/claims') || href.includes('/api/reporting-status')) {
        return jsonResponse({ error: 'not found' }, 404);
      }
      return jsonResponse([]);
    }) as unknown as typeof fetch;

    const overview = await getBenefitOverview('mock-citizen-001');

    expect(overview.payments).toEqual({ status: 'unavailable' });
    expect(overview.correspondence).toEqual({ status: 'unavailable' });
    // The rest of the response is unaffected -- this is the whole point of
    // the partial-failure contract.
    expect(overview.eligibleBenefits.status).toBe('ok');
    expect(overview.activeApplications.status).toBe('ok');
    expect(overview.tasks.status).toBe('ok');
  });

  it('marks activeApplications unavailable when job-bank-bff fails, without affecting other tiles', async () => {
    global.fetch = jest.fn(async (url: string | URL | Request) => {
      const href = url.toString();
      if (href.includes('/api/applications')) {
        throw new Error('connection refused');
      }
      if (href.includes('/api/claims') || href.includes('/api/reporting-status')) {
        return jsonResponse({ error: 'not found' }, 404);
      }
      return jsonResponse([]);
    }) as unknown as typeof fetch;

    const overview = await getBenefitOverview('mock-citizen-001');

    expect(overview.activeApplications).toEqual({ status: 'unavailable' });
    expect(overview.jobApplications).toEqual({ status: 'unavailable' });
    expect(overview.payments.status).toBe('ok');
    expect(overview.correspondence.status).toBe('ok');
  });

  it('marks eiReportingStatus unavailable when employment-insurance-bff fails', async () => {
    global.fetch = jest.fn(async (url: string | URL | Request) => {
      const href = url.toString();
      if (href.includes('/api/reporting-status')) {
        throw new Error('connection refused');
      }
      if (href.includes('/api/claims')) {
        return jsonResponse({ id: 'claim-1', status: 'approved', weeklyBenefitAmount: 638 });
      }
      return jsonResponse([]);
    }) as unknown as typeof fetch;

    const overview = await getBenefitOverview('mock-citizen-001');

    expect(overview.eiReportingStatus).toEqual({ status: 'unavailable' });
    expect(overview.tasks).toEqual({ status: 'ok', data: ['Submit your next EI report'] });
  });
});
