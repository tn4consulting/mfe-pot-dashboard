import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { WhatsNewList } from './WhatsNewList';

describe('WhatsNewList', () => {
  it('renders the English copy by default', () => {
    render(<WhatsNewList locale="en" />);

    // gcds-notice is an unregistered custom element in this test
    // environment -- its `notice-title` prop lands as a plain attribute
    // (no shadow DOM to render it as visible text), so title is asserted
    // via the attribute and body via its slotted (visible) text content.
    const notice = screen.getByText(
      'Your weekly EI benefit amount has been recalculated based on your latest report.',
    );
    expect(notice.getAttribute('notice-title')).toBe('Employment Insurance — benefit increase');
  });

  it('renders the French copy when locale is fr', () => {
    render(<WhatsNewList locale="fr" />);

    const notice = screen.getByText(
      'Le montant de votre prestation hebdomadaire d’assurance-emploi a été recalculé selon votre dernier rapport.',
    );
    expect(notice.getAttribute('notice-title')).toBe('Assurance-emploi — augmentation de la prestation');
  });
});
