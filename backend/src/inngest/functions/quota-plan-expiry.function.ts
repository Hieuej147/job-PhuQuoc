import { inngest } from '../client';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotaExpiryService } from '../../common/quota/quota-expiry.service';
import type { CronInngestContext, TypedInngestContext } from '../inngest.types';

export function createQuotaPlanExpiryFunctions(prisma: PrismaService) {
  const quotaExpiry = new QuotaExpiryService(prisma);

  const expireActivatedQuotaPlan = inngest.createFunction(
    { id: 'quota-plan-expiry', triggers: [{ event: 'quota.plan.activated' }] },
    async ({ event, step }: TypedInngestContext<'quota.plan.activated'>) => {
      const expiresAt = new Date(event.data.expiresAt);
      if (expiresAt.getTime() > Date.now()) {
        await step.sleepUntil('wait-for-quota-plan-expiry', expiresAt);
      }

      return step.run('expire-quota-plan-if-current', async () => {
        return quotaExpiry.expireQuotaPlan(event.data.userId, event.data.targetPlan, event.data.expiresAt);
      });
    },
  );

  const repairExpiredQuotaPlans = inngest.createFunction(
    { id: 'repair-expired-quota-plans', triggers: [{ cron: '15 3 * * *' }] },
    async ({ step }: CronInngestContext) => {
      return step.run('repair-expired-quota-plans', async () => quotaExpiry.repairExpiredPlans());
    },
  );

  return [expireActivatedQuotaPlan, repairExpiredQuotaPlans];
}
