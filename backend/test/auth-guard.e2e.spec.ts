import { describe, it, expect } from 'vitest';

// Test against running backend server
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// Skip if no server is running
const canRunE2E = process.env.RUN_E2E === 'true';

describe.skipIf(!canRunE2E)('Auth Guard E2E Tests (against running server)', () => {
  // Helper function
  const api = (method: string, path: string, token?: string, body?: any) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Cookie'] = `better-auth.session_token=${token}`;
    const options: any = { method, headers };
    if (body) options.body = JSON.stringify(body);
    return fetch(`${BASE_URL}${path}`, options);
  };

  describe('Public Routes (no auth required)', () => {
    it('GET /api/v1/jobs → 200', async () => {
      const res = await api('GET', '/api/v1/jobs');
      expect(res.status).toBe(200);
    });

    it('GET /api/v1/categories → 200', async () => {
      const res = await api('GET', '/api/v1/categories');
      expect(res.status).toBe(200);
    });

    it('GET /api/v1/pricing → 200', async () => {
      const res = await api('GET', '/api/v1/pricing');
      expect(res.status).toBe(200);
    });

    it('GET /api/v1/address/provinces → 200', async () => {
      const res = await api('GET', '/api/v1/address/provinces');
      expect(res.status).toBe(200);
    });

    it('GET /api/v1/blogs → 200', async () => {
      const res = await api('GET', '/api/v1/blogs');
      expect(res.status).toBe(200);
    });
  });

  describe('Auth Required Routes (no token → 401)', () => {
    it('GET /api/v1/auth/me → 401', async () => {
      const res = await api('GET', '/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/users → 401', async () => {
      const res = await api('GET', '/api/v1/users');
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/jobs → 401', async () => {
      const res = await api('POST', '/api/v1/jobs', undefined, { title: 'Test' });
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/companies → 401', async () => {
      const res = await api('POST', '/api/v1/companies', undefined, { name: 'Test' });
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/applications → 401', async () => {
      const res = await api('POST', '/api/v1/applications', undefined, { jobId: 'test' });
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/audit → 401', async () => {
      const res = await api('GET', '/api/v1/audit');
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/payments/checkout → 401', async () => {
      const res = await api('POST', '/api/v1/payments/checkout', undefined, { jobId: 'test', packageId: 'test' });
      expect(res.status).toBe(401);
    });
  });
});
