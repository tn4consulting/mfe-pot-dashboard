import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@tn4consulting/shared-i18n';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth';
import {
  BENEFIT_OVERVIEW_API_CLIENT,
  BenefitOverview,
  BenefitOverviewApiClient,
  PAYMENT_HISTORY_API_CLIENT,
  PaymentHistoryApiClient,
} from 'dashboard-data-access';
import { App } from './app';

const emptyOverview: BenefitOverview = {
  eligibleBenefits: { status: 'ok', data: [] },
  activeApplications: { status: 'ok', data: [] },
  tasks: { status: 'ok', data: [] },
  payments: { status: 'ok', data: [] },
  correspondence: { status: 'ok', data: [] },
};

describe('App', () => {
  const originalFetch = global.fetch;
  const benefitOverviewApiClient: jest.Mocked<BenefitOverviewApiClient> = {
    getOverview: jest.fn().mockResolvedValue(emptyOverview),
  };
  const paymentHistoryApiClient: jest.Mocked<PaymentHistoryApiClient> = {
    getPayments: jest.fn().mockResolvedValue([]),
  };

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    clearSession();
  });

  beforeEach(async () => {
    storeSession(createMockSession());
    benefitOverviewApiClient.getOverview.mockResolvedValue(emptyOverview);
    paymentHistoryApiClient.getPayments.mockResolvedValue([]);
    await TestBed.configureTestingModule({
      imports: [
        App,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              chrome: { heading: 'MSCA-D — Dashboard (federated remote)' },
              auth: { signInRequired: 'You need to sign in to view your dashboard.' },
            },
            fr: {
              chrome: { heading: 'MSCA-D — Tableau de bord (module distant)' },
              auth: { signInRequired: 'Vous devez ouvrir une session.' },
            },
          },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideRouter([]),
        { provide: BENEFIT_OVERVIEW_API_CLIENT, useValue: benefitOverviewApiClient },
        { provide: PAYMENT_HISTORY_API_CLIENT, useValue: paymentHistoryApiClient },
      ],
    }).compileComponents();
  });

  it('should render the dashboard heading', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    }) as unknown as typeof fetch;

    const fixture = TestBed.createComponent(App);
    // Zoneless `whenStable()` doesn't track a plain fetch() promise chain
    // (it isn't a signal/effect and doesn't register as a pending task), so
    // await the component's own async lifecycle hook directly, then force a
    // render pass.
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('MSCA-D');
  });

  it('renders overview content fetched via ContentClient', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 1,
            key: 'dashboard.overview.intro',
            title: 'Welcome to your account',
            body: 'Here is an overview of your benefits, payments, and tasks.',
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const fixture = TestBed.createComponent(App);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain(
      'Welcome to your account',
    );
  });

  it('shows an error state when content fails to load', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const fixture = TestBed.createComponent(App);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain(
      'temporarily unavailable',
    );
  });

  it('renders active applications from the benefit-aggregation-bff overview', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    }) as unknown as typeof fetch;
    benefitOverviewApiClient.getOverview.mockResolvedValue({
      ...emptyOverview,
      activeApplications: {
        status: 'ok',
        data: [{ type: 'job', id: 'app-1', summary: 'Application for job-001', status: 'submitted' }],
      },
    });

    const fixture = TestBed.createComponent(App);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Application for job-001');
  });

  it('degrades only the active-applications tile when that part of the overview is unavailable', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    }) as unknown as typeof fetch;
    benefitOverviewApiClient.getOverview.mockResolvedValue({
      ...emptyOverview,
      activeApplications: { status: 'unavailable' },
    });

    const fixture = TestBed.createComponent(App);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#active-applications-heading')).not.toBeNull();
    expect(compiled.textContent).toContain('Active applications are temporarily unavailable');
    // The rest of the page is unaffected by that one tile degrading.
    expect(compiled.querySelector('#tasks-heading')).not.toBeNull();
  });

  it('blocks its own content when there is no active session, independent of the shell', async () => {
    clearSession();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    }) as unknown as typeof fetch;

    const fixture = TestBed.createComponent(App);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')).toBeNull();
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('sign in');
  });
});
