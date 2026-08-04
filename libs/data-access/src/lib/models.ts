export type UpstreamResult<T> = { status: 'ok'; data: T } | { status: 'unavailable' };

export interface ActiveApplication {
  type: 'job' | 'ei';
  id: string;
  summary: string;
  status: string;
}

export type EiReportingStatusLabel = 'not_yet_due' | 'due_soon' | 'overdue';

export interface EiReportingStatus {
  claimId: string;
  nextReportDue: string;
  daysUntilDue: number;
  status: EiReportingStatusLabel;
}

export interface JobApplicationView {
  id: string;
  jobId: string;
  status: string;
  submittedAt: string;
  jobTitle: string | null;
  employer: string | null;
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

export interface Payment {
  id: string;
  date: string;
  benefit: string;
  program: string;
  status: 'pending' | 'complete';
  amount: number;
}

export interface CorrespondenceItem {
  id: string;
  date: string;
  subject: string;
}
