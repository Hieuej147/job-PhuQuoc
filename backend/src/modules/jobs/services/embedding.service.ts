import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  private readonly MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';

  constructor(private readonly prisma: PrismaService) { }

  async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const response = await fetch(`${this.OLLAMA_URL}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.MODEL,
          prompt: text,
        }),
      });

      if (!response.ok) {
        this.logger.error(`Ollama error: ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      this.logger.error(`Failed to generate embedding: ${error.message}`);
      return null;
    }
  }

  async syncJobEmbedding(jobId: string, title: string, description: string, requirements?: string) {
    const rawText = `${title}. ${description} ${requirements || ''}`.trim();
    const text = `search_document: ${rawText}`; // ← THÊM DÒNG NÀY, đổi tên biến rawText
    const embedding = await this.generateEmbedding(text);

    if (!embedding) return;

    const id = crypto.randomUUID();
    const vectorString = `[${embedding.join(',')}]`;

    try {
      await this.prisma.$executeRaw`
        INSERT INTO "job_embedding" ("id", "jobId", "embedding")
        VALUES (${id}, ${jobId}, ${vectorString}::vector)
        ON CONFLICT ("jobId") 
        DO UPDATE SET "embedding" = EXCLUDED.embedding
      `;
      this.logger.log(`Synced embedding for job ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to sync embedding for job ${jobId}: ${error.message}`);
    }
  }
}
