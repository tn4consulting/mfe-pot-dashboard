import { TestBed } from '@angular/core/testing';
import { PAYMENT_HISTORY_API_CLIENT, PaymentHistoryApiClient } from 'dashboard-data-access';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth';
import { DashboardFeaturePaymentHistory } from './dashboard-feature-payment-history';

describe('DashboardFeaturePaymentHistory', () => {
  const apiClient: jest.Mocked<PaymentHistoryApiClient> = {
    getPayments: jest.fn(),
  };

  beforeEach(() => jest.resetAllMocks());
  afterEach(() => clearSession());

  async function setup() {
    await TestBed.configureTestingModule({
      imports: [DashboardFeaturePaymentHistory],
      providers: [{ provide: PAYMENT_HISTORY_API_CLIENT, useValue: apiClient }],
    }).compileComponents();
  }

  it('renders payments fetched from client-profile-service', async () => {
    storeSession(createMockSession());
    apiClient.getPayments.mockResolvedValue([
      { id: 'pay-1', date: '2026-07-15', benefit: 'Employment Insurance', amount: 638 },
    ]);
    await setup();

    const fixture = TestBed.createComponent(DashboardFeaturePaymentHistory);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Employment Insurance');
  });

  it('shows an error state when payments fail to load', async () => {
    storeSession(createMockSession());
    apiClient.getPayments.mockRejectedValue(new Error('network down'));
    await setup();

    const fixture = TestBed.createComponent(DashboardFeaturePaymentHistory);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('temporarily unavailable');
  });

  it('shows an error state when there is no active session', async () => {
    clearSession();
    await setup();

    const fixture = TestBed.createComponent(DashboardFeaturePaymentHistory);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')).not.toBeNull();
  });
});
