import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@tn4consulting/shared-i18n';
import { DashboardNeedsAttentionList } from './dashboard-needs-attention-list';

describe('DashboardNeedsAttentionList', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DashboardNeedsAttentionList,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
    }).compileComponents();
  });

  it('renders the mock Needs Attention content', () => {
    const fixture = TestBed.createComponent(DashboardNeedsAttentionList);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Add a second sign-in method');
  });
});
