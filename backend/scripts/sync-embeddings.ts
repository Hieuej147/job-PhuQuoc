import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: text,
      }),
    });

    if (!response.ok) {
      console.error(`Ollama error: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error(`Failed to generate embedding: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('Starting embedding synchronization...');

  const jobs = await prisma.job.findMany({
    where: { status: 'ACTIVE' },
  });

  console.log(`Found ${jobs.length} ACTIVE jobs to sync.`);

  for (const job of jobs) {
    console.log(`Syncing job: ${job.id} - ${job.title}`);
    
    const text = `${job.title}. ${job.description} ${job.requirements || ''}`.trim();
    const embedding = await generateEmbedding(text);
    
    if (embedding) {
      const id = crypto.randomUUID();
      const vectorString = `[${embedding.join(',')}]`;
      
      try {
        await prisma.$executeRaw`
          INSERT INTO "job_embedding" ("id", "jobId", "embedding")
          VALUES (${id}, ${job.id}, ${vectorString}::vector)
          ON CONFLICT ("jobId") 
          DO UPDATE SET "embedding" = EXCLUDED.embedding
        `;
        console.log(`✅ Synced job ${job.id}`);
      } catch (error) {
        console.error(`❌ Failed to sync DB for job ${job.id}: ${error.message}`);
      }
    } else {
      console.error(`❌ Failed to generate vector for job ${job.id}`);
    }
    
    // Add small delay to avoid overloading Ollama
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('Finished syncing embeddings.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
