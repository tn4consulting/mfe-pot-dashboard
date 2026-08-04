import request from 'supertest';
import { createApp } from './app';

jest.mock('./overview', () => ({
  getBenefitOverview: jest.fn().mockResolvedValue({ eligibleBenefits: { status: 'ok', data: [] } }),
}));

const mockGetPayments = jest.fn();
jest.mock('./data', () => ({
  getPayments: (sub: string) => mockGetPayments(sub),
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
});
