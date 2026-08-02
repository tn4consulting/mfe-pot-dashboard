export type UpstreamResult<T> = { status: 'ok'; data: T } | { status: 'unavailable' };

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

export interface Payment {
  id: string;
  date: string;
  benefit: string;
  amount: number;
}

export interface CorrespondenceItem {
  id: string;
  date: string;
  subject: string;
}
