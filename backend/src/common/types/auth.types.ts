import type { UserSession } from '@thallesp/nestjs-better-auth';

export interface AuthGuardUser {
  user: UserSession['user'] & {
    isActive?: boolean;
    isLocked?: boolean;
  };
  session: UserSession['session'];
}
