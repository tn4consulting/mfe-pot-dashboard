// See App.tsx's own comment on this same import -- required for the
// classic JSX transform this app's tsconfig uses (react/jsx-runtime can't
// resolve once this bundle treats react as a federation-shared external).
import * as React from 'react';
import type { Locale } from '@tn4consulting/shared-i18n';

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
    title: { en: 'Employment Insurance — benefit increase', fr: 'Assurance-emploi — augmentation de la prestation' },
    body: {
      en: 'Your weekly EI benefit amount has been recalculated based on your latest report.',
      fr: 'Le montant de votre prestation hebdomadaire d’assurance-emploi a été recalculé selon votre dernier rapport.',
    },
  },
];

function text(value: BilingualText, locale: Locale): string {
  return locale === 'fr' ? value.fr : value.en;
}

export function WhatsNewList({ locale }: { locale: Locale }) {
  return (
    <section className="whats-new-list">
      <gcds-heading tag="h2" id="whats-new-heading">
        What&apos;s New
      </gcds-heading>
      {WHATS_NEW.map((item) => (
        <gcds-notice key={item.id} notice-title={text(item.title, locale)} notice-role="info" notice-title-tag="h3">
          {text(item.body, locale)}
        </gcds-notice>
      ))}
    </section>
  );
}
