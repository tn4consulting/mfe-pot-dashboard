import cors from 'cors';
import express, { Express } from 'express';
import { verifyBearerToken, whoamiHandler } from '@tn4consulting/shared-auth-server';
import { mockIdp, sessionCache } from './config';
import { getBenefitOverview } from './overview';
import { getPayments } from './data';

/**
 * MSCA-D's own BFF: composes the cross-benefit overview by calling
 * job-bank-bff/employment-insurance-bff over real HTTP and its own local
 * payments/correspondence data (`data.ts`) -- the same in-memory-stub
 * pattern job-bank-bff/employment-insurance-bff use for their own domains.
 * See overview.ts and CLAUDE.md's "Backends: BFF pattern" section.
 */
export function createApp(): Express {
  const app = express();
  app.use(cors());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/overview', async (req, res) => {
    const sub = req.query['sub'];
    if (typeof sub !== 'string') {
      res.status(400).json({ error: 'sub query parameter is required' });
      return;
    }
    res.json(await getBenefitOverview(sub));
  });

  app.get('/api/payments', async (req, res) => {
    const sub = req.query['sub'];
    if (typeof sub !== 'string') {
      res.status(400).json({ error: 'sub query parameter is required' });
      return;
    }
    res.json(await getPayments(sub));
  });

  // Proves identity (including the SIN custom claim) actually propagated
  // from mock-idp through the browser and was independently verified here
  // -- see mfe-pot's plan doc. Deliberately mounted only on this one route,
  // not globally via app.use(): the existing domain routes above are
  // single-persona stub data that isn't keyed by sub yet (a bigger,
  // separate scope item), and CI's own smoke check calls /api/overview with
  // no sub param expecting a 400, which a blanket auth middleware would
  // turn into an unrelated 401.
  app.get(
    '/api/whoami',
    verifyBearerToken({ jwksUrl: mockIdp.jwksUrl, issuer: mockIdp.issuer, audience: mockIdp.audience }),
    whoamiHandler,
  );

  // PoT-only, no auth -- unlocks a repeatable `pnpm demo:reset` (see
  // mfe-pot/TODO.md) by clearing this BFF's own Redis-backed state between
  // local/CI runs and live demos.
  app.post('/api/reset', async (_req, res) => {
    await sessionCache.reset();
    res.status(204).send();
  });

  return app;
}
