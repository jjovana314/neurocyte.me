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
    MAIL_HOST: {
      default: '',
      env: 'MAIL_HOST',
    },
    MAIL_PORT: {
      default: '',
      env: 'MAIL_PORT',
    },
    MAIL_USER: {
      default: '',
      env: 'MAIL_USER',
    },
    MAIL_PASS: {
      default: '',
      env: 'MAIL_PASS',
    },
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
  },
  {
    strict: true,
    verbose: true,
    loadRelativeTo: 'cwd',
    configureEnv: () => ({
      files: `.env`,
    }),
  },
);
