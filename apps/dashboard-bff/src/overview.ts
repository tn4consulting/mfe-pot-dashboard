import { upstreams } from './config';
import { CorrespondenceItem, Payment, getCorrespondence, getPayments } from './data';
import { fetchJson, UpstreamResult } from './upstream';

interface JobApplication {
  id: string;
  jobId: string;
  status: string;
  submittedAt: string;
}

export interface JobApplicationView extends JobApplication {
  jobTitle: string | null;
  employer: string | null;
}

interface EiClaim {
  id: string;
  status: string;
  weeklyBenefitAmount: number;
  appliedAt: string;
}

export type EiReportingStatusLabel = 'not_yet_due' | 'due_soon' | 'overdue';

export interface EiReportingStatus {
  claimId: string;
  nextReportDue: string;
  daysUntilDue: number;
  status: EiReportingStatusLabel;
}

export interface ActiveApplication {
  type: 'job' | 'ei';
  id: string;
  summary: string;
  status: string;
}

export interface BenefitOverview {
  eligibleBenefits: UpstreamResult<string[]>;
  activeApplications: UpstreamResult<ActiveApplication[]>;
  tasks: UpstreamResult<string[]>;
  payments: UpstreamResult<Payment[]>;
  correspondence: UpstreamResult<CorrespondenceItem[]>;
  eiReportingStatus: UpstreamResult<EiReportingStatus | null>;
  jobApplications: UpstreamResult<JobApplicationView[]>;
}

/**
 * No upstream to call for this yet -- eligibility rules aren't owned by any
 * of the three domain services in this PoT. Modeled as a resolved
 * `UpstreamResult` anyway so the response shape (and the frontend's
 * per-tile rendering) doesn't need a special case for "this tile has no
 * upstream."
 */
function getEligibleBenefits(): UpstreamResult<string[]> {
  return { status: 'ok', data: ['Employment Insurance', 'Job Bank'] };
}

function getTasks(
  claim: EiClaim | null,
  reportingStatus: EiReportingStatus | null,
): UpstreamResult<string[]> {
  const tasks: string[] = [];
  if (claim && reportingStatus) {
    if (reportingStatus.status === 'overdue') {
      tasks.push('Your EI report is overdue — submit it as soon as possible');
    } else if (reportingStatus.status === 'due_soon') {
      tasks.push(`Submit your EI report — due in ${Math.max(reportingStatus.daysUntilDue, 0)} days`);
    } else {
      tasks.push('Submit your next EI report');
    }
  } else if (claim) {
    tasks.push('Submit your next EI report');
  } else {
    tasks.push('Consider applying for Employment Insurance');
  }
  return { status: 'ok', data: tasks };
}

function buildActiveApplications(
  jobApplications: UpstreamResult<JobApplication[]>,
  claim: UpstreamResult<EiClaim | null>,
): UpstreamResult<ActiveApplication[]> {
  // A slow/failed upstream degrades only this tile, not the whole overview
  // -- if EITHER source is unavailable, we can't honestly claim this list
  // is complete, so the whole tile reports unavailable rather than silently
  // showing a partial (and therefore misleading) list.
  if (jobApplications.status === 'unavailable' || claim.status === 'unavailable') {
    return { status: 'unavailable' };
  }

  const applications: ActiveApplication[] = jobApplications.data.map((application) => ({
    type: 'job',
    id: application.id,
    summary: `Application for ${application.jobId}`,
    status: application.status,
  }));

  if (claim.data) {
    applications.push({
      type: 'ei',
      id: claim.data.id,
      summary: 'Employment Insurance claim',
      status: claim.data.status,
    });
  }

  return { status: 'ok', data: applications };
}

/**
 * A citizen with no EI claim on file gets a 404 from employment-insurance-
 * bff -- that's an expected, meaningful state ("no claim exists yet"), not
 * a service failure, so it resolves to `{ status: 'ok', data: null }`
 * rather than `unavailable`.
 */
async function getEiClaim(sub: string): Promise<UpstreamResult<EiClaim | null>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(
      `${upstreams.employmentInsuranceBffUrl}/api/claims?applicantSub=${encodeURIComponent(sub)}`,
      { signal: controller.signal },
    );
    if (response.status === 404) {
      return { status: 'ok', data: null };
    }
    if (!response.ok) {
      return { status: 'unavailable' };
    }
    return { status: 'ok', data: (await response.json()) as EiClaim };
  } catch {
    return { status: 'unavailable' };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * There's no due-date/cadence concept anywhere else in this PoT --
 * employment-insurance-bff's own `/api/reporting-status` synthesizes one
 * (see its reporting-status.ts). A citizen with no EI claim on file gets a
 * 404 there too, same "legitimate empty state" treatment as `getEiClaim`.
 */
async function getEiReportingStatus(sub: string): Promise<UpstreamResult<EiReportingStatus | null>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(
      `${upstreams.employmentInsuranceBffUrl}/api/reporting-status?applicantSub=${encodeURIComponent(sub)}`,
      { signal: controller.signal },
    );
    if (response.status === 404) {
      return { status: 'ok', data: null };
    }
    if (!response.ok) {
      return { status: 'unavailable' };
    }
    return { status: 'ok', data: (await response.json()) as EiReportingStatus };
  } catch {
    return { status: 'unavailable' };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getBenefitOverview(sub: string): Promise<BenefitOverview> {
  const [claim, jobApplications, eiReportingStatus] = await Promise.all([
    getEiClaim(sub),
    fetchJson<JobApplicationView[]>(
      `${upstreams.jobBankBffUrl}/api/applications?applicantSub=${encodeURIComponent(sub)}`,
    ),
    getEiReportingStatus(sub),
  ]);

  return {
    eligibleBenefits: getEligibleBenefits(),
    activeApplications: buildActiveApplications(jobApplications, claim),
    tasks: getTasks(
      claim.status === 'ok' ? claim.data : null,
      eiReportingStatus.status === 'ok' ? eiReportingStatus.data : null,
    ),
    // Local data -- can't fail, so always 'ok', unlike the job-bank-bff/
    // employment-insurance-bff-sourced tiles above.
    payments: { status: 'ok', data: getPayments(sub) },
    correspondence: { status: 'ok', data: getCorrespondence(sub) },
    eiReportingStatus,
    jobApplications,
  };
}
