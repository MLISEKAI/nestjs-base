import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * EmailService - Service để gửi email
 * Hỗ trợ nhiều provider: SMTP, SendGrid, AWS SES, etc.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isProduction: boolean;
  private readonly emailProvider: string;
  private readonly smtpConfig: any;

  constructor(private readonly configService: ConfigService) {
    this.isProduction =
      (this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development') ===
      'production';
    this.emailProvider =
      this.configService.get<string>('EMAIL_PROVIDER') ?? process.env.EMAIL_PROVIDER ?? 'console';
    this.smtpConfig = {
      host: this.configService.get<string>('SMTP_HOST') ?? process.env.SMTP_HOST,
      port: this.configService.get<number>('SMTP_PORT') ?? parseInt(process.env.SMTP_PORT || '587'),
      secure:
        this.configService.get<boolean>('SMTP_SECURE') ??
        (typeof process.env.SMTP_SECURE !== 'undefined'
          ? process.env.SMTP_SECURE === 'true'
          : false),
      auth: {
        user: this.configService.get<string>('SMTP_USER') ?? process.env.SMTP_USER,
        pass: this.configService.get<string>('SMTP_PASS') ?? process.env.SMTP_PASS,
      },
    };
  }

  /**
   * Gửi email verification code
   */
  async sendVerificationCode(email: string, code: string, context: string = 'verification') {
    const subject = this.getSubjectByContext(context);
    const html = this.getEmailTemplate(email, code, context);

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Gửi password reset code
   */
  async sendPasswordResetCode(email: string, code: string) {
    return this.sendVerificationCode(email, code, 'password-reset');
  }

  /**
   * Gửi email generic
   */
  async sendEmail(options: { to: string; subject: string; html: string; from?: string }) {
    const fromEmail =
      options.from ??
      this.configService.get<string>('EMAIL_FROM') ??
      process.env.EMAIL_FROM ??
      'noreply@example.com';

    // Trong development, chỉ log ra console
    if (!this.isProduction || this.emailProvider === 'console') {
      this.logger.log(`[EMAIL] To: ${options.to}`);
      this.logger.log(`[EMAIL] Subject: ${options.subject}`);
      this.logger.log(`[EMAIL] Body: ${options.html}`);
      return { success: true, message: 'Email logged to console (dev mode)' };
    }

    // Production: Gửi email thật
    try {
      switch (this.emailProvider) {
        case 'smtp':
          return await this.sendViaSMTP({ ...options, from: fromEmail });
        case 'sendgrid':
          return await this.sendViaSendGrid({ ...options, from: fromEmail });
        case 'ses':
          return await this.sendViaSES({ ...options, from: fromEmail });
        default:
          this.logger.warn(`Unknown email provider: ${this.emailProvider}, logging to console`);
          this.logger.log(`[EMAIL] To: ${options.to}, Subject: ${options.subject}`);
          return { success: true, message: 'Email logged (unknown provider)' };
      }
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async sendViaSMTP(options: { to: string; subject: string; html: string; from: string }) {
    // Cần cài đặt: npm install nodemailer @types/nodemailer
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: this.smtpConfig.host,
        port: this.smtpConfig.port,
        secure: this.smtpConfig.secure,
        auth: this.smtpConfig.auth.user ? this.smtpConfig.auth : undefined,
      });

      const info = await transporter.sendMail({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      this.logger.log(`Email sent via SMTP: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`SMTP error: ${error.message}`);
      throw error;
    }
  }

  private async sendViaSendGrid(options: {
    to: string;
    subject: string;
    html: string;
    from: string;
  }) {
    // Cần cài đặt: npm install @sendgrid/mail
    try {
      const sgMail = require('@sendgrid/mail');
      const apiKey =
        this.configService.get<string>('SENDGRID_API_KEY') ?? process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        throw new Error('SENDGRID_API_KEY not configured');
      }

      sgMail.setApiKey(apiKey);

      const msg = {
        to: options.to,
        from: options.from,
        subject: options.subject,
        html: options.html,
      };

      await sgMail.send(msg);
      this.logger.log(`Email sent via SendGrid to: ${options.to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`SendGrid error: ${error.message}`);
      throw error;
    }
  }

  private async sendViaSES(options: { to: string; subject: string; html: string; from: string }) {
    // AWS SES - đã có aws-sdk trong dependencies
    try {
      const AWS = require('aws-sdk');
      const ses = new AWS.SES({
        region:
          this.configService.get<string>('AWS_REGION') ?? process.env.AWS_REGION ?? 'us-east-1',
      });

      const params = {
        Source: options.from,
        Destination: { ToAddresses: [options.to] },
        Message: {
          Subject: { Data: options.subject, Charset: 'UTF-8' },
          Body: { Html: { Data: options.html, Charset: 'UTF-8' } },
        },
      };

      const result = await ses.sendEmail(params).promise();
      this.logger.log(`Email sent via AWS SES: ${result.MessageId}`);
      return { success: true, messageId: result.MessageId };
    } catch (error) {
      this.logger.error(`AWS SES error: ${error.message}`);
      throw error;
    }
  }

  private getSubjectByContext(context: string): string {
    const subjects: Record<string, string> = {
      'password-reset': 'Reset Your Password',
      verification: 'Verify Your Email',
      register: 'Welcome! Verify Your Email',
      resend: 'Verification Code',
    };
    return subjects[context] ?? 'Verification Code';
  }

  private getEmailTemplate(email: string, code: string, context: string): string {
    const templates: Record<string, string> = {
      'password-reset': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .code { font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background-color: white; margin: 20px 0; letter-spacing: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You have requested to reset your password. Use the code below to reset your password:</p>
              <div class="code">${code}</div>
              <p>This code will expire in 30 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      verification: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .code { font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background-color: white; margin: 20px 0; letter-spacing: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Please verify your email address using the code below:</p>
              <div class="code">${code}</div>
              <p>This code will expire in 30 minutes.</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return templates[context] ?? templates.verification;
  }
}
