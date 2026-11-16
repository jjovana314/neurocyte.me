import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { MailService } from './mail.service';
import { config } from 'src/config/config';

jest.mock('@aws-sdk/client-sqs');

describe('MailService', () => {
  const send = jest.fn();
  const queueUrl = 'http://localhost:4566/000000000000/neurocyte-mail';

  beforeEach(() => {
    jest.clearAllMocks();
    (SQSClient as unknown as jest.Mock).mockImplementation(() => ({ send }));
    jest.spyOn(config, 'get').mockReturnValue({
      ...config.get(),
      AWS_REGION: 'us-east-1',
      AWS_ENDPOINT_URL: 'http://localhost:4566',
      MAIL_QUEUE_URL: queueUrl,
    });
  });

  afterEach(() => jest.restoreAllMocks());

  const sentMessage = () => {
    expect(send).toHaveBeenCalledTimes(1);
    const input = (SendMessageCommand as unknown as jest.Mock).mock.calls[0][0];
    expect(input.QueueUrl).toBe(queueUrl);
    return JSON.parse(input.MessageBody);
  };

  it('creates an SQS client pointed at the configured region and endpoint', () => {
    new MailService();
    expect(SQSClient).toHaveBeenCalledWith({
      region: 'us-east-1',
      endpoint: 'http://localhost:4566',
    });
  });

  it('omits the endpoint when none is configured (real AWS)', () => {
    (config.get as jest.Mock).mockReturnValue({
      ...config.get(),
      AWS_REGION: 'eu-central-1',
      AWS_ENDPOINT_URL: '',
    });
    new MailService();
    expect(SQSClient).toHaveBeenCalledWith({ region: 'eu-central-1' });
  });

  it('queues a password-reset email addressed to the user with the reset link in the body', async () => {
    await new MailService().sendPasswordResetEmail(
      'user@x.io',
      'https://app/reset?token=abc',
      'Ada',
    );

    const message = sentMessage();
    expect(message.to).toBe('user@x.io');
    expect(message.subject).toBe('Password Reset Request');
    expect(message.html).toContain('https://app/reset?token=abc');
    expect(message.html).toContain('Ada');
  });

  it('queues a deactivation email addressed to the admin with the confirmation link', async () => {
    await new MailService().sendDeactivationEmail(
      'admin@x.io',
      'https://app/deactivate/xyz',
      'Ada',
    );

    const message = sentMessage();
    expect(message.to).toBe('admin@x.io');
    expect(message.subject).toBe('User Deactivation Request');
    expect(message.html).toContain('https://app/deactivate/xyz');
  });

  it('propagates SQS failures to the caller', async () => {
    send.mockRejectedValueOnce(new Error('queue unavailable'));
    await expect(
      new MailService().sendPasswordResetEmail('u@x.io', 'link', 'Ada'),
    ).rejects.toThrow('queue unavailable');
  });
});
