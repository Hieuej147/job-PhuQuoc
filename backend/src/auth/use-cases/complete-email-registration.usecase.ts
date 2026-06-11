import { BadRequestException, Injectable } from '@nestjs/common';
import { hashPassword } from 'better-auth/crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { BetterAuthService } from '../better-auth.service';

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

@Injectable()
export class CompleteEmailRegistrationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly betterAuth: BetterAuthService,
  ) {}

  async execute(payload: { email: string; otp: string; password: string }): Promise<CompleteEmailRegistrationResult> {
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

    await this.betterAuth.checkVerificationOtp(email, payload.otp);

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
}
