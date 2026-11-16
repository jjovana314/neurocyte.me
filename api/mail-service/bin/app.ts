#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { MailServiceStack } from '../lib/mail-service-stack';

const app = new App();

new MailServiceStack(app, 'NeurocyteMailService', {
  mailFrom:
    process.env.MAIL_FROM ?? (app.node.tryGetContext('mailFrom') as string),
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
});
