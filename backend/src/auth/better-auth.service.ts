import { Injectable } from '@nestjs/common';

export type RegisterEmailPayload = {
  name: string;
  email: string;
  password: string;
  role: 'CANDIDATE' | 'EMPLOYER';
  phone?: string;
};

@Injectable()
export class BetterAuthService {
  private readonly authUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
  private readonly origin = process.env.FRONTEND_URL || this.authUrl;

  private async postJson(path: string, body: Record<string, unknown>) {
    const response = await fetch(`${this.authUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: this.origin,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((data as { message?: string }).message || 'Auth request failed');
    }

    return data;
  }

  async signUpEmail(payload: RegisterEmailPayload) {
    return this.postJson('/api/auth/sign-up/email', {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      ...(payload.phone ? { phone: payload.phone } : {}),
    });
  }

  async sendVerificationOtp(email: string) {
    return this.postJson('/api/auth/email-otp/send-verification-otp', {
      email,
      type: 'email-verification',
    });
  }

  async checkVerificationOtp(email: string, otp: string) {
    return this.postJson('/api/auth/email-otp/check-verification-otp', {
      email,
      type: 'email-verification',
      otp,
    });
  }

  async requestPasswordResetOtp(email: string) {
    return this.postJson('/api/auth/email-otp/request-password-reset', {
      email,
    });
  }
}
