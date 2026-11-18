import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import type { Logger } from 'pino';
import { config } from '../../src/config/config';
import { createLogger } from '../../src/logger/logger.config';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export function parseMessage(body: string): EmailMessage {
  const parsed = JSON.parse(body) as Partial<EmailMessage>;
  for (const field of ['to', 'subject', 'html'] as const) {
    if (typeof parsed[field] !== 'string' || parsed[field] === '') {
      throw new Error(`Invalid email message: missing "${field}"`);
    }
  }
  return parsed as EmailMessage;
}

export function createHandler(
  ses: Pick<SESClient, 'send'>,
  from: string,
  logger: Pick<Logger, 'info' | 'error'>,
) {
  const sendRecord = async (record: SQSRecord) => {
    const { to, subject, html } = parseMessage(record.body);
    await ses.send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: { Html: { Data: html, Charset: 'UTF-8' } },
        },
      }),
    );
  };

  return async (event: SQSEvent): Promise<SQSBatchResponse> => {
    const batchItemFailures: SQSBatchResponse['batchItemFailures'] = [];

    for (const record of event.Records) {
      try {
        await sendRecord(record);
        logger.info({ messageId: record.messageId }, 'Sent email');
      } catch (error) {
        // Log only the message id: the body holds the recipient and reset token.
        logger.error(
          { messageId: record.messageId, error: (error as Error).message },
          'Failed to send email',
        );
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }

    return { batchItemFailures };
  };
}

// Inside LocalStack, the SDK picks up AWS_ENDPOINT_URL that LocalStack
// injects into the Lambda container, so no endpoint override is needed here.
// MAIL_FROM is set on the function by the stack (there's no .env in Lambda).
export const handler = createHandler(
  new SESClient({}),
  config.get().MAIL_FROM,
  createLogger('send-email'),
);
