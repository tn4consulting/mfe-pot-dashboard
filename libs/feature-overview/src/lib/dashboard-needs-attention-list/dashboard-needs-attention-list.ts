import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GcdsComponentsModule } from '@gcds-core/components-angular';
import { TranslocoService } from '@tn4consulting/shared-i18n';

interface BilingualText {
  en: string;
  fr: string;
}

interface NeedsAttentionItem {
  id: string;
  program: BilingualText;
  severity: 'warning' | 'danger' | 'info';
  message: BilingualText;
}

/**
 * Mock demo dressing modeled on `dashboard.png` -- deliberately not
 * sourced from dashboard-bff, there's no upstream owner for "needs
 * attention" in this PoT, so it stays as static, bilingual,
 * presentation-only data.
 */
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

@Component({
  selector: 'lib-dashboard-needs-attention-list',
  imports: [CommonModule, GcdsComponentsModule],
  templateUrl: './dashboard-needs-attention-list.html',
  styleUrl: './dashboard-needs-attention-list.css',
})
export class DashboardNeedsAttentionList implements OnInit {
  private readonly transloco = inject(TranslocoService);

  protected readonly lang = signal(this.transloco.getActiveLang());
  protected readonly items = NEEDS_ATTENTION;

  ngOnInit(): void {
    this.transloco.langChanges$.subscribe((lang) => this.lang.set(lang));
  }

  protected text(value: BilingualText): string {
    return this.lang() === 'fr' ? value.fr : value.en;
  }
}
