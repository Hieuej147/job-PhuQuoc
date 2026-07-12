import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const email = 'ngoan@gmail.com';
  console.log(`Finding user ${email}...`);
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User ${email} not found. Please register first!`);
    return;
  }

  // Get first company
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('No company found to associate the jobs.');
    return;
  }

  // Get first category
  const category = await prisma.jobCategory.findFirst();
  if (!category) {
    console.error('No category found.');
    return;
  }

  console.log('Creating expired test job...');
  const expiredJob = await prisma.job.create({
    data: {
      title: 'Việc làm Đã Hết Hạn (Test)',
      slug: 'viec-lam-da-het-han-test-' + Date.now(),
      description: 'Mô tả việc làm đã hết hạn.',
      requirements: 'Yêu cầu cơ bản',
      benefits: 'Quyền lợi cơ bản',
      quantity: 1,
      salaryMin: 5000000,
      salaryMax: 10000000,
      type: 'FULL_TIME',
      experience: 'NO_EXPERIENCE',
      level: 'FRESHER',
      status: 'ACTIVE',
      deadline: new Date('2025-01-01'), // Hết hạn
      categoryId: category.id,
      companyId: company.id,
    },
  });

  console.log('Creating active test job...');
  const activeJob = await prisma.job.create({
    data: {
      title: 'Việc làm Đang Tuyển (Test)',
      slug: 'viec-lam-dang-tuyen-test-' + Date.now(),
      description: 'Mô tả việc làm đang hoạt động.',
      requirements: 'Yêu cầu cơ bản',
      benefits: 'Quyền lợi cơ bản',
      quantity: 2,
      salaryMin: 12000000,
      salaryMax: 20000000,
      type: 'REMOTE',
      experience: 'ONE_TO_THREE_YEARS',
      level: 'MID',
      status: 'ACTIVE',
      deadline: new Date('2026-12-31'), // Còn hạn
      categoryId: category.id,
      companyId: company.id,
    },
  });

  console.log('Saving jobs for user...');
  await prisma.savedJob.createMany({
    data: [
      { userId: user.id, jobId: expiredJob.id },
      { userId: user.id, jobId: activeJob.id },
    ],
    skipDuplicates: true,
  });

  console.log('Successfully added test data for saved jobs!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
