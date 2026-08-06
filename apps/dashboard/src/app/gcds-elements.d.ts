import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/**
 * Minimal JSX typing for the GCDS custom elements this app renders
 * directly (no Angular wrapper -- see mfe-pot-platform's CLAUDE.md/
 * migration plan). Confirmed by inspecting `@gcds-core/components`'s own
 * compiled Stencil metadata directly: every prop used below has a real
 * kebab-case `attribute` mapping the component's own
 * `attributeChangedCallback` watches, so a plain HTML attribute in JSX is
 * enough -- same pattern already proven in the shell repo.
 */
type GcdsElementProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gcds-heading': GcdsElementProps & { tag?: string };
      'gcds-notice': GcdsElementProps & {
        'notice-title'?: string;
        'notice-role'?: 'info' | 'warning' | 'danger' | 'success';
        'notice-title-tag'?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      };
      'gcds-breadcrumbs': GcdsElementProps & { 'hide-canada-link'?: string };
      'gcds-breadcrumbs-item': GcdsElementProps & { href?: string };
      'gcds-button': GcdsElementProps & { 'button-role'?: string; size?: string };
    }
  }
}

export {};
