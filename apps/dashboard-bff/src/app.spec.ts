import request from 'supertest';
import { createApp } from './app';

jest.mock('./overview', () => ({
  getBenefitOverview: jest.fn().mockResolvedValue({ eligibleBenefits: { status: 'ok', data: [] } }),
}));

const mockGetPayments = jest.fn();
jest.mock('./data', () => ({
  getPayments: (sub: string) => mockGetPayments(sub),
}));

// The real JWKS-based JWT verification and the whoami response shape are
// both covered by shared-auth-server's own tests -- this only proves
// /api/whoami wires the middleware and handler together correctly.
jest.mock('@tn4consulting/shared-auth-server', () => ({
  verifyBearerToken:
    () =>
    (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
      if (req.headers.authorization === 'Bearer valid-token') {
        req.auth = { sub: 'citizen-abc123', name: 'Alex Chen', sin: '123-456-789', claims: [] };
        next();
        return;
      }
      res.status(401).json({ error: 'Invalid or expired token' });
    },
  whoamiHandler: (req: import('express').Request, res: import('express').Response) => {
    if (!req.auth) {
      res.status(401).json({ error: 'Missing verified identity' });
      return;
    }
    res.json({ sub: req.auth.sub, name: req.auth.name, sinMasked: 'MASKED' });
  },
}));

describe('dashboard-bff', () => {
  const app = createApp();

  afterEach(() => mockGetPayments.mockReset());

  it('reports healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('requires a sub query parameter', async () => {
    const res = await request(app).get('/api/overview');
    expect(res.status).toBe(400);
  });

  it('returns the composed overview for a given sub', async () => {
    const res = await request(app).get('/api/overview').query({ sub: 'mock-citizen-001' });
    expect(res.status).toBe(200);
    expect(res.body.eligibleBenefits).toEqual({ status: 'ok', data: [] });
  });

  it('requires a sub query parameter for payments', async () => {
    const res = await request(app).get('/api/payments');
    expect(res.status).toBe(400);
  });

  it('returns payments for a given sub', async () => {
    mockGetPayments.mockReturnValue([{ id: 'pay-1', date: '2026-07-15', benefit: 'EI', amount: 638 }]);
    const res = await request(app).get('/api/payments').query({ sub: 'mock-citizen-001' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 'pay-1', date: '2026-07-15', benefit: 'EI', amount: 638 }]);
  });

  it('returns the verified identity with a masked SIN for /api/whoami', async () => {
    const res = await request(app).get('/api/whoami').set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sub: 'citizen-abc123', name: 'Alex Chen', sinMasked: 'MASKED' });
  });

  it('rejects /api/whoami without a valid bearer token', async () => {
    const res = await request(app).get('/api/whoami');
    expect(res.status).toBe(401);
  });

  it('resets its own session-cache state', async () => {
    const res = await request(app).post('/api/reset');
    expect(res.status).toBe(204);
  });
});
