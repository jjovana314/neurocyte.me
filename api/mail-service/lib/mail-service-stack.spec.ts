import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { MailServiceStack } from './mail-service-stack';

describe('MailServiceStack', () => {
  const template = Template.fromStack(
    new MailServiceStack(new App(), 'Test', { mailFrom: 'noreply@test.io' }),
  );

  it('creates the mail queue with a dead-letter queue', () => {
    template.hasResourceProperties('AWS::SQS::Queue', {
      QueueName: 'neurocyte-mail',
      VisibilityTimeout: 60,
      RedrivePolicy: Match.objectLike({ maxReceiveCount: 3 }),
    });
    template.hasResourceProperties('AWS::SQS::Queue', {
      QueueName: 'neurocyte-mail-dlq',
    });
  });

  it('wires the Lambda to the queue with partial batch failure reporting', () => {
    template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
      BatchSize: 10,
      FunctionResponseTypes: ['ReportBatchItemFailures'],
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: { Variables: { MAIL_FROM: 'noreply@test.io' } },
    });
  });

  it('verifies the sender identity and lets the Lambda send through SES', () => {
    template.hasResourceProperties('AWS::SES::EmailIdentity', {
      EmailIdentity: 'noreply@test.io',
    });
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: ['ses:SendEmail', 'ses:SendRawEmail'],
          }),
        ]),
      },
    });
  });
});
