import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const template = await prisma.resumeTemplate.findFirst();
  console.log(template);
}
main().catch(console.error).finally(() => prisma.$disconnect());
