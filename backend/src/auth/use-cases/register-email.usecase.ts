import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BetterAuthService, type RegisterEmailPayload } from '../better-auth.service';

export type RegisterEmailResult =
  | {
      status: 'VERIFY_EMAIL';
      email: string;
      role: 'CANDIDATE' | 'EMPLOYER';
    }

@Injectable()
export class RegisterEmailUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly betterAuth: BetterAuthService,
  ) {}

  async execute(payload: RegisterEmailPayload): Promise<RegisterEmailResult> {
    const email = payload.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
      },
    });

    if (!existingUser) {
      await this.betterAuth.signUpEmail({
        ...payload,
        email,
      });

      return {
        status: 'VERIFY_EMAIL',
        email,
        role: payload.role,
      };
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
        password: {
          not: null,
        },
      },
      select: {
        id: true,
      },
    });

    if (credentialAccount) {
      throw new ConflictException('Email already exists');
    }

    await this.betterAuth.sendVerificationOtp(email);

    return {
      status: 'VERIFY_EMAIL',
      email,
      role: payload.role,
    };
  }
}
