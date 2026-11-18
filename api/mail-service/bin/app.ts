#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { config } from '../../src/config/config';
import { MailServiceStack } from '../lib/mail-service-stack';

const { MAIL_FROM, AWS_REGION } = config.get();
if (!MAIL_FROM) {
  throw new Error('MAIL_FROM is not set. Add it to the repo-root .env.');
}

const app = new App();

new MailServiceStack(app, 'NeurocyteMailService', {
  mailFrom: MAIL_FROM,
  local: ['true', true].includes(app.node.tryGetContext('local')),
  env: { region: AWS_REGION },
});
