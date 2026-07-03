import { Inngest } from 'inngest';
import { PrismaService } from '../prisma/prisma.service';
import { createNotificationFunctions } from './functions/notification.functions';
import { createWeeklySummaryFunction } from './functions/weekly-summary.function';
import { createJobExpiryFunctions } from './functions/job-expiry.function';
import { createUserFunctions } from './functions/user.functions';
import { createApplicationCleanupFunctions } from './functions/application-cleanup.function';
import { createNotificationCleanupFunction } from './functions/notification-cleanup.function';

export const inngest = new Inngest({ id: 'phuquoc-jobs' });

export function createAllFunctions(prisma: PrismaService) {
  return [
    ...createNotificationFunctions(prisma),
    ...createJobExpiryFunctions(prisma),
    ...createUserFunctions(prisma),
    ...createApplicationCleanupFunctions(prisma),
    createNotificationCleanupFunction(prisma),
    createWeeklySummaryFunction(prisma),
  ];
}
