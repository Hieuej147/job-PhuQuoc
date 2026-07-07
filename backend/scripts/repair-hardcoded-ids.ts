import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const targetTables = [
  "address_province",
  "address_district",
  "address_ward",
  "job_category",
  "user",
  "company",
  "job",
  "blog_category",
  "blog_post",
  "pricing_package",
  "payment",
  "audit_log",
  "candidate_resume",
  "job_application",
  "saved_job",
  "saved_company",
  "notification",
  "job_embedding",
] as const;

type TargetTable = (typeof targetTables)[number];

type IdRow = {
  id: string;
};

type PlannedUpdate = {
  table: TargetTable;
  oldId: string;
  newId: string;
};

function isGeneratedId(id: string) {
  return /^[a-z][a-z0-9]{20,31}$/.test(id);
}

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function shouldRepair(id: string) {
  return !isGeneratedId(id) && !isUuid(id);
}

async function loadHardcodedIds(table: TargetTable): Promise<IdRow[]> {
  return prisma.$queryRawUnsafe<IdRow[]>(
    `SELECT id FROM "${table}" ORDER BY id ASC`,
  );
}

async function buildPlan() {
  const plan: PlannedUpdate[] = [];
  const generated = new Set<string>();

  for (const table of targetTables) {
    const rows = await loadHardcodedIds(table);
    for (const row of rows) {
      if (!shouldRepair(row.id)) continue;

      let newId = createId();
      while (generated.has(newId)) {
        newId = createId();
      }
      generated.add(newId);

      plan.push({ table, oldId: row.id, newId });
    }
  }

  return plan;
}

function printPlan(plan: PlannedUpdate[]) {
  const grouped = plan.reduce<Record<string, number>>((acc, item) => {
    acc[item.table] = (acc[item.table] || 0) + 1;
    return acc;
  }, {});

  console.log("Hardcoded ID repair plan");
  console.table(grouped);

  for (const item of plan.slice(0, 30)) {
    console.log(`${item.table}: ${item.oldId} -> ${item.newId}`);
  }

  if (plan.length > 30) {
    console.log(`...and ${plan.length - 30} more IDs`);
  }
}

async function applyPlan(plan: PlannedUpdate[]) {
  await prisma.$transaction(async (tx) => {
    for (const item of plan) {
      await tx.$executeRawUnsafe(
        `UPDATE "${item.table}" SET id = $1 WHERE id = $2`,
        item.newId,
        item.oldId,
      );
    }
  });
}

async function main() {
  const apply = process.argv.includes("--apply");
  const plan = await buildPlan();

  printPlan(plan);

  if (plan.length === 0) {
    console.log("No hardcoded IDs found.");
    return;
  }

  if (!apply) {
    console.log("Dry-run only. Re-run with --apply to update IDs.");
    return;
  }

  await applyPlan(plan);
  console.log(`Updated ${plan.length} IDs. Slugs and data content were not changed.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
