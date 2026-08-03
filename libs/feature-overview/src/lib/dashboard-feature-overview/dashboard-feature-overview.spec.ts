import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService, TranslocoTestingModule } from '@tn4consulting/shared-i18n';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth';
import {
  EI_REPORTING_STATUS_WIDGET_LOADER,
  JOB_APPLICATIONS_WIDGET_LOADER,
  REACT_MOUNTER,
} from '@tn4consulting/shared-federation-runtime';
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
    eiReportingStatus: { status: 'ok', data: null },
    jobApplications: { status: 'ok', data: [] },
    ...overrides,
  };
}

@Component({ selector: 'lib-test-stub-widget', template: 'stub angular widget' })
class TestStubWidget {}

describe('DashboardFeatureOverview', () => {
  afterEach(() => clearSession());

  async function setup(providers: unknown[] = []) {
    await TestBed.configureTestingModule({
      imports: [
        DashboardFeatureOverview,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers,
    }).compileComponents();
  }

  it("renders dashboard's own What's New, Needs Attention, and Consider This sections", async () => {
    storeSession(createMockSession());
    await setup();

    const fixture = TestBed.createComponent(DashboardFeatureOverview);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Your weekly EI benefit amount has been recalculated');
    expect(text).toContain('Add a second sign-in method');
    expect(text).toContain('Based on your profile, you may be eligible for CDCP');
  });

  it("renders dashboard's own My Tasks section from benefitOverview", async () => {
    storeSession(createMockSession());
    await setup();

    const fixture = TestBed.createComponent(DashboardFeatureOverview);
    fixture.componentInstance.benefitOverview = fullOverview();
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Submit your next EI report');
  });

  it('degrades both federated widget sections to unavailable when no shell/loader is present', async () => {
    storeSession(createMockSession());
    await setup();

    const fixture = TestBed.createComponent(DashboardFeatureOverview);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const alerts = Array.from(compiled.querySelectorAll('[role="alert"]')).map((el) => el.textContent);
    expect(alerts.some((text) => text?.includes('EI reporting status'))).toBe(true);
    expect(alerts.some((text) => text?.includes('Job applications'))).toBe(true);
  });

  it('degrades the federated widget sections independently of whether benefitOverview itself loaded', async () => {
    storeSession(createMockSession());
    await setup();

    const fixture = TestBed.createComponent(DashboardFeatureOverview);
    // benefitOverview is deliberately left null here (as it would be while
    // dashboard-bff is still loading, or down) -- the two widget sections
    // must still attempt to load and degrade on their own, not be hidden
    // behind that gate. See the container's own doc for why.
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('mounts the real react and angular widgets once their loaders resolve', async () => {
    storeSession(createMockSession());
    const unmountReact = jest.fn();
    await setup([
      {
        provide: JOB_APPLICATIONS_WIDGET_LOADER,
        useValue: () =>
          Promise.resolve({ kind: 'react' as const, component: 'stub-react-component' }),
      },
      {
        provide: EI_REPORTING_STATUS_WIDGET_LOADER,
        useValue: () =>
          Promise.resolve({ kind: 'angular' as const, component: TestStubWidget, providers: [] }),
      },
      {
        provide: REACT_MOUNTER,
        useValue: jest.fn().mockReturnValue({ unmount: unmountReact }),
      },
    ]);

    const fixture = TestBed.createComponent(DashboardFeatureOverview);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')).toBeNull();
    expect(compiled.textContent).toContain('stub angular widget');

    fixture.destroy();
    expect(unmountReact).toHaveBeenCalled();
  });

  it('re-renders mock content in French when the active language changes', async () => {
    storeSession(createMockSession());
    await setup();

    const fixture = TestBed.createComponent(DashboardFeatureOverview);
    await fixture.componentInstance.ngOnInit();
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
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const results = await axe(fixture.nativeElement as HTMLElement);
    expect(results).toHaveNoViolations();
  });
});
