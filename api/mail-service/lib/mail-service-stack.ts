import * as path from 'path';
import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface MailServiceStackProps extends StackProps {
  /** Sender address; must be a verified SES identity. */
  mailFrom: string;
  /**
   * Deploying to LocalStack. AWS::SES::EmailIdentity is backed by SESv2, which
   * the free LocalStack edition doesn't emulate (and it doesn't run custom
   * resources either), so the resource is skipped and `npm run local:deploy`
   * verifies the sender afterwards via scripts/verify-local-sender.ts.
   */
  local?: boolean;
}

export const MAIL_QUEUE_NAME = 'neurocyte-mail';

export class MailServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: MailServiceStackProps) {
    super(scope, id, props);

    const deadLetterQueue = new sqs.Queue(this, 'MailDeadLetterQueue', {
      queueName: `${MAIL_QUEUE_NAME}-dlq`,
      retentionPeriod: Duration.days(14),
    });

    const queue = new sqs.Queue(this, 'MailQueue', {
      queueName: MAIL_QUEUE_NAME,
      // Must be >= the Lambda timeout, or messages reappear mid-processing.
      visibilityTimeout: Duration.seconds(60),
      deadLetterQueue: { queue: deadLetterQueue, maxReceiveCount: 3 },
    });

    if (!props.local) {
      new ses.EmailIdentity(this, 'SenderIdentity', {
        identity: ses.Identity.email(props.mailFrom),
      });
    }

    const sendEmail = new NodejsFunction(this, 'SendEmailFunction', {
      entry: path.join(__dirname, '../lambda/send-email.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: { MAIL_FROM: props.mailFrom },
      bundling: {
        // Bundle our pinned SDK instead of relying on the runtime's copy.
        externalModules: [],
      },
    });

    sendEmail.addEventSource(
      new SqsEventSource(queue, {
        batchSize: 10,
        reportBatchItemFailures: true,
      }),
    );

    sendEmail.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      }),
    );

    new CfnOutput(this, 'MailQueueUrl', { value: queue.queueUrl });
    new CfnOutput(this, 'MailDeadLetterQueueUrl', {
      value: deadLetterQueue.queueUrl,
    });
  }
}
