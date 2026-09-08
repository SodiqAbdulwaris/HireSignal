const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

const appEnv = (process.env.APP_ENV || 'local').trim();

if (!/^[a-z0-9_-]+$/i.test(appEnv)) {
  throw new Error('APP_ENV may contain only letters, numbers, underscores, and hyphens.');
}

// Configuration is intentionally loaded from a named environment file only.
// This keeps a forgotten plain `.env` from changing the runtime configuration.
const envPath = path.resolve(__dirname, `../../.env.${appEnv}`);
dotenv.config({ path: envPath });

function normalizeOrigin(value, variableName) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`${variableName} contains an invalid origin: ${trimmed}`);
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${variableName} entries must be origins with an http(s) scheme and no path, query, or hash.`);
  }

  return url.origin;
}

function parseAllowedOrigins(frontendUrl, configuredOrigins) {
  const values = [frontendUrl, ...(configuredOrigins || '').split(',')];
  return [...new Set(values.map((value) => normalizeOrigin(value, 'CORS_ALLOWED_ORIGINS')).filter(Boolean))];
}

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string(),
  AI_SERVICE_URL: z.string().transform((val) => {
    const trimmed = val.trim().replace(/\/$/, '');
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }).default('http://localhost:8000'),
  AI_SERVICE_TIMEOUT_MS: z.string().transform((val) => parseInt(val, 10)).default('30000'),
  MAX_FILE_SIZE_BYTES: z.string().transform((val) => parseInt(val, 10)).default('5242880'),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  CONTACT_FEEDBACK_TO_EMAIL: z.string().optional(),
  DEFAULT_PAGE_LIMIT: z.string().transform((val) => parseInt(val, 10)).default('20'),
  MAX_PAGE_LIMIT: z.string().transform((val) => parseInt(val, 10)).default('100'),
  ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  FRONTEND_URL: z.string().min(1, 'FRONTEND_URL is required.'),
  CORS_ALLOWED_ORIGINS: z.string().default(''),
  AUTH_COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).optional(),
  AUTH_COOKIE_SECURE: z.enum(['true', 'false']).optional(),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Environment validation error:", parsed.error.format());
  process.exit(1);
}

const env = parsed.data;
const allowedOrigins = parseAllowedOrigins(env.FRONTEND_URL, env.CORS_ALLOWED_ORIGINS);
const isProduction = process.env.NODE_ENV === 'production';

const config = {
  envPath,
  appEnv,
  port: env.PORT,
  mongodbUri: env.MONGODB_URI,
  jwtSecret: env.JWT_SECRET,
  aiServiceUrl: env.AI_SERVICE_URL,
  aiServiceTimeoutMs: env.AI_SERVICE_TIMEOUT_MS,
  maxFileSizeBytes: env.MAX_FILE_SIZE_BYTES,
  resendApiKey: env.RESEND_API_KEY,
  resendFromEmail: env.RESEND_FROM_EMAIL,
  contactReceiverEmail: env.CONTACT_FEEDBACK_TO_EMAIL,
  defaultPageLimit: env.DEFAULT_PAGE_LIMIT,
  maxPageLimit: env.MAX_PAGE_LIMIT,
  accessTokenExpiry: env.ACCESS_TOKEN_EXPIRY,
  frontendUrl: env.FRONTEND_URL,
  allowedOrigins,
  authCookieSameSite: env.AUTH_COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax'),
  authCookieSecure: env.AUTH_COOKIE_SECURE ? env.AUTH_COOKIE_SECURE === 'true' : isProduction,
  smtpHost: env.SMTP_HOST,
  smtpPort: parseInt(env.SMTP_PORT, 10),
  smtpUser: env.SMTP_USER,
  smtpPass: env.SMTP_PASS,
  emailFrom: env.EMAIL_FROM || env.RESEND_FROM_EMAIL || 'noreply@hiresignal.com',
};

module.exports = config;
