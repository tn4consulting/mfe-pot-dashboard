import { sessionCache } from './config';

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
 * `createMockSession()` in `libs/shared/auth`. Seeded lazily into the
 * cache on that persona's first read (see below) rather than up front, so
 * a fresh cache (a freshly deployed pod, or right after `/api/reset`)
 * still demos correctly without a separate seed step.
 */
const SEED_SUB = 'mock-citizen-001';

const SEED_PAYMENTS: Payment[] = [
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
];

const SEED_CORRESPONDENCE: CorrespondenceItem[] = [
  { id: 'corr-001', date: '2026-07-10', subject: 'Your EI application has been approved' },
  { id: 'corr-002', date: '2026-06-28', subject: 'We received your EI application' },
];

export async function getPayments(sub: string): Promise<Payment[]> {
  const key = sessionCache.buildKey('payments', sub);
  const existing = await sessionCache.getJson<Payment[]>(key);
  if (existing) {
    return existing;
  }
  const seeded = sub === SEED_SUB ? SEED_PAYMENTS : [];
  await sessionCache.setJson(key, seeded);
  return seeded;
}

export async function getCorrespondence(sub: string): Promise<CorrespondenceItem[]> {
  const key = sessionCache.buildKey('correspondence', sub);
  const existing = await sessionCache.getJson<CorrespondenceItem[]>(key);
  if (existing) {
    return existing;
  }
  const seeded = sub === SEED_SUB ? SEED_CORRESPONDENCE : [];
  await sessionCache.setJson(key, seeded);
  return seeded;
}
