import { Module } from '@nestjs/common';
import { CustomAuthController } from './auth.controller';
import { ScalarAuthController } from './scalar-auth.controller';
import { CustomAuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { BetterAuthService } from './better-auth.service';
import { RegisterEmailUseCase } from './use-cases/register-email.usecase';
import { CompleteEmailRegistrationUseCase } from './use-cases/complete-email-registration.usecase';
import { RequestPasswordResetUseCase } from './use-cases/request-password-reset.usecase';

@Module({
  controllers: [CustomAuthController, ScalarAuthController],
  providers: [
    CustomAuthService,
    BetterAuthService,
    RegisterEmailUseCase,
    CompleteEmailRegistrationUseCase,
    RequestPasswordResetUseCase,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [CustomAuthService],
})
export class CustomAuthModule {}
