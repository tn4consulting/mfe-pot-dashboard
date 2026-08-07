// See below -- required for the classic JSX transform this app's
// tsconfig uses (react/jsx-runtime can't resolve once this bundle treats
// react as a federation-shared external).
import * as React from 'react';
import { useEffect, useState } from 'react';
import { CLAIM_DASHBOARD, getStoredSession, hasClaim, onSessionChange } from '@tn4consulting/shared-auth/core';
import type { ContentClient, PageContent } from '@tn4consulting/shared-content-client';
import { useLocale, useTranslations } from '@tn4consulting/shared-i18n';
import type { BenefitOverview, BenefitOverviewApiClient } from 'dashboard-data-access';
import { HttpBenefitOverviewApiClient } from 'dashboard-data-access';
import { createContentClient, OVERVIEW_CONTENT_KEY } from './content-client';
import { loadRuntimeConfig } from '../runtime-config';
import { assetBaseUrl } from './asset-base-url';
import { Overview } from './Overview';
import './register-scds';

interface RemoteConfig {
  benefitOverviewApiClient: BenefitOverviewApiClient;
  contentClient: ContentClient;
}

/**
 * Does its own setup entirely -- no host-provided REMOTE_PROVIDERS
 * equivalent (see RemoteRouteHost in shared-federation-runtime for why).
 * Auth/claim check lives here, not in the feature components -- defense
 * in depth, this app validates its own claim independently.
 */
export function App() {
  const [hasAccess, setHasAccess] = useState(() => hasClaim(getStoredSession(), CLAIM_DASHBOARD));
  const [config, setConfig] = useState<RemoteConfig | null>(null);
  const [intro, setIntro] = useState<PageContent | null>(null);
  const [introLoadError, setIntroLoadError] = useState(false);
  const [benefitOverview, setBenefitOverview] = useState<BenefitOverview | null>(null);
  const locale = useLocale();
  const { t } = useTranslations(assetBaseUrl, locale);

  useEffect(() => onSessionChange((session) => setHasAccess(hasClaim(session, CLAIM_DASHBOARD))), []);

  useEffect(() => {
    let cancelled = false;
    loadRuntimeConfig(assetBaseUrl).then((runtimeConfig) => {
      if (cancelled) {
        return;
      }
      setConfig({
        benefitOverviewApiClient: new HttpBenefitOverviewApiClient(runtimeConfig.dashboardBffBaseUrl),
        contentClient: createContentClient(runtimeConfig.strapiBaseUrl, assetBaseUrl),
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // CMS content (unlike the i18n chrome text below) isn't reactive by
  // default, so this app explicitly re-fetches whenever the cross-remote
  // active locale changes -- same pattern as every other converted app.
  useEffect(() => {
    if (!config) {
      return;
    }
    let cancelled = false;
    config.contentClient
      .getPageContent(OVERVIEW_CONTENT_KEY, locale === 'fr' ? 'fr' : 'en')
      .then((content) => {
        if (!cancelled) {
          setIntro(content);
          setIntroLoadError(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard overview content', err);
        if (!cancelled) {
          setIntroLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [config, locale]);

  useEffect(() => {
    if (!config) {
      return;
    }
    const session = getStoredSession();
    if (!session) {
      return;
    }
    let cancelled = false;
    // dashboard-bff's fan-out degrades one tile at a time (see
    // CLAUDE.md's "Backends: BFF pattern" section) -- individual tiles
    // report their own `unavailable` status rather than this call itself
    // failing. It can still throw if the service is entirely unreachable.
    config.benefitOverviewApiClient
      .getOverview(session.sub)
      .then((overview) => {
        if (!cancelled) {
          setBenefitOverview(overview);
        }
      })
      .catch((err) => {
        console.error('Failed to load benefit overview', err);
      });
    return () => {
      cancelled = true;
    };
  }, [config]);

  if (!hasAccess) {
    return <p role="alert">{t('auth.signInRequired')}</p>;
  }

  if (!config) {
    return null;
  }

  return (
    <>
      <section>
        <h1>{t('chrome.heading')}</h1>
        {intro ? (
          <>
            <h2>{intro.title}</h2>
            <p>{intro.body}</p>
          </>
        ) : introLoadError ? (
          <p role="alert">Page content is temporarily unavailable.</p>
        ) : null}
        <p>{t('chrome.servedFrom')}</p>
      </section>

      <Overview benefitOverview={benefitOverview} />
    </>
  );
}
