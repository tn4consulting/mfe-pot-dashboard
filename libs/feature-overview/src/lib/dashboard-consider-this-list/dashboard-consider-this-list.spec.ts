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
});
