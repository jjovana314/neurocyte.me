import { existsSync } from 'fs';
import * as path from 'path';
import { createProfiguration } from '@golevelup/profiguration';
import { Config } from './config.interface';

/**
 * The single env file lives in the repo root. This config is loaded from
 * api/ (the API and its scripts) and from api/mail-service/ (the CDK app and
 * its Lambda), so walk up from the working directory to the nearest .env.
 * Returns no files when there is none (e.g. inside the Lambda, where values
 * come from real environment variables), since strict mode throws on a
 * missing file.
 */
function findEnvFile(): string[] {
  let dir = process.cwd();
  for (;;) {
    const candidate = path.join(dir, '.env');
    if (existsSync(candidate)) {
      return [candidate];
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return [];
    }
    dir = parent;
  }
}

export const config = createProfiguration<Config>(
  {
    SECRET_KEY: {
      default: '',
      env: 'SECRET_KEY',
    },
    DATABASE_URL: {
      default: '',
      env: 'DATABASE_URL',
    },
    DATABASE_NAME: {
      default: '',
      env: 'DATABASE_NAME',
    },
    DATABASE_USERNAME: {
      default: '',
      env: 'DATABASE_USERNAME',
    },
    DATABASE_PASSWORD: {
      default: '',
      env: 'DATABASE_PASSWORD',
    },
    DATABASE_PORT: {
      default: '',
      env: 'DATABASE_PORT',
    },
    AWS_REGION: {
      default: 'us-east-1',
      env: 'AWS_REGION',
    },
    // Set to http://localhost:4566 to talk to LocalStack; leave empty for real AWS.
    AWS_ENDPOINT_URL: {
      default: '',
      env: 'AWS_ENDPOINT_URL',
    },
    // SQS queue consumed by the mail-service Lambda (see api/mail-service/).
    MAIL_QUEUE_URL: {
      default: '',
      env: 'MAIL_QUEUE_URL',
    },
    // Sender address for the mail-service (CDK stack + Lambda).
    MAIL_FROM: {
      default: '',
      env: 'MAIL_FROM',
    },
    APP_URL: {
      default: '',
      env: 'APP_URL',
    },
    FRONTEND_URL: {
      default: '',
      env: 'FRONTEND_URL',
    },
    ACCESS_TOKEN_TIME: {
      default: '',
      env: 'ACCESS_TOKEN_TIME',
    },
    REFRESH_TOKEN_TIME: {
      default: '',
      env: 'REFRESH_TOKEN_TIME',
    },
    CALCULATOR_GRPC_URL: {
      default: '',
      env: 'CALCULATOR_GRPC_URL',
    },
  },
  {
    strict: true,
    verbose: true,
    loadRelativeTo: 'cwd',
    configureEnv: () => ({
      files: process.env.ENV_FILE ?? findEnvFile(),
    }),
  },
);
