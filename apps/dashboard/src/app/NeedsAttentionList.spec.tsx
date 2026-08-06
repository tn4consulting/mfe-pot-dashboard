import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { NeedsAttentionList } from './NeedsAttentionList';

describe('NeedsAttentionList', () => {
  it('renders the English copy with the item severity as notice-role', () => {
    render(<NeedsAttentionList locale="en" />);

    // gcds-notice is an unregistered custom element in this test
    // environment -- its title/role props land as plain attributes,
    // asserted directly rather than via shadow-DOM rendered text.
    const notice = screen.getByText('Add a second sign-in method to better protect your account.');
    expect(notice.getAttribute('notice-title')).toBe('MSCA Account Security');
    expect(notice.getAttribute('notice-role')).toBe('warning');
  });

  it('renders the French copy when locale is fr', () => {
    render(<NeedsAttentionList locale="fr" />);

    const notice = screen.getByText('Ajoutez une deuxième méthode de connexion pour mieux protéger votre compte.');
    expect(notice.getAttribute('notice-title')).toBe('Sécurité du compte Mon dossier Service Canada');
  });
});
