// See App.tsx's own comment on this same import -- required for the
// classic JSX transform this app's tsconfig uses (react/jsx-runtime can't
// resolve once this bundle treats react as a federation-shared external).
import * as React from 'react';
import type { Locale } from '@tn4consulting/shared-i18n';

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

function text(value: BilingualText, locale: Locale): string {
  return locale === 'fr' ? value.fr : value.en;
}

export function NeedsAttentionList({ locale }: { locale: Locale }) {
  return (
    <section className="needs-attention-list">
      <gcds-heading tag="h2" id="needs-attention-heading">
        Needs Attention
      </gcds-heading>
      {NEEDS_ATTENTION.map((item) => (
        <gcds-notice
          key={item.id}
          notice-title={text(item.program, locale)}
          notice-role={item.severity}
          notice-title-tag="h3"
        >
          {text(item.message, locale)}
        </gcds-notice>
      ))}
    </section>
  );
}
