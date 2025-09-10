import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export default class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendEmailConfirmation(to: string, firstName: string, confirmUrl: string) {
    await this.mailer.sendMail({
      to,
      subject: 'Matcha • Confirm your email',
      template: 'confirm-email',
      context: {
        firstName: firstName || 'there',
        confirmUrl,
        appName: 'Matcha',
      },
    });
  }

  async sendPasswordReset(to: string, firstName: string, resetUrl: string) {
    await this.mailer.sendMail({
      to,
      subject: 'Matcha • Reset your password',
      template: 'reset-password',
      context: {
        firstName: firstName || 'there',
        resetUrl,
        appName: 'Matcha',
      },
    });
  }
}

