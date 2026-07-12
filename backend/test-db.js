const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const profileResumes = await prisma.candidateResume.findMany({
    where: { isProfile: true },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, image: true } }
    }
  });
  console.log("=== DB DUMP ===");
  console.log(JSON.stringify(profileResumes, null, 2));
}
main().finally(() => prisma.$disconnect());
