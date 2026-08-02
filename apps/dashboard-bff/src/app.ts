import cors from 'cors';
import express, { Express } from 'express';
import { getBenefitOverview } from './overview';
import { getPayments } from './payments';

/**
 * MSCA-D's own BFF: composes the cross-benefit overview and proxies the
 * standalone payment-history widget by calling job-bank-bff,
 * employment-insurance-bff, and client-profile-service over real HTTP --
 * see overview.ts/payments.ts and CLAUDE.md's "Backends: BFF pattern"
 * section. client-profile-service is BFF-only: no frontend calls it
 * directly, this is the one hop in front of it for payment history.
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
    try {
      res.json(await getPayments(sub));
    } catch {
      res.status(502).json({ error: 'payment history is temporarily unavailable' });
    }
  });

  return app;
}
