import cors from 'cors';
import express, { Express } from 'express';
import { getBenefitOverview } from './overview';

/**
 * MSCA-D's own BFF: composes the cross-benefit overview by calling
 * job-bank-bff, employment-insurance-bff, and client-profile-service over
 * real HTTP -- see overview.ts and CLAUDE.md's "Backends: BFF pattern"
 * section for the partial-failure contract this depends on.
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

  return app;
}
