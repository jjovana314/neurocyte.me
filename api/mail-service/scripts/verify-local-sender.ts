/**
 * Verifies the sender address in LocalStack SES after `npm run local:deploy`.
 *
 * In real AWS the stack creates an AWS::SES::EmailIdentity, but that resource
 * is backed by SESv2, which the free LocalStack edition doesn't emulate. The
 * SES v1 VerifyEmailIdentity API is emulated (and verifies instantly).
 */
import { SESClient, VerifyEmailIdentityCommand } from '@aws-sdk/client-ses';
import { config } from '../../src/config/config';
import { createLogger } from '../../src/logger/logger.config';

const logger = createLogger('verify-local-sender');

async function main(): Promise<void> {
  const { MAIL_FROM: mailFrom, AWS_REGION, AWS_ENDPOINT_URL } = config.get();
  if (!mailFrom) {
    throw new Error('MAIL_FROM is not set. Add it to the repo-root .env.');
  }
  if (!AWS_ENDPOINT_URL) {
    // Never verify against real AWS by accident: that sends a real email.
    throw new Error(
      'AWS_ENDPOINT_URL is not set. Point it at LocalStack in .env.',
    );
  }

  const ses = new SESClient({
    region: AWS_REGION,
    endpoint: AWS_ENDPOINT_URL,
    // LocalStack accepts any keys.
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  });

  await ses.send(new VerifyEmailIdentityCommand({ EmailAddress: mailFrom }));
  logger.info({ mailFrom }, 'Verified SES sender in LocalStack');
}

// Set exitCode instead of calling process.exit() so the log line is flushed.
main().catch((err: unknown) => {
  logger.error({ err }, 'Failed to verify SES sender');
  process.exitCode = 1;
});
