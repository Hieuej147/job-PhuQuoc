import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const email = 'ngoan@gmail.com';
  console.log(`Checking user profile for ${email}...`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      companies: true,
    },
  });

  if (!user) {
    console.error('User not found!');
    return;
  }

  console.log('User Record:', user);

  const profile = await prisma.candidateResume.findFirst({
    where: { userId: user.id, isProfile: true },
  });

  console.log('Profile Record:', profile);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
