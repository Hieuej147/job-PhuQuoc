import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { Redis } from 'ioredis';
import { redisStorage } from '@better-auth/redis-storage';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6381');

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET || 'test-secret-key-min-32-characters-long',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: { type: 'string', required: false },
      phone: { type: 'string', required: false },
      isActive: { type: 'boolean', required: false },
      isLocked: { type: 'boolean', required: false },
    },
  },
  secondaryStorage: redisStorage({ client: redis, keyPrefix: 'better-auth:' }),
});

async function createUser(name: string, email: string, password: string, role: string, phone: string) {
  try {
    // Delete existing user and account if exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`🗑️  Deleting existing user: ${email}`);
      await prisma.account.deleteMany({ where: { userId: existing.id } });
      await prisma.session.deleteMany({ where: { userId: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } });
    }

    // Create user via better-auth API
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
    });

    if (result && result.user) {
      const userId = result.user.id;
      console.log(`✅ Created user: ${email} (id: ${userId})`);
      
      // Update role and other fields
      await prisma.user.update({
        where: { id: userId },
        data: { role: role as any, phone, emailVerified: true, isActive: true },
      });
      
      console.log(`   Role: ${role}, Phone: ${phone}, emailVerified: true`);
    }
  } catch (err: any) {
    console.error(`❌ Failed to create ${email}:`, err.message);
  }
}

async function main() {
  console.log('Creating test users with proper password hashes...\n');

  await createUser('Admin PQ', 'admin@phuquoc.jobs', 'Admin123!', 'ADMIN', '0900000001');
  await createUser('Nguyen Van A', 'employer@phuquoc.jobs', 'Employer123!', 'EMPLOYER', '0900000002');
  await createUser('Tran Thi B', 'candidate@phuquoc.jobs', 'Candidate123!', 'CANDIDATE', '0900000003');

  console.log('\nDone! Verifying...');
  
  // Verify
  const users = await prisma.user.findMany({
    where: { email: { in: ['admin@phuquoc.jobs', 'employer@phuquoc.jobs', 'candidate@phuquoc.jobs'] } },
    select: { id: true, email: true, role: true, emailVerified: true },
  });
  
  const accounts = await prisma.account.findMany({
    where: { providerId: 'credential', userId: { in: users.map(u => u.id) } },
    select: { userId: true, password: true },
  });
  
  console.log('\nUsers:');
  users.forEach(u => {
    const account = accounts.find(a => a.userId === u.id);
    console.log(`  ${u.email} (${u.role}) emailVerified=${u.emailVerified} password=${account?.password ? 'YES' : 'NO'}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
