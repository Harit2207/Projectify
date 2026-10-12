import { describe, it, expect } from 'vitest';
import request from 'supertest';
import './helpers/setup.js';
import { app } from '../app.js';
import { createUserAndLogin } from './helpers/auth.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

describe('Authentication', () => {

  // ── LOGIN ────────────────────────────────────────────────────────

  it('returns 201 and sets cookie on valid signup', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ name: 'Test User', email: 'new@test.com', password: 'Test@1234' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('new@test.com');
    expect(res.body.data.user.password).toBeUndefined(); // never exposed
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('returns 409 when email already registered', async () => {
    await createUserAndLogin({ email: 'dup@test.com' });

    const res = await request(app)
      .post('/api/auth/signup')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ name: 'Dup', email: 'dup@test.com', password: 'Test@1234' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('CONFLICT');
  });

  it('returns 200 and sets cookies on valid login', async () => {
    await createUserAndLogin({ email: 'login@test.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'login@test.com', password: 'Test@1234' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const cookies = res.headers['set-cookie'].join('');
    expect(cookies).toContain('accessToken');
    expect(cookies).toContain('HttpOnly');
  });

  it('returns 401 with wrong password', async () => {
    await createUserAndLogin({ email: 'wrongpw@test.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'wrongpw@test.com', password: 'WrongPassword9' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    // Same message as wrong email — prevents user enumeration
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('returns same error for wrong email as wrong password (no user enumeration)', async () => {
    const wrongEmail = await request(app)
      .post('/api/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'nobody@nowhere.com', password: 'Test@1234' });

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'wrongpw@test.com', password: 'WrongPassword9' });

    // Both 401, both same message
    expect(wrongEmail.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(wrongEmail.body.message).toBe(wrongPassword.body.message);
  });

  it('returns 422 with missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'notvalid' }); // no password, invalid email

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  // ── TOKEN EXPIRY ─────────────────────────────────────────────────

  it('returns 401 with expired access token', async () => {
    // Manually sign a token with 0 expiry
    const expiredToken = jwt.sign(
      { userId: '64f1a2b3c4d5e6f7a8b9c0d1' },
      env.jwt.accessSecret,
      { expiresIn: '0s' }
    );

    // Wait 1 second so it is definitely expired
    await new Promise(r => setTimeout(r, 1100));

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `accessToken=${expiredToken}`)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 with tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'accessToken=this.is.not.a.valid.jwt')
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(res.status).toBe(401);
  });

  it('returns 401 with no token on protected route', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });

  // ── GET ME ───────────────────────────────────────────────────────

  it('returns current user on GET /auth/me with valid cookie', async () => {
    const { cookie, email } = await createUserAndLogin({ email: 'me@test.com' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  // ── LOGOUT ───────────────────────────────────────────────────────

  it('clears cookies on logout', async () => {
    const { cookie } = await createUserAndLogin({ email: 'logout@test.com' });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(res.status).toBe(200);
    const setCookies = res.headers['set-cookie'].join('');
    // Cookies should be cleared (Max-Age=0 or expires in past)
    expect(setCookies).toMatch(/Max-Age=0|expires=.*1970/i);
  });
});