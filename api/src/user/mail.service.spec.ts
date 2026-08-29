import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer');

describe('MailService', () => {
  const sendMail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
  });

  it('creates a transport on construction', () => {
    new MailService();
    expect(nodemailer.createTransport).toHaveBeenCalled();
  });

  it('sends a password-reset email addressed to the user with the reset link in the body', async () => {
    await new MailService().sendPasswordResetEmail(
      'user@x.io',
      'https://app/reset?token=abc',
      'Ada',
    );

    expect(sendMail).toHaveBeenCalledTimes(1);
    const message = sendMail.mock.calls[0][0];
    expect(message.to).toBe('user@x.io');
    expect(message.subject).toBe('Password Reset Request');
    expect(message.html).toContain('https://app/reset?token=abc');
    expect(message.html).toContain('Ada');
  });

  it('sends a deactivation email addressed to the admin with the confirmation link', async () => {
    await new MailService().sendDeactivationEmail(
      'admin@x.io',
      'https://app/deactivate/xyz',
      'Ada',
    );

    const message = sendMail.mock.calls[0][0];
    expect(message.to).toBe('admin@x.io');
    expect(message.subject).toBe('User Deactivation Request');
    expect(message.html).toContain('https://app/deactivate/xyz');
  });
});
