import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hashPassword } from 'better-auth/crypto';
import { PrismaService } from '../prisma/prisma.service';

// ─── Register / Complete-Registration result types ───────────────────────────

export type RegisterEmailPayload = {
  name: string;
  email: string;
  password: string;
  role: 'CANDIDATE' | 'EMPLOYER';
  phone?: string;
};

export type RegisterEmailResult = {
  status: 'VERIFY_EMAIL';
  email: string;
  role: 'CANDIDATE' | 'EMPLOYER';
};

export type CompleteEmailRegistrationResult = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    role: 'CANDIDATE' | 'EMPLOYER' | 'ADMIN' | null;
    phone: string | null;
  };
};

export type RequestPasswordResetResult =
  | { status: 'RESET_OTP_SENT'; email: string }
  | { status: 'VERIFY_EMAIL_REQUIRED'; email: string }
  | { status: 'OAUTH_ONLY'; email: string }
  | { status: 'EMAIL_NOT_FOUND'; email: string };

// ─── AuthService ─────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  private readonly authUrl =
    process.env.BETTER_AUTH_URL || 'http://localhost';
  private readonly origin =
    process.env.FRONTEND_URL || this.authUrl;

  constructor(private readonly prisma: PrismaService) {}

  // ── Profile ───────────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        phone: true,
        isActive: true,
        isLocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user ?? null;
  }

  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string; image?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        phone: true,
      },
    });
  }

  async selectRole(userId: string, role: 'CANDIDATE' | 'EMPLOYER') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role) {
      throw new ConflictException('Role already selected');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        phone: true,
      },
    });
  }

  // ── Register ──────────────────────────────────────────────────────────────

  async registerEmail(payload: RegisterEmailPayload): Promise<RegisterEmailResult> {
    const email = payload.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!existingUser) {
      await this.signUpEmail({ ...payload, email });
      return { status: 'VERIFY_EMAIL', email, role: payload.role };
    }

    if (!existingUser.role) {
      throw new ConflictException('Email already exists');
    }

    if (existingUser.role !== payload.role) {
      throw new ConflictException('Email already exists');
    }

    const credentialAccount = await this.prisma.account.findFirst({
      where: {
        userId: existingUser.id,
        providerId: 'credential',
        password: { not: null },
      },
      select: { id: true },
    });

    if (credentialAccount) {
      throw new ConflictException('Email already exists');
    }

    await this.sendVerificationOtp(email);
    return { status: 'VERIFY_EMAIL', email, role: payload.role };
  }

  async completeEmailRegistration(payload: {
    email: string;
    otp: string;
    password: string;
  }): Promise<CompleteEmailRegistrationResult> {
    const email = payload.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        phone: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.checkVerificationOtp(email, payload.otp);

    const credentialAccount = await this.prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: 'credential',
        password: { not: null },
      },
      select: { id: true },
    });

    if (!credentialAccount) {
      const passwordHash = await hashPassword(payload.password);
      await this.prisma.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: 'credential',
          password: passwordHash,
        },
      });
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        phone: true,
      },
    });

    return { user: updatedUser };
  }

  async requestPasswordReset(payload: {
    email: string;
  }): Promise<RequestPasswordResetResult> {
    const email = payload.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    });

    if (!user) {
      return { status: 'EMAIL_NOT_FOUND', email };
    }

    const credentialAccount = await this.prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: 'credential',
        password: { not: null },
      },
      select: { id: true },
    });

    if (!user.emailVerified) {
      await this.sendVerificationOtp(email);
      return { status: 'VERIFY_EMAIL_REQUIRED', email };
    }

    if (!credentialAccount) {
      return { status: 'OAUTH_ONLY', email };
    }

    await this.requestPasswordResetOtp(email);
    return { status: 'RESET_OTP_SENT', email };
  }

  // ── Better Auth HTTP helpers (private) ────────────────────────────────────

  private async postJson(
    path: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
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
      throw new Error(
        (data as { message?: string }).message || 'Auth request failed',
      );
    }

    return data;
  }

  private async signUpEmail(payload: RegisterEmailPayload): Promise<unknown> {
    return this.postJson('/api/auth/sign-up/email', {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      ...(payload.phone ? { phone: payload.phone } : {}),
    });
  }

  private async sendVerificationOtp(email: string): Promise<unknown> {
    return this.postJson('/api/auth/email-otp/send-verification-otp', {
      email,
      type: 'email-verification',
    });
  }

  private async checkVerificationOtp(
    email: string,
    otp: string,
  ): Promise<unknown> {
    return this.postJson('/api/auth/email-otp/check-verification-otp', {
      email,
      type: 'email-verification',
      otp,
    });
  }

  private async requestPasswordResetOtp(email: string): Promise<unknown> {
    return this.postJson('/api/auth/email-otp/request-password-reset', {
      email,
    });
  }
}
