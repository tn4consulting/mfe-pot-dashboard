import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/**
 * Minimal JSX typing for the SCDS custom elements this app renders
 * directly. Confirmed by inspecting `@tn4consulting/shared-ui-scds-core`'s
 * own compiled Stencil metadata directly: every prop used below has a
 * real kebab-case `attribute` mapping the component's own
 * `attributeChangedCallback` watches, so a plain HTML attribute in JSX is
 * enough. GCDS has been removed from the family entirely -- this file
 * replaces both the old scds-elements.d.ts and gcds-elements.d.ts.
 *
 * `scds-multi-column-list` is deliberately NOT declared here -- its
 * `items`/`columns` props are non-primitive, so TasksList.tsx creates and
 * mounts it imperatively instead (same pattern as job-bank's
 * FeatureSearch.tsx).
 */
type ScdsElementProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'scds-card': ScdsElementProps & {
        'card-title'?: string;
        'card-title-tag'?: 'h3' | 'h4' | 'h5' | 'h6';
        description?: string;
        href?: string;
        rel?: string;
        target?: string;
        'img-src'?: string;
        'img-alt'?: string;
        tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
        'tone-label'?: string;
      };
      'scds-heading': ScdsElementProps & { tag?: string };
      'scds-text': ScdsElementProps & { tag?: string; size?: string };
      'scds-notice': ScdsElementProps & {
        'notice-title'?: string;
        'title-tag'?: 'h2' | 'h3' | 'h4';
        tone?: 'info' | 'success' | 'warning' | 'danger';
      };
      'scds-badge': ScdsElementProps & {
        tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
        label?: string;
        variant?: 'subtle' | 'pill';
        'show-icon'?: boolean | string;
      };
      'scds-link': ScdsElementProps & { href?: string; 'icon-name'?: string; 'icon-position'?: 'start' | 'end' };
      'scds-table': ScdsElementProps & { dense?: boolean };
      'scds-breadcrumbs': ScdsElementProps;
      'scds-breadcrumbs-item': ScdsElementProps & { href?: string };
    }
  }
}

export {};
