import nodemailer from 'nodemailer';

export class MailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static init() {
    if (!this.transporter) {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('MailService: SMTP credentials are not configured in .env. Emails will not be sent.');
        return;
      }
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  static async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    this.init();
    if (!this.transporter) return false;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"AssetFlow System" <no-reply@assetflow.com>',
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error(`MailService Error: Failed to send email to ${to}:`, error);
      return false; // Fail gracefully
    }
  }
}
