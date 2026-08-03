import { Component, DestroyRef, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GcdsComponentsModule } from '@gcds-core/components-angular';
import { TranslocoService } from '@tn4consulting/shared-i18n';
import { getStoredSession, onSessionChange } from '@tn4consulting/shared-auth';
import { BenefitOverview, EiReportingStatusLabel } from 'dashboard-data-access';

interface BilingualText {
  en: string;
  fr: string;
}

interface WhatsNewItem {
  id: string;
  title: BilingualText;
  body: BilingualText;
}

interface NeedsAttentionItem {
  id: string;
  program: BilingualText;
  severity: 'warning' | 'danger' | 'info';
  message: BilingualText;
}

interface SuggestionItem {
  id: string;
  title: BilingualText;
  body: BilingualText;
  actionLabel: BilingualText;
}

/**
 * Mock demo dressing modeled on `dashboard.png` -- deliberately not sourced
 * from dashboard-bff, unlike the rest of this component's content. There's
 * no upstream owner for "what's new"/"needs attention"/"consider this" in
 * this PoT, so it stays as static, bilingual, presentation-only data.
 */
const WHATS_NEW: WhatsNewItem[] = [
  {
    id: 'whats-new-ei-increase',
    title: { en: 'Employment Insurance — benefit increase', fr: "Assurance-emploi — augmentation de la prestation" },
    body: {
      en: 'Your weekly EI benefit amount has been recalculated based on your latest report.',
      fr: 'Le montant de votre prestation hebdomadaire d’assurance-emploi a été recalculé selon votre dernier rapport.',
    },
  },
];

const NEEDS_ATTENTION: NeedsAttentionItem[] = [
  {
    id: 'needs-attention-security',
    program: { en: 'MSCA Account Security', fr: 'Sécurité du compte Mon dossier Service Canada' },
    severity: 'warning',
    message: {
      en: 'Add a second sign-in method to better protect your account.',
      fr: 'Ajoutez une deuxième méthode de connexion pour mieux protéger votre compte.',
    },
  },
];

const SUGGESTIONS: SuggestionItem[] = [
  {
    id: 'suggestion-cdcp',
    title: { en: 'Canada Dental Care Plan', fr: 'Régime canadien de soins dentaires' },
    body: {
      en: 'Based on your profile, you may be eligible for CDCP.',
      fr: 'Selon votre profil, vous pourriez être admissible au RCSD.',
    },
    actionLabel: { en: 'Check eligibility', fr: "Vérifier l'admissibilité" },
  },
  {
    id: 'suggestion-profile',
    title: { en: 'Update your profile', fr: 'Mettez à jour votre profil' },
    body: {
      en: 'Keep your contact information current so we can reach you faster.',
      fr: 'Gardez vos coordonnées à jour afin que nous puissions vous joindre plus rapidement.',
    },
    actionLabel: { en: 'Edit profile', fr: 'Modifier le profil' },
  },
];

const REPORTING_STATUS_LABEL: Record<EiReportingStatusLabel, BilingualText> = {
  not_yet_due: { en: 'Not yet due', fr: 'Pas encore requis' },
  due_soon: { en: 'Due soon', fr: 'Bientôt requis' },
  overdue: { en: 'Overdue', fr: 'En retard' },
};

@Component({
  selector: 'lib-dashboard-feature-overview',
  imports: [CommonModule, GcdsComponentsModule],
  templateUrl: './dashboard-feature-overview.html',
  styleUrl: './dashboard-feature-overview.css',
})
export class DashboardFeatureOverview implements OnInit {
  @Input() benefitOverview: BenefitOverview | null = null;

  private readonly transloco = inject(TranslocoService);

  protected readonly citizenName = signal<string | null>(null);
  protected readonly lang = signal(this.transloco.getActiveLang());
  protected readonly formattedDate = computed(() =>
    new Intl.DateTimeFormat(this.lang() === 'fr' ? 'fr-CA' : 'en-CA', { dateStyle: 'long' }).format(new Date()),
  );

  protected readonly whatsNew = WHATS_NEW;
  protected readonly needsAttention = NEEDS_ATTENTION;
  protected readonly suggestions = SUGGESTIONS;

  constructor() {
    const unsubscribe = onSessionChange((session) => this.citizenName.set(session?.name ?? null));
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  ngOnInit(): void {
    this.citizenName.set(getStoredSession()?.name ?? null);
    this.transloco.langChanges$.subscribe((lang) => this.lang.set(lang));
  }

  protected text(value: BilingualText): string {
    return this.lang() === 'fr' ? value.fr : value.en;
  }

  protected reportingStatusLabel(status: EiReportingStatusLabel): string {
    return this.text(REPORTING_STATUS_LABEL[status]);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.lang() === 'fr' ? 'fr-CA' : 'en-CA', { dateStyle: 'long' }).format(
      new Date(iso),
    );
  }
}
