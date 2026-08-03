import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GcdsComponentsModule } from '@gcds-core/components-angular';
import { TranslocoService } from '@tn4consulting/shared-i18n';

interface BilingualText {
  en: string;
  fr: string;
}

interface SuggestionItem {
  id: string;
  title: BilingualText;
  body: BilingualText;
  actionLabel: BilingualText;
}

/**
 * Mock demo dressing modeled on `dashboard.png` -- deliberately not
 * sourced from dashboard-bff, there's no upstream owner for "consider
 * this" in this PoT, so it stays as static, bilingual, presentation-only
 * data.
 */
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

@Component({
  selector: 'lib-dashboard-consider-this-list',
  imports: [CommonModule, GcdsComponentsModule],
  templateUrl: './dashboard-consider-this-list.html',
  styleUrl: './dashboard-consider-this-list.css',
})
export class DashboardConsiderThisList implements OnInit {
  private readonly transloco = inject(TranslocoService);

  protected readonly lang = signal(this.transloco.getActiveLang());
  protected readonly items = SUGGESTIONS;

  ngOnInit(): void {
    this.transloco.langChanges$.subscribe((lang) => this.lang.set(lang));
  }

  protected text(value: BilingualText): string {
    return this.lang() === 'fr' ? value.fr : value.en;
  }
}
