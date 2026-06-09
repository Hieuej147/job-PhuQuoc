import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { verifyOtpTemplate } from '../../auth/templates/verify-otp';
import { resetPasswordOtpTemplate } from '../../auth/templates/reset-password-otp';

// Singleton cho better-auth config (ngoài DI container)
export const resendClient = new Resend(process.env.RESEND_API_KEY);

@Injectable()
export class EmailService {
  private resend = resendClient;

  async sendVerifyOtp(email: string, otp: string) {
    await this.resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: email,
      subject: 'Xác nhận email - Phú Quốc Jobs',
      html: verifyOtpTemplate(otp),
    });
  }

  async sendResetPasswordOtp(email: string, otp: string) {
    await this.resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: email,
      subject: 'Đặt lại mật khẩu - Phú Quốc Jobs',
      html: resetPasswordOtpTemplate(otp),
    });
  }
}
