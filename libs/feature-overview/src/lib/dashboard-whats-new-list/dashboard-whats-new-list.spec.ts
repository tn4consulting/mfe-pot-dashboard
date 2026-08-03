import { TestBed } from '@angular/core/testing';
import { TranslocoService, TranslocoTestingModule } from '@tn4consulting/shared-i18n';
import { DashboardWhatsNewList } from './dashboard-whats-new-list';

describe('DashboardWhatsNewList', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DashboardWhatsNewList,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
    }).compileComponents();
  });

  it('renders the mock What\'s New content', () => {
    const fixture = TestBed.createComponent(DashboardWhatsNewList);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Your weekly EI benefit amount has been recalculated',
    );
  });

  it('re-renders in French when the active language changes', () => {
    const fixture = TestBed.createComponent(DashboardWhatsNewList);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    TestBed.inject(TranslocoService).setActiveLang('fr');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'a été recalculé selon votre dernier rapport',
    );
  });
});
