import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get('resend.apiKey'));
    this.from = this.config.get('resend.mailFrom') as string;
  }

  async sendEmailVerificationOtp(email: string, otp: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Verify Your Email',
      html: this.otpTemplate({
        title: 'Verify Your Email',
        body: 'Use the code below to verify your email address.',
        otp,
      }),
    });
  }

  async sendPasswordResetOtp(email: string, otp: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Reset Your Password',
      html: this.otpTemplate({
        title: 'Reset Your Password',
        body: 'Use the code below to reset your password.',
        otp,
      }),
    });
  }

  async sendTwoFactorOtp(email: string, otp: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Your Login Code',
      html: this.otpTemplate({
        title: 'Your Login Code',
        body: 'Use the code below to complete your sign-in.',
        otp,
      }),
    });
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async send(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const { data, error } = await this.resend.emails.send({
      from: this.from,
      ...params,
    });

    if (error) {
      // Log internally — never expose Resend error details to the caller
      this.logger.error(
        `Failed to send "${params.subject}" to ${params.to}`,
        error,
      );
      throw new InternalServerErrorException('Failed to send email.');
    }

    this.logger.log(`Email sent: ${data.id}`);
  }

  private otpTemplate(params: {
    title: string;
    body: string;
    otp: string;
  }): string {
    return `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2>${params.title}</h2>
        <p>${params.body} It expires in <strong>5 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:12px;
                    text-align:center;padding:24px;background:#f4f4f5;
                    border-radius:8px;margin:24px 0">
          ${params.otp}
        </div>
        <p style="color:#6b7280;font-size:14px">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `;
  }
}