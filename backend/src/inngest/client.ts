import { Inngest } from 'inngest';
import { PrismaService } from '../prisma/prisma.service';
import { createNotificationFunctions } from './functions/notification.functions';
import { createWeeklySummaryFunction } from './functions/weekly-summary.function';
import { createJobExpiryFunctions } from './functions/job-expiry.function';
import { createUserFunctions } from './functions/user.functions';
import { createNotificationCleanupFunction } from './functions/notification-cleanup.function';
import { createQuotaPlanExpiryFunctions } from './functions/quota-plan-expiry.function';
import type { RealtimeService } from '../realtime/realtime.service';

export const inngest = new Inngest({ id: 'phuquoc-jobs' });

export function createAllFunctions(prisma: PrismaService, realtime?: RealtimeService) {
  return [
    ...createNotificationFunctions(prisma, realtime),
    ...createJobExpiryFunctions(prisma, realtime),
    ...createUserFunctions(prisma, realtime),
    ...createQuotaPlanExpiryFunctions(prisma),
    createNotificationCleanupFunction(prisma),
    createWeeklySummaryFunction(prisma, realtime),
  ];
}
