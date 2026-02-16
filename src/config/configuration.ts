import { NodeEnv, validateEnv } from './env.schema';

export default () => {
  const raw = {
    NODE_ENV: process.env.NODE_ENV ?? NodeEnv.Development,
    PORT: parseInt(process.env.PORT ?? '3000', 10),
    DATABASE_HOST: process.env.DATABASE_HOST ?? 'localhost',
    DATABASE_PORT: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    DATABASE_USER: process.env.DATABASE_USER ?? 'postgres',
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ?? '',
    DATABASE_NAME: process.env.DATABASE_NAME ?? 'columbarium',
    DATABASE_URL:
      process.env.DATABASE_URL ??
      `postgresql://${encodeURIComponent(process.env.DATABASE_USER ?? 'postgres')}:${encodeURIComponent(process.env.DATABASE_PASSWORD ?? '')}@${process.env.DATABASE_HOST ?? 'localhost'}:${process.env.DATABASE_PORT ?? '5432'}/${process.env.DATABASE_NAME ?? 'columbarium'}`,
    JWT_SECRET: process.env.JWT_SECRET ?? 'change-me-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
    EMAIL_VERIFICATION_EXPIRES_IN:
      process.env.EMAIL_VERIFICATION_EXPIRES_IN ?? '24h',
    SMTP_HOST: process.env.SMTP_HOST ?? '',
    SMTP_PORT: parseInt(process.env.SMTP_PORT ?? '587', 10),
    SMTP_USER: process.env.SMTP_USER ?? '',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ?? '',
    SMTP_FROM: process.env.SMTP_FROM ?? '',
    APP_FRONTEND_URL: process.env.APP_FRONTEND_URL ?? 'http://localhost:3000',
  };

  const validated = validateEnv(raw as Record<string, unknown>);
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ??
    `postgresql://${encodeURIComponent(validated.DATABASE_USER)}:${encodeURIComponent(validated.DATABASE_PASSWORD)}@${validated.DATABASE_HOST}:${validated.DATABASE_PORT}/${validated.DATABASE_NAME}`;
  return validated;
};
