import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync } from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvSchema {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsNumber()
  PORT: number = 3000;

  @IsString()
  DATABASE_HOST: string = 'localhost';

  @IsNumber()
  DATABASE_PORT: number = 5432;

  @IsString()
  DATABASE_USER: string = 'postgres';

  @IsString()
  DATABASE_PASSWORD: string = '';

  @IsString()
  DATABASE_NAME: string = 'columbarium';

  @IsString()
  JWT_SECRET: string = 'change-me-in-production';

  @IsString()
  JWT_EXPIRES_IN: string = '7d';

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string = '30d';

  @IsString()
  EMAIL_VERIFICATION_EXPIRES_IN: string = '24h';

  @IsString()
  SMTP_HOST: string = '';

  @IsNumber()
  SMTP_PORT: number = 587;

  @IsString()
  SMTP_USER: string = '';

  @IsString()
  SMTP_PASSWORD: string = '';

  @IsString()
  SMTP_FROM: string = '';

  @IsString()
  APP_FRONTEND_URL: string = 'http://localhost:3000';
}

export function validateEnv(config: Record<string, unknown>): EnvSchema {
  const validated = plainToInstance(EnvSchema, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { whitelist: true });
  if (errors.length > 0) {
    throw new Error(
      `Env validation failed:\n${errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('\n')}`,
    );
  }

  return validated;
}
