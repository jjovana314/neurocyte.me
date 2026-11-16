import { Injectable } from '@nestjs/common';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { config } from 'src/config/config';

/**
 * Shape of a message on the mail queue. Must match `EmailMessage` in
 * api/mail-service/lambda/send-email.ts, which consumes the queue and sends the
 * email through SES.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends emails asynchronously: instead of talking to SMTP during the HTTP
 * request, it drops a message on SQS and the mail-service Lambda delivers it.
 */
@Injectable()
export class MailService {
  private readonly sqs: SQSClient;

  constructor() {
    const { AWS_REGION, AWS_ENDPOINT_URL } = config.get();
    this.sqs = new SQSClient({
      region: AWS_REGION,
      // Points the SDK at LocalStack locally; empty means real AWS.
      ...(AWS_ENDPOINT_URL ? { endpoint: AWS_ENDPOINT_URL } : {}),
    });
  }

  async sendPasswordResetEmail(
    toEmail: string,
    resetLink: string,
    userName: string,
  ): Promise<void> {
    await this.enqueue({
      to: toEmail,
      subject: 'Password Reset Request',
      html: `
        <p>Hello <strong>${userName}</strong>,</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link expires in <strong>1 hour</strong>. If you did not request this, you can safely ignore this email.</p>
      `,
    });
  }

  async sendDeactivationEmail(
    adminEmail: string,
    deactivationLink: string,
    userName: string,
  ): Promise<void> {
    await this.enqueue({
      to: adminEmail,
      subject: 'User Deactivation Request',
      html: `
        <p>User <strong>${userName}</strong> has requested their account to be deactivated.</p>
        <p>Click the link below to confirm and permanently remove their account:</p>
        <p><a href="${deactivationLink}">${deactivationLink}</a></p>
        <p>If you did not expect this request, you can ignore this email.</p>
      `,
    });
  }

  private async enqueue(message: EmailMessage): Promise<void> {
    await this.sqs.send(
      new SendMessageCommand({
        QueueUrl: config.get().MAIL_QUEUE_URL,
        MessageBody: JSON.stringify(message),
      }),
    );
  }
}
