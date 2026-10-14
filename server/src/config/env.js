import { config } from 'dotenv';
config();

const required = [
  'PORT',
  'MONGODB_URI',
  'REDIS_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CLIENT_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: parseInt(process.env.PORT, 10),
  mongoUri: process.env.MONGODB_URI,
  redisUrl: process.env.REDIS_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  clientUrl: process.env.CLIENT_URL,
  frontendUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://projectify-steel.vercel.app',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') && (!process.env.GOOGLE_CALLBACK_URL || process.env.GOOGLE_CALLBACK_URL.includes('localhost'))
      ? 'https://projectify-api-yogd.onrender.com/api/auth/google/callback'
      : (process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'),
  },
  email: {
    provider: process.env.EMAIL_PROVIDER || (process.env.BREVO_API_KEY ? 'brevo' : (process.env.RESEND_API_KEY ? 'resend' : 'smtp')),
    brevoApiKey: process.env.BREVO_API_KEY,
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || 'Projectify <haritgevariya007@gmail.com>',
    debugSecret: process.env.DEBUG_SECRET || '',
    enableDebug: process.env.ENABLE_DEBUG_ENDPOINTS === 'true',
  },
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
