import asyncio
import httpx
import psycopg2
import uuid

DB_URL = "postgresql://pq_user:pq_pass123@localhost:5435/pq_jobs"
OLLAMA_URL = "http://127.0.0.1:11434"
MODEL = "nomic-embed-text"

async def sync():
    # Lấy danh sách jobs ACTIVE từ DB
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("SELECT id, title, description FROM job WHERE status = 'ACTIVE'")
    jobs = cur.fetchall()
    print(f"Found {len(jobs)} ACTIVE jobs")

    async with httpx.AsyncClient() as client:
        for job_id, title, description in jobs:
            text = f"{title}. {description}".strip()
            resp = await client.post(
                f"{OLLAMA_URL}/api/embeddings",
                json={"model": MODEL, "prompt": text},
                timeout=120.0
            )
            embedding = resp.json().get("embedding")
            if embedding:
                vector_str = f"[{','.join(map(str, embedding))}]"
                embed_id = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO job_embedding (id, "jobId", embedding)
                    VALUES (%s, %s, %s::vector)
                    ON CONFLICT ("jobId") DO UPDATE SET embedding = EXCLUDED.embedding
                """, (embed_id, job_id, vector_str))
                conn.commit()
                print(f"✅ Synced: {title}")
            else:
                print(f"❌ Failed: {title}")

    cur.close()
    conn.close()
    print("Done!")

asyncio.run(sync())