import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    const gmailUser = process.env.GMAIL_USER || '';
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || '';

    this.logger.log('=== Email Service Initialization ===');
    this.logger.log(`GMAIL_USER: ${gmailUser ? `Set (${gmailUser.substring(0, 3)}...)` : 'NOT SET'}`);
    this.logger.log(`GMAIL_APP_PASSWORD: ${gmailAppPassword ? `Set (${gmailAppPassword.length} chars)` : 'NOT SET'}`);

    if (!gmailUser || !gmailAppPassword) {
      this.logger.warn('Gmail credentials not configured. Email service will not work.');
      this.logger.warn(`GMAIL_USER: ${gmailUser ? 'Set' : 'NOT SET'}, GMAIL_APP_PASSWORD: ${gmailAppPassword ? 'Set' : 'NOT SET'}`);
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });

      this.isConfigured = true;
      this.logger.log('Nodemailer transporter created successfully');

      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          this.logger.error('Email service configuration error:', error);
          this.logger.error('Error details:', JSON.stringify(error, null, 2));
          this.isConfigured = false;
        } else {
          this.logger.log('✅ Email service is ready to send emails');
        }
      });
    } catch (error) {
      this.logger.error('Failed to create email transporter:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    this.logger.log(`=== Attempting to send email to ${options.to} ===`);
    this.logger.log(`isConfigured: ${this.isConfigured}, transporter exists: ${!!this.transporter}`);

    if (!this.isConfigured || !this.transporter) {
      this.logger.error('Email transporter not initialized. Check Gmail credentials.');
      this.logger.error('Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.');
      throw new Error('Email service not configured');
    }

    try {
      const mailOptions = {
        from: `"FurniMart" <${process.env.GMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      this.logger.log(`Sending email from: ${mailOptions.from}`);
      this.logger.log(`Email subject: ${mailOptions.subject}`);

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email sent successfully to ${options.to}`);
      this.logger.log(`Message ID: ${info.messageId}`);
      this.logger.log(`Response: ${info.response}`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to send email to ${options.to}`);
      this.logger.error(`Error type: ${error?.constructor?.name}`);
      this.logger.error(`Error message: ${error?.message}`);
      this.logger.error(`Error code: ${error?.code}`);
      this.logger.error(`Error response: ${error?.response}`);
      this.logger.error(`Full error: ${JSON.stringify(error, null, 2)}`);
      throw error;
    }
  }

  // Helper method for password reset email
  async sendPasswordResetEmail(to: string, resetToken: string, resetUrl: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu - FurniMart</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">FurniMart</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Đặt lại mật khẩu</h2>
          <p>Xin chào,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Đặt lại mật khẩu</a>
          </div>
          <p>Hoặc sao chép và dán liên kết sau vào trình duyệt của bạn:</p>
          <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #666;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            <strong>Lưu ý:</strong> Liên kết này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} FurniMart. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: 'Đặt lại mật khẩu - FurniMart',
      html,
    });
  }
}

