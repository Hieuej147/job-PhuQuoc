import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const email = 'ngoan@gmail.com';
  console.log(`Updating emailVerified = true for ${email}...`);

  const updated = await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });

  console.log('Successfully updated:', updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
