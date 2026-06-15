import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { config } from 'src/config/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      // host: config.get().MAIL_HOST,
      auth: {
        user: config.get().MAIL_FROM,
        pass: config.get().MAIL_PASS,
      },
    });
  }

  async sendPasswordResetEmail(
    toEmail: string,
    resetLink: string,
    userName: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: config.get().MAIL_FROM,
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
    await this.transporter.sendMail({
      from: config.get().MAIL_FROM,
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
}
