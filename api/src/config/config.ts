import { createProfiguration } from '@golevelup/profiguration';
import { Config } from './config.interface';

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
      // Single env file lives in the repo root; scripts run with cwd = api/.
      files: process.env.ENV_FILE ?? '../.env',
    }),
  },
);
