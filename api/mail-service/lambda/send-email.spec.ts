import { SendEmailCommand } from '@aws-sdk/client-ses';
import type { SQSEvent, SQSRecord } from 'aws-lambda';
import { createHandler, parseMessage } from './send-email';

const record = (messageId: string, body: unknown): SQSRecord =>
  ({
    messageId,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as SQSRecord;

const event = (...records: SQSRecord[]): SQSEvent => ({ Records: records });

const valid = {
  to: 'user@x.io',
  subject: 'Password Reset Request',
  html: '<a href="https://app/reset?token=abc">reset</a>',
};

describe('parseMessage', () => {
  it('accepts a complete message', () => {
    expect(parseMessage(JSON.stringify(valid))).toEqual(valid);
  });

  it.each(['to', 'subject', 'html'])('rejects a message without "%s"', (field) => {
    const body = { ...valid, [field]: undefined };
    expect(() => parseMessage(JSON.stringify(body))).toThrow(field);
  });

  it('rejects non-JSON bodies', () => {
    expect(() => parseMessage('not json')).toThrow();
  });
});

describe('send-email handler', () => {
  const send = jest.fn();
  const handler = createHandler({ send } as never, 'noreply@neurocyte.me');

  beforeEach(() => {
    send.mockReset().mockResolvedValue({});
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('sends the email through SES from the configured sender', async () => {
    const result = await handler(event(record('m1', valid)));

    expect(result.batchItemFailures).toEqual([]);
    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0] as SendEmailCommand;
    expect(command).toBeInstanceOf(SendEmailCommand);
    expect(command.input).toEqual({
      Source: 'noreply@neurocyte.me',
      Destination: { ToAddresses: ['user@x.io'] },
      Message: {
        Subject: { Data: valid.subject, Charset: 'UTF-8' },
        Body: { Html: { Data: valid.html, Charset: 'UTF-8' } },
      },
    });
  });

  it('reports only the failed records so SQS retries just those', async () => {
    send
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('SES throttled'));

    const result = await handler(
      event(record('ok', valid), record('ses-fail', valid), record('bad', 'oops')),
    );

    expect(result.batchItemFailures).toEqual([
      { itemIdentifier: 'ses-fail' },
      { itemIdentifier: 'bad' },
    ]);
  });

  it('does not log the message body (recipient / reset token)', async () => {
    send.mockRejectedValueOnce(new Error('boom'));
    await handler(event(record('m1', valid)));

    const logged = JSON.stringify([
      (console.log as jest.Mock).mock.calls,
      (console.error as jest.Mock).mock.calls,
    ]);
    expect(logged).not.toContain('user@x.io');
    expect(logged).not.toContain('token=abc');
  });
});
