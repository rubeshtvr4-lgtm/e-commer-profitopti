import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupMockDb } from './mockDb.js';

describe('Authentication & User Security Tests', () => {
  let app: any;

  beforeAll(() => {
    setupMockDb();
    app = createApp();
  });

  const testUser = {
    name: 'Alice Seller',
    email: 'alice@store.com',
    password: 'Password123!',
    businessName: 'Alice Boutique',
  };

  it('successfully registers a new seller account', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.name).toBe(testUser.name);
    // Crucial security requirement: passwordHash is NEVER exposed in API response!
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.token).toBeDefined();

    // Verify cookie was set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('token=');
  });

  it('prevents registration with duplicate email address', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('already exists');
  });

  it('successfully logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects login with invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword999',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid email or password');
  });

  it('rejects access to protected routes without authentication token', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Authentication required');
  });

  it('allows access to /auth/me with valid bearer token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(meRes.body.data.user.passwordHash).toBeUndefined();
  });
});
