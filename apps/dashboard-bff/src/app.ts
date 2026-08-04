import cors from 'cors';
import express, { Express } from 'express';
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

  app.get('/api/payments', (req, res) => {
    const sub = req.query['sub'];
    if (typeof sub !== 'string') {
      res.status(400).json({ error: 'sub query parameter is required' });
      return;
    }
    res.json(getPayments(sub));
  });

  return app;
}
