import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PageContent } from '@tn4consulting/shared-content-client';
import { TranslocoPipe, TranslocoService } from '@tn4consulting/shared-i18n';
import { CLAIM_DASHBOARD, getStoredSession, hasClaim, onSessionChange } from '@tn4consulting/shared-auth';
import { BENEFIT_OVERVIEW_API_CLIENT, BenefitOverview } from 'dashboard-data-access';
import { DashboardFeatureOverview } from 'dashboard-feature-overview';
import { DashboardFeaturePaymentHistory } from 'dashboard-feature-payment-history';
import { CONTENT_CLIENT, OVERVIEW_CONTENT_KEY } from './content-client.token';

@Component({
  imports: [RouterModule, TranslocoPipe, DashboardFeatureOverview, DashboardFeaturePaymentHistory],
  selector: 'msca-d-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected title = 'dashboard';
  protected readonly overview = signal<PageContent | null>(null);
  protected readonly contentLoadError = signal(false);
  // Defense in depth: this app validates its own claim independently,
  // never assuming "the shell let me navigate here, so I'm authorized" --
  // see CLAUDE.md's "Security: defense in depth" section.
  protected readonly hasAccess = signal(hasClaim(getStoredSession(), CLAIM_DASHBOARD));
  protected readonly benefitOverview = signal<BenefitOverview | null>(null);

  private readonly contentClient = inject(CONTENT_CLIENT);
  private readonly transloco = inject(TranslocoService);
  private readonly benefitOverviewApiClient = inject(BENEFIT_OVERVIEW_API_CLIENT);

  constructor() {
    const unsubscribe = onSessionChange((session) =>
      this.hasAccess.set(hasClaim(session, CLAIM_DASHBOARD)),
    );
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  async ngOnInit(): Promise<void> {
    // CMS content (unlike Transloco chrome text) isn't reactive by default,
    // so this app explicitly re-fetches whenever the cross-remote active
    // locale changes -- proving the "content switches language too, not
    // just chrome" half of the bilingual story.
    await this.loadOverview(this.transloco.getActiveLang());
    this.transloco.langChanges$.subscribe((lang) => this.loadOverview(lang));

    const session = getStoredSession();
    if (session) {
      try {
        // dashboard-bff's fan-out degrades one tile at a time (see
        // CLAUDE.md's "Backends: BFF pattern" section) -- individual tiles
        // report their own `unavailable` status rather than this call
        // itself failing. It can still throw if the service is entirely
        // unreachable (e.g. no BFF on the Firebase-hosted build yet).
        this.benefitOverview.set(await this.benefitOverviewApiClient.getOverview(session.sub));
      } catch (err) {
        console.error('Failed to load benefit overview', err);
      }
    }
  }

  private async loadOverview(lang: string): Promise<void> {
    try {
      const content = await this.contentClient.getPageContent(
        OVERVIEW_CONTENT_KEY,
        lang === 'fr' ? 'fr' : 'en',
      );
      this.overview.set(content);
      this.contentLoadError.set(false);
    } catch (err) {
      console.error('Failed to load dashboard overview content', err);
      this.contentLoadError.set(true);
    }
  }
}
