import request from 'supertest';
import { createApp } from './app';

jest.mock('./overview', () => ({
  getBenefitOverview: jest.fn().mockResolvedValue({ eligibleBenefits: { status: 'ok', data: [] } }),
}));

describe('benefit-aggregation-bff', () => {
  const app = createApp();

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
});
