import { createProfiguration } from '@golevelup/profiguration';
import { Config } from './config.interface';

export const config = createProfiguration<Config>(
  {
    SECRET_KEY: {
      default: '',
      env: 'SECRET_KEY',
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
