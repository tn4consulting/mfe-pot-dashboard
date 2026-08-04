import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GcdsComponentsModule } from '@gcds-core/components-angular';
import { TranslocoService } from '@tn4consulting/shared-i18n';

interface BilingualText {
  en: string;
  fr: string;
}

interface WhatsNewItem {
  id: string;
  title: BilingualText;
  body: BilingualText;
}

/**
 * Mock demo dressing modeled on `dashboard.png` -- deliberately not
 * sourced from dashboard-bff, there's no upstream owner for "what's new"
 * in this PoT, so it stays as static, bilingual, presentation-only data.
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

@Component({
  selector: 'lib-dashboard-whats-new-list',
  imports: [CommonModule, GcdsComponentsModule],
  templateUrl: './dashboard-whats-new-list.html',
  styleUrl: './dashboard-whats-new-list.css',
})
export class DashboardWhatsNewList implements OnInit {
  private readonly transloco = inject(TranslocoService);

  protected readonly lang = signal(this.transloco.getActiveLang());
  protected readonly items = WHATS_NEW;

  ngOnInit(): void {
    this.transloco.langChanges$.subscribe((lang) => this.lang.set(lang));
  }

  protected text(value: BilingualText): string {
    return this.lang() === 'fr' ? value.fr : value.en;
  }
}
