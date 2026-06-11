import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BetterAuthService } from '../better-auth.service';

export type RequestPasswordResetResult =
  | {
      status: 'RESET_OTP_SENT';
      email: string;
    }
  | {
      status: 'VERIFY_EMAIL_REQUIRED';
      email: string;
    }
  | {
      status: 'OAUTH_ONLY';
      email: string;
    }
  | {
      status: 'EMAIL_NOT_FOUND';
      email: string;
    };

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly betterAuth: BetterAuthService,
  ) {}

  async execute(payload: { email: string }): Promise<RequestPasswordResetResult> {
    const email = payload.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return {
        status: 'EMAIL_NOT_FOUND',
        email,
      };
    }

    const credentialAccount = await this.prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: 'credential',
        password: {
          not: null,
        },
      },
      select: { id: true },
    });

    if (!user.emailVerified) {
      await this.betterAuth.sendVerificationOtp(email);
      return {
        status: 'VERIFY_EMAIL_REQUIRED',
        email,
      };
    }

    if (!credentialAccount) {
      return {
        status: 'OAUTH_ONLY',
        email,
      };
    }

    await this.betterAuth.requestPasswordResetOtp(email);

    return {
      status: 'RESET_OTP_SENT',
      email,
    };
  }
}
