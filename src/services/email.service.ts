import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: ENV.EMAIL_HOST,
      port: ENV.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: ENV.EMAIL_USER,
        pass: ENV.EMAIL_PASSWORD,
      },
    });
  }

  async sendOTP(email: string, code: string): Promise<void> {
    try {
      const mailOptions = {
        from: ENV.EMAIL_FROM,
        to: email,
        subject: 'Your OTP Code - Multi-Uploader',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Verification</h2>
            <p>Your OTP code is:</p>
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center;">
              <h1 style="color: #4CAF50; margin: 0; font-size: 32px; letter-spacing: 5px;">${code}</h1>
            </div>
            <p style="color: #666; margin-top: 20px;">This code will expire in ${ENV.OTP_EXPIRY_MINUTES} minutes.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    try {
      const mailOptions = {
        from: ENV.EMAIL_FROM,
        to: email,
        subject: 'Welcome to Multi-Uploader!',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Multi-Uploader! 🎉</h2>
            <p>Hi ${name || 'there'},</p>
            <p>Thank you for joining Multi-Uploader. You can now start uploading your videos to multiple social media platforms with ease.</p>
            <p>Get started by uploading your first video!</p>
            <p style="margin-top: 30px;">Best regards,<br/>The Multi-Uploader Team</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      // Don't throw error for welcome emails
    }
  }
}

export const emailService = new EmailService();