// See App.tsx's own comment on this same import -- required for the
// classic JSX transform this app's tsconfig uses.
import * as React from 'react';
import { ComponentType, useEffect, useState } from 'react';
import { getStoredSession, onSessionChange } from '@tn4consulting/shared-auth/core';
import { useLocale } from '@tn4consulting/shared-i18n';
import {
  useEiReportingStatusWidgetLoader,
  useJobApplicationsWidgetLoader,
} from '@tn4consulting/shared-federation-runtime';
import type { BenefitOverview } from 'dashboard-data-access';
import { WhatsNewList } from './WhatsNewList';
import { NeedsAttentionList } from './NeedsAttentionList';
import { TasksList } from './TasksList';
import { ConsiderThisList } from './ConsiderThisList';

/**
 * Composes dashboard's own sections (WhatsNewList/NeedsAttentionList/
 * TasksList/ConsiderThisList, mock or benefitOverview-fed) alongside two
 * sections owned by other domains and rendered here as federated widgets --
 * job-bank's JobApplicationsList and employment-insurance's
 * EiReportingStatusWidget -- loaded via the shell-mediated
 * JobApplicationsWidgetLoaderContext/EiReportingStatusWidgetLoaderContext,
 * same host-mediated pattern this app's own PaymentHistoryWidget uses when
 * embedded into employment-life-events. See CLAUDE.md's federation
 * section for why a remote can't loadRemoteModule another remote itself.
 *
 * Both loaders come back `undefined` when there's no shell providing them
 * (standalone serving) -- this component (and the whole dashboard app)
 * must stay independently testable/serveable with no shell running, so an
 * absent loader degrades to the same "unavailable" state a real load
 * failure would show, not a crash.
 *
 * Genuinely simpler than the Angular version this replaces: both widgets
 * are React now (employment-insurance converted in Phase 3), so there's no
 * more REACT_MOUNTER/EnvironmentInjector kind-branching -- just call the
 * loader and render whatever component it resolves to, same shape as
 * employment-life-events' GuidedJourney.tsx.
 */
export function Overview({ benefitOverview }: { benefitOverview: BenefitOverview | null }) {
  const [citizenName, setCitizenName] = useState(() => getStoredSession()?.name ?? null);
  const locale = useLocale();
  const formattedDate = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', { dateStyle: 'long' }).format(
    new Date(),
  );

  useEffect(() => onSessionChange((session) => setCitizenName(session?.name ?? null)), []);

  const loadJobApplicationsWidget = useJobApplicationsWidgetLoader();
  const [JobApplicationsWidget, setJobApplicationsWidget] = useState<ComponentType<
    Record<string, unknown>
  > | null>(null);
  const [jobApplicationsLoadError, setJobApplicationsLoadError] = useState(false);

  useEffect(() => {
    if (!loadJobApplicationsWidget) {
      setJobApplicationsLoadError(true);
      return;
    }
    let cancelled = false;
    loadJobApplicationsWidget()
      .then(({ component }) => {
        if (!cancelled) {
          setJobApplicationsWidget(() => component);
        }
      })
      .catch((err) => {
        console.error('Failed to load job applications widget', err);
        if (!cancelled) {
          setJobApplicationsLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadJobApplicationsWidget]);

  const loadEiReportingStatusWidget = useEiReportingStatusWidgetLoader();
  const [EiReportingStatusWidget, setEiReportingStatusWidget] = useState<ComponentType<
    Record<string, unknown>
  > | null>(null);
  const [eiReportingStatusLoadError, setEiReportingStatusLoadError] = useState(false);

  useEffect(() => {
    if (!loadEiReportingStatusWidget) {
      setEiReportingStatusLoadError(true);
      return;
    }
    let cancelled = false;
    loadEiReportingStatusWidget()
      .then(({ component }) => {
        if (!cancelled) {
          setEiReportingStatusWidget(() => component);
        }
      })
      .catch((err) => {
        console.error('Failed to load EI reporting status widget', err);
        if (!cancelled) {
          setEiReportingStatusLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadEiReportingStatusWidget]);

  return (
    <section className="dashboard-overview">
      <gcds-breadcrumbs hide-canada-link="true">
        <gcds-breadcrumbs-item href="/">Home</gcds-breadcrumbs-item>
        <gcds-breadcrumbs-item>Dashboard</gcds-breadcrumbs-item>
      </gcds-breadcrumbs>

      <gcds-heading tag="h1">{citizenName ? `Hello, ${citizenName}` : 'Hello'}</gcds-heading>
      <p className="today">{formattedDate}</p>

      <WhatsNewList locale={locale} />
      <NeedsAttentionList locale={locale} />

      <TasksList tasks={benefitOverview?.tasks ?? null} />

      <section>
        {eiReportingStatusLoadError && (
          <>
            <gcds-heading tag="h2" id="ei-reporting-heading">
              EI Reporting Status
            </gcds-heading>
            <p role="alert">EI reporting status is temporarily unavailable.</p>
          </>
        )}
        {EiReportingStatusWidget && <EiReportingStatusWidget />}
      </section>

      <section>
        {jobApplicationsLoadError && (
          <>
            <gcds-heading tag="h2" id="job-applications-heading">
              My Job Applications
            </gcds-heading>
            <p role="alert">Job applications are temporarily unavailable.</p>
          </>
        )}
        {JobApplicationsWidget && <JobApplicationsWidget />}
      </section>

      <ConsiderThisList locale={locale} />
    </section>
  );
}
