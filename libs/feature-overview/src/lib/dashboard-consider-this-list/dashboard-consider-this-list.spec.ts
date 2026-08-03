import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@tn4consulting/shared-i18n';
import { DashboardConsiderThisList } from './dashboard-consider-this-list';

describe('DashboardConsiderThisList', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DashboardConsiderThisList,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
    }).compileComponents();
  });

  it('renders the mock Consider This suggestions', () => {
    const fixture = TestBed.createComponent(DashboardConsiderThisList);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Based on your profile, you may be eligible for CDCP',
    );
  });

  it('renders each suggestion as a static (non-navigating) scds-card with its action label', () => {
    const fixture = TestBed.createComponent(DashboardConsiderThisList);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('scds-card');
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((card) => expect(card.getAttribute('href')).toBeNull());
    expect(compiled.textContent).toContain('Check eligibility');
    expect(compiled.querySelector('a[href="#"]')).toBeNull();
  });
});
