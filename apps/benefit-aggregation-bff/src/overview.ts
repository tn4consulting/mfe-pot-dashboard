import { upstreams } from './config';
import { fetchJson, UpstreamResult } from './upstream';

interface JobApplication {
  id: string;
  jobId: string;
  status: string;
  submittedAt: string;
}

interface EiClaim {
  id: string;
  status: string;
  weeklyBenefitAmount: number;
  appliedAt: string;
}

interface Payment {
  id: string;
  date: string;
  benefit: string;
  amount: number;
}

interface CorrespondenceItem {
  id: string;
  date: string;
  subject: string;
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

function getTasks(claim: EiClaim | null): UpstreamResult<string[]> {
  const tasks: string[] = [];
  if (claim) {
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

export async function getBenefitOverview(sub: string): Promise<BenefitOverview> {
  const [payments, correspondence, claim, jobApplications] = await Promise.all([
    fetchJson<Payment[]>(
      `${upstreams.clientProfileServiceUrl}/api/profile/${encodeURIComponent(sub)}/payments`,
    ),
    fetchJson<CorrespondenceItem[]>(
      `${upstreams.clientProfileServiceUrl}/api/profile/${encodeURIComponent(sub)}/correspondence`,
    ),
    getEiClaim(sub),
    fetchJson<JobApplication[]>(
      `${upstreams.jobBankBffUrl}/api/applications?applicantSub=${encodeURIComponent(sub)}`,
    ),
  ]);

  return {
    eligibleBenefits: getEligibleBenefits(),
    activeApplications: buildActiveApplications(jobApplications, claim),
    tasks: getTasks(claim.status === 'ok' ? claim.data : null),
    payments,
    correspondence,
  };
}
