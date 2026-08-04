import {
  Component,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
  computed,
  createEnvironmentInjector,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GcdsComponentsModule } from '@gcds-core/components-angular';
import { TranslocoService } from '@tn4consulting/shared-i18n';
import { getStoredSession, onSessionChange } from '@tn4consulting/shared-auth';
import {
  EI_REPORTING_STATUS_WIDGET_LOADER,
  JOB_APPLICATIONS_WIDGET_LOADER,
  REACT_MOUNTER,
  ReactMount,
} from '@tn4consulting/shared-federation-runtime';
import { BenefitOverview } from 'dashboard-data-access';
import { DashboardWhatsNewList } from '../dashboard-whats-new-list/dashboard-whats-new-list';
import { DashboardNeedsAttentionList } from '../dashboard-needs-attention-list/dashboard-needs-attention-list';
import { DashboardTasksList } from '../dashboard-tasks-list/dashboard-tasks-list';
import { DashboardConsiderThisList } from '../dashboard-consider-this-list/dashboard-consider-this-list';

/**
 * Composes dashboard's own sections (WhatsNewList/NeedsAttentionList/
 * TasksList/ConsiderThisList, mock or benefitOverview-fed) alongside two
 * sections owned by other domains and rendered here as federated widgets --
 * job-bank's JobApplicationsList (React) and employment-insurance's
 * EiReportingStatusWidget (Angular) -- loaded via the shell-mediated
 * JOB_APPLICATIONS_WIDGET_LOADER/EI_REPORTING_STATUS_WIDGET_LOADER tokens,
 * same host-mediated pattern this app's own PaymentHistoryWidget uses when
 * embedded into employment-life-events. See CLAUDE.md's federation
 * section for why a remote can't loadRemoteModule another remote itself.
 *
 * Both loaders are optionally injected: this component (and the whole
 * dashboard app) must stay independently testable/serveable with no shell
 * running, so an absent loader degrades to the same "unavailable" state a
 * real load failure would show -- not a crash.
 */
@Component({
  selector: 'lib-dashboard-feature-overview',
  imports: [
    CommonModule,
    GcdsComponentsModule,
    DashboardWhatsNewList,
    DashboardNeedsAttentionList,
    DashboardTasksList,
    DashboardConsiderThisList,
  ],
  templateUrl: './dashboard-feature-overview.html',
  styleUrl: './dashboard-feature-overview.css',
})
export class DashboardFeatureOverview implements OnInit, OnDestroy {
  @Input() benefitOverview: BenefitOverview | null = null;

  @ViewChild('jobApplicationsHost', { static: true })
  private jobApplicationsHostEl!: ElementRef<HTMLDivElement>;

  @ViewChild('eiReportingStatusHost', { read: ViewContainerRef, static: true })
  private eiReportingStatusHost!: ViewContainerRef;

  private readonly transloco = inject(TranslocoService);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly loadJobApplicationsWidget = inject(JOB_APPLICATIONS_WIDGET_LOADER, { optional: true });
  private readonly loadEiReportingStatusWidget = inject(EI_REPORTING_STATUS_WIDGET_LOADER, { optional: true });
  private readonly mountReact = inject(REACT_MOUNTER, { optional: true });

  protected readonly citizenName = signal<string | null>(null);
  protected readonly lang = signal(this.transloco.getActiveLang());
  protected readonly formattedDate = computed(() =>
    new Intl.DateTimeFormat(this.lang() === 'fr' ? 'fr-CA' : 'en-CA', { dateStyle: 'long' }).format(new Date()),
  );

  protected readonly jobApplicationsLoadError = signal(false);
  protected readonly eiReportingStatusLoadError = signal(false);

  private reactMount: ReactMount | undefined;
  private destroyed = false;

  constructor() {
    const unsubscribe = onSessionChange((session) => this.citizenName.set(session?.name ?? null));
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  async ngOnInit(): Promise<void> {
    this.citizenName.set(getStoredSession()?.name ?? null);
    this.transloco.langChanges$.subscribe((lang) => this.lang.set(lang));

    await Promise.all([this.mountJobApplicationsWidget(), this.mountEiReportingStatusWidget()]);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.reactMount?.unmount();
  }

  private async mountJobApplicationsWidget(): Promise<void> {
    if (!this.loadJobApplicationsWidget) {
      this.jobApplicationsLoadError.set(true);
      return;
    }
    try {
      const { component } = await this.loadJobApplicationsWidget();
      if (this.destroyed) {
        return;
      }
      if (!this.mountReact) {
        throw new Error(
          'REACT_MOUNTER is not provided -- a react-kind widget needs the host app to provide it.',
        );
      }
      this.reactMount = this.mountReact(this.jobApplicationsHostEl.nativeElement, component);
    } catch (err) {
      console.error('Failed to load job applications widget', err);
      this.jobApplicationsLoadError.set(true);
    }
  }

  private async mountEiReportingStatusWidget(): Promise<void> {
    if (!this.loadEiReportingStatusWidget) {
      this.eiReportingStatusLoadError.set(true);
      return;
    }
    try {
      const loaded = await this.loadEiReportingStatusWidget();
      if (this.destroyed) {
        return;
      }
      if (loaded.kind !== 'angular') {
        throw new Error('Expected an angular widget for EI reporting status');
      }
      const childInjector = loaded.providers.length
        ? createEnvironmentInjector(loaded.providers, this.envInjector)
        : this.envInjector;
      this.eiReportingStatusHost.createComponent(loaded.component, { environmentInjector: childInjector });
    } catch (err) {
      console.error('Failed to load EI reporting status widget', err);
      this.eiReportingStatusLoadError.set(true);
    }
  }
}
