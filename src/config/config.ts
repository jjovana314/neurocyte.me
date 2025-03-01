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
