import { TestBed } from '@angular/core/testing';
import { TranslocoService, TranslocoTestingModule } from '@tn4consulting/shared-i18n';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth';
import { BenefitOverview } from 'dashboard-data-access';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DashboardFeatureOverview } from './dashboard-feature-overview';

expect.extend(toHaveNoViolations);

function fullOverview(overrides: Partial<BenefitOverview> = {}): BenefitOverview {
  return {
    eligibleBenefits: { status: 'ok', data: ['Employment Insurance', 'Job Bank'] },
    activeApplications: { status: 'ok', data: [] },
    tasks: { status: 'ok', data: ['Submit your next EI report'] },
    payments: { status: 'ok', data: [] },
    correspondence: { status: 'ok', data: [] },
    eiReportingStatus: {
      status: 'ok',
      data: {
        claimId: 'claim-1',
        nextReportDue: '2026-07-22T00:00:00.000Z',
        daysUntilDue: 7,
        status: 'not_yet_due',
      },
    },
    jobApplications: {
      status: 'ok',
      data: [
        {
          id: 'app-1',
          jobId: 'job-001',
          status: 'submitted',
          submittedAt: '2026-07-20T00:00:00.000Z',
          jobTitle: 'Warehouse Associate',
          employer: 'Northgate Logistics',
        },
      ],
    },
    ...overrides,
  };
}

describe('DashboardFeatureOverview', () => {
  afterEach(() => clearSession());

  async function setup() {
    await TestBed.configureTestingModule({
      imports: [
        DashboardFeatureOverview,
        TranslocoTestingModule.forRoot({ langs: { en: {}, fr: {} }, translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' } }),
      ],
    }).compileComponents();
  }

  it('renders the mock What\'s New, Needs Attention, and Consider This sections', async () => {
    storeSession(createMockSession());
    await setup();

    const fixture = TestBed.createComponent(DashboardFeatureOverview);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    // GCDS's Stencil web components don't hydrate their shadow DOM under
    // jsdom/jest, so only *slotted* (light-DOM) content is observable here
    // -- title/description props rendered purely inside shadow DOM (like
    // gcds-notice's noticeTitle) are invisible to this assertion.
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Your weekly EI benefit amount has been recalculated');
    expect(text).toContain('Add a second sign-in method');
    expect(text).toContain('Based on your profile, you may be eligible for CDCP');
  });

  it('renders the real My Tasks, EI Reporting Status, and My Job Applications sections', async () => {
    storeSession(createMockSession());
    await setup();

    const fixture = TestBed.createComponent(DashboardFeatureOverview);
    fixture.componentInstance.benefitOverview = fullOverview();
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Submit your next EI report');
    expect(text).toContain('Not yet due');
    expect(text).toContain('Warehouse Associate');
    expect(text).toContain('Northgate Logistics');
  });

  it('shows "no active EI claim" when eiReportingStatus resolves to null', async () => {
    storeSession(createMockSession());
    await setup();

    const fixture = TestBed.createComponent(DashboardFeatureOverview);
    fixture.componentInstance.benefitOverview = fullOverview({
      eiReportingStatus: { status: 'ok', data: null },
    });
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No active EI claim on file.');
  });

  it('shows a degraded message per tile when a tile is unavailable', async () => {
    storeSession(createMockSession());
    await setup();

    const fixture = TestBed.createComponent(DashboardFeatureOverview);
    fixture.componentInstance.benefitOverview = fullOverview({
      eiReportingStatus: { status: 'unavailable' },
      jobApplications: { status: 'unavailable' },
    });
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const alerts = Array.from(compiled.querySelectorAll('[role="alert"]')).map((el) => el.textContent);
    expect(alerts.some((text) => text?.includes('EI reporting status'))).toBe(true);
    expect(alerts.some((text) => text?.includes('Job applications'))).toBe(true);
  });

  it('re-renders mock content in French when the active language changes', async () => {
    storeSession(createMockSession());
    await setup();

    const fixture = TestBed.createComponent(DashboardFeatureOverview);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    TestBed.inject(TranslocoService).setActiveLang('fr');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('a été recalculé selon votre dernier rapport');
  });

  it('has no detectable accessibility violations', async () => {
    storeSession(createMockSession());
    await setup();

    const fixture = TestBed.createComponent(DashboardFeatureOverview);
    fixture.componentInstance.benefitOverview = fullOverview();
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const results = await axe(fixture.nativeElement as HTMLElement);
    expect(results).toHaveNoViolations();
  });
});
