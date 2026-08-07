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
import { DashboardFeaturePaymentHistory } from './PaymentHistory';

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
    <section className="dashboard-overview" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--scds-space-6)', paddingBlock: 'var(--scds-space-5)' }}>
      <scds-breadcrumbs>
        <scds-breadcrumbs-item href="/">Home</scds-breadcrumbs-item>
        <scds-breadcrumbs-item>Dashboard</scds-breadcrumbs-item>
      </scds-breadcrumbs>

      {/* Inline styles, not a stylesheet class, for every layout-critical
          rule in this file: when this component is federated into the
          shell (the common case), this app's own styles.css/index.html
          never load at all -- only this exposed ./Component module does
          -- so an external className-based rule would silently be dead
          weight there. Confirmed live: the grid below rendered as a
          single stacked column, not 2, until this was inlined. Only
          shadow-DOM-encapsulated scds-* component styles survive
          federation on their own. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--scds-space-3)' }}>
        <scds-heading tag="h1">{citizenName ? `Hello, ${citizenName}` : 'Hello'}</scds-heading>
        <p className="today" style={{ color: 'var(--scds-color-text-muted)', margin: 0 }}>
          {formattedDate}
        </p>
      </div>

      <WhatsNewList locale={locale} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(22rem, 1fr))', gap: 'var(--scds-space-5)', alignItems: 'start' }}>
        <NeedsAttentionList locale={locale} />
        <DashboardFeaturePaymentHistory />
      </div>

      <TasksList tasks={benefitOverview?.tasks ?? null} />

      <section>
        {eiReportingStatusLoadError && (
          <>
            <scds-heading tag="h2" id="ei-reporting-heading">
              EI Reporting Status
            </scds-heading>
            <p role="alert">EI reporting status is temporarily unavailable.</p>
          </>
        )}
        {EiReportingStatusWidget && <EiReportingStatusWidget />}
      </section>

      <section>
        {jobApplicationsLoadError && (
          <>
            <scds-heading tag="h2" id="job-applications-heading">
              My Job Applications
            </scds-heading>
            <p role="alert">Job applications are temporarily unavailable.</p>
          </>
        )}
        {JobApplicationsWidget && <JobApplicationsWidget />}
      </section>

      <ConsiderThisList locale={locale} />
    </section>
  );
}
