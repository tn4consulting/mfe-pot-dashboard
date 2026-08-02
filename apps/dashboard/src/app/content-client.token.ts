import { InjectionToken } from '@angular/core';
import {
  ContentClient,
  PageContent,
  StaticContentClient,
  StrapiContentClient,
} from '@tn4consulting/shared-content-client';

export const OVERVIEW_CONTENT_KEY = 'dashboard.overview.intro';

// Baked fallback for the Firebase-hosted build (no live CMS there) -- kept
// in sync with the seed data in tools/cms/strapi/src/index.ts by hand for
// now; a build step to export this automatically is a natural follow-up.
const STATIC_CONTENT: Record<string, Record<'en' | 'fr', PageContent>> = {
  [OVERVIEW_CONTENT_KEY]: {
    en: {
      key: OVERVIEW_CONTENT_KEY,
      title: 'Welcome to your account',
      body: 'Here is an overview of your benefits, payments, and tasks.',
    },
    fr: {
      key: OVERVIEW_CONTENT_KEY,
      title: 'Bienvenue dans votre compte',
      body: 'Voici un aperçu de vos prestations, paiements et tâches.',
    },
  },
};

// Provided from REMOTE_PROVIDERS (not a plain module-level singleton) because
// it needs this app's own fetched strapiBaseUrl -- see runtime-config.ts.
export const CONTENT_CLIENT = new InjectionToken<ContentClient>('CONTENT_CLIENT');

export function createContentClient(strapiBaseUrl: string | undefined): ContentClient {
  return strapiBaseUrl
    ? new StrapiContentClient(strapiBaseUrl)
    : new StaticContentClient(STATIC_CONTENT);
}
