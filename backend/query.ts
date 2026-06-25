import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const template = await prisma.resumeTemplate.findFirst();
  console.log(template?.htmlTemplate.substring(0, 1000));
}
main().catch(console.error).finally(() => prisma.$disconnect());
