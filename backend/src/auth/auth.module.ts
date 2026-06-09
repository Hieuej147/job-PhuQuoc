import { Module } from '@nestjs/common';
import { CustomAuthController } from './auth.controller';
import { ScalarAuthController } from './scalar-auth.controller';
import { CustomAuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  controllers: [CustomAuthController, ScalarAuthController],
  providers: [
    CustomAuthService,
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
