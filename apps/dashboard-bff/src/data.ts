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

/**
 * A single mock persona for this PoT -- matches the mock session issued by
 * `createMockSession()` in `libs/shared/auth`. In-memory, reset on restart.
 */
const payments = new Map<string, Payment[]>([
  [
    'mock-citizen-001',
    [
      {
        id: 'pay-001',
        date: '2026-07-15',
        benefit: 'Employment Insurance',
        program: 'EI',
        status: 'pending',
        amount: 638.0,
      },
      {
        id: 'pay-002',
        date: '2026-07-01',
        benefit: 'Employment Insurance',
        program: 'EI',
        status: 'complete',
        amount: 638.0,
      },
    ],
  ],
]);

const correspondence = new Map<string, CorrespondenceItem[]>([
  [
    'mock-citizen-001',
    [
      { id: 'corr-001', date: '2026-07-10', subject: 'Your EI application has been approved' },
      { id: 'corr-002', date: '2026-06-28', subject: 'We received your EI application' },
    ],
  ],
]);

export function getPayments(sub: string): Payment[] {
  return payments.get(sub) ?? [];
}

export function getCorrespondence(sub: string): CorrespondenceItem[] {
  return correspondence.get(sub) ?? [];
}
