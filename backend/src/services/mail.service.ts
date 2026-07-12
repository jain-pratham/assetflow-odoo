import nodemailer from 'nodemailer';

export class MailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static init() {
    if (!this.transporter) {
      const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
      const port = process.env.SMTP_PORT || process.env.EMAIL_PORT;
      const user = process.env.SMTP_USER || process.env.EMAIL_USER;
      const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
      const secureStr = process.env.SMTP_SECURE || process.env.EMAIL_SECURE;
      
      if (!host || !user || !pass) {
        console.warn('MailService: SMTP credentials are not configured in .env. Emails will not be sent.');
        return;
      }
      this.transporter = nodemailer.createTransport({
        host: host,
        port: Number(port) || 587,
        secure: secureStr === 'true' || Number(port) === 465,
        auth: {
          user: user,
          pass: pass,
        },
      });
    }
  }

  static async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    this.init();
    if (!this.transporter) return false;

    const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"AssetFlow ERP" <no-reply@assetflow.com>';

    try {
      await this.transporter.sendMail({
        from: fromAddress,
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
