const request = require('supertest');
const path = require('path');
const app = require('../src/app');
const config = require('../src/config/env');
const { buildVerificationLink } = require('../src/controllers/auth.controller');
const { sendEmail } = require('../src/services/email.service');

describe('environment-driven browser access', () => {
  it('selects only the APP_ENV-slugged file', () => {
    expect(config.appEnv).toBe('test');
    expect(path.basename(config.envPath)).toBe('.env.test');
  });

  it('allows configured LAN origins with credentials', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', 'http://192.168.1.25:5173')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://192.168.1.25:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('rejects unconfigured browser origins', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).get('/health').set('Origin', 'https://untrusted.example');
    expect(res.status).toBe(500);
    errorSpy.mockRestore();
  });
});

describe('verification delivery', () => {
  it('always generates a public frontend verification link', () => {
    expect(buildVerificationLink('header.payload.signature')).toBe(
      'https://app.test/verify-email?token=header.payload.signature'
    );
  });

  it('writes a usable message to the terminal when no mail provider is configured', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = await sendEmail({
      to: 'candidate@example.test',
      subject: 'Verify your email for HireSignal',
      text: 'Open https://app.test/verify-email?token=test-token',
      html: '<p>Verification</p>',
    });

    expect(result).toEqual(expect.objectContaining({ success: true, delivery: 'console' }));
    expect(logSpy.mock.calls.flat().join(' ')).toContain('verify-email?token=test-token');
    logSpy.mockRestore();
  });
});
