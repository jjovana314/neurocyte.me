import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { config } from 'src/config/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.get().MAIL_HOST,
      port: Number(config.get().MAIL_PORT),
      auth: {
        user: config.get().MAIL_USER,
        pass: config.get().MAIL_PASS,
      },
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
