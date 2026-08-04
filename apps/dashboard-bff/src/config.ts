import { InMemorySessionCache, RedisSessionCache, SessionCache } from '@tn4consulting/shared-session-cache';

export const upstreams = {
  jobBankBffUrl: process.env['JOB_BANK_BFF_URL'] ?? 'http://localhost:3001',
  employmentInsuranceBffUrl: process.env['EMPLOYMENT_INSURANCE_BFF_URL'] ?? 'http://localhost:3002',
};

/**
 * No REDIS_URL set (e.g. plain `nx serve`) falls back to an in-process
 * cache -- zero extra local setup, matching every other BFF env var's
 * dev-default pattern above.
 */
export const sessionCache: SessionCache = process.env['REDIS_URL']
  ? new RedisSessionCache({ url: process.env['REDIS_URL'], keyPrefix: 'dashboard' })
  : new InMemorySessionCache('dashboard');
