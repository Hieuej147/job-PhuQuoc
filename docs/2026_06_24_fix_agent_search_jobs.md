# Cải tiến AI Agent: Tính năng Search Jobs (RAG Semantic Search)

**Ngày thực hiện:** 2026-06-24  
**Người thực hiện:** Võ Thành Phú  
**Nhiệm vụ:** Phát triển tính năng `search_jobs` cho Candidate Agent (giao bởi nhóm trưởng)

---

## 1. Làm gì?

Kiểm tra, sửa lỗi và hoàn thiện luồng RAG (Retrieval-Augmented Generation) cho tool `search_jobs` của Candidate Agent.

Luồng RAG hoàn chỉnh:
```
User gõ từ khóa tìm việc
   → Agent gọi Ollama sinh embedding vector 768 chiều
   → Gọi NestJS POST /jobs/search-vector kèm vector
   → NestJS query pgvector tìm job tương đồng nhất
   → Trả kết quả về LLM → LLM trả lời tự nhiên cho user
   → Frontend render job card có thể click mở tab mới
```

Ngoài ra đã sửa thêm:
- Job card click mở tab mới đúng trang chi tiết (dùng slug thay vì ID)
- Location hiển thị tên thật thay vì ID thô (`ward_dd` → `Dương Đông`)
- Thêm similarity threshold để lọc kết quả không liên quan

---

## 2. Tại sao?

Khi đọc lại toàn bộ code của AI Agent và Backend, phát hiện nhiều lỗi khiến tính năng search_jobs **không hoạt động dù đã được code sẵn**:

- Agent khởi động thất bại do thiếu hàm trong `agent_factory.py`
- Agent crash do xung đột `MemorySaver` giữa `langgraph dev` và `main.py`
- Tool `search_jobs` gọi API đúng nhưng đọc sai cấu trúc response → không có kết quả
- Backend bỏ qua filter lương/địa điểm dù Agent đã gửi lên
- Location trả về ID thô thay vì tên thật
- Bảng `job_embedding` chưa được tạo trong database
- Chưa có embedding data cho các job

---

## 3. Sửa như thế nào?

### 3.1 `web/agent/core/agent_factory.py`
**Vấn đề:** `graphs.py` import 5 hàm nhưng `agent_factory.py` chỉ có 2.  
**Sửa:** Thêm 3 hàm còn thiếu (`create_candidate_job_graph`, `create_candidate_cv_graph`, `create_candidate_advisor_graph`) — tạm thời dùng chung `CandidateAgent` graph.

### 3.2 `web/agent/agents/base_agent.py`
**Vấn đề:** `workflow.compile(checkpointer=MemorySaver())` xung đột với `langgraph dev` (không cho phép custom checkpointer) nhưng lại bắt buộc phải có khi chạy `main.py`.  
**Sửa:** Khi chạy `main.py` (FastAPI): giữ `MemorySaver()`. Khi chạy `langgraph dev`: xóa checkpointer. Hiện tại đang dùng `main.py` nên giữ `MemorySaver()`.

### 3.3 `web/agent/tools/candidate/search_jobs.py`
**Vấn đề:** 
- Response từ Backend được bọc trong `{"data": [...], "timestamp": "..."}` nhưng code đang lặp trực tiếp qua object → crash hoặc kết quả rỗng
- Field `location` mô tả sai (nói là "thành phố" nhưng thực ra cần wardId)
- Thiếu field `slug` trong kết quả trả về

**Sửa:**
```python
# Bóc tách đúng field data
response = await self.api_client.post("/jobs/search-vector", json=payload)
jobs = response.get("data", response) if isinstance(response, dict) else response

# Thêm slug vào kết quả
"slug": j.get("slug"),
```

### 3.4 `backend/src/modules/jobs/jobs.service.ts`
**Vấn đề:**
- Không JOIN bảng `address_ward` → location trả về ID thô
- Không có similarity threshold → trả về tất cả job kể cả không liên quan

**Sửa:**
```sql
LEFT JOIN "address_ward" w ON j."wardId" = w.id
WHERE j.status = 'ACTIVE'
AND 1 - (je.embedding <=> ${vectorString}::vector) > 0.3
```
```typescript
location: r.wardName ?? r.wardId,  // ưu tiên tên thật
slug: r.slug,                       // thêm slug để link đúng
```

### 3.5 `web/src/components/ai/renderers/job-list-card.tsx`
**Vấn đề:** Link dùng `job.id` → URL `/jobs/job_001` không tìm thấy. Mở cùng tab.  
**Sửa:**
```tsx
<Link
  href={`/jobs/${job.slug || job.id}`}
  target="_blank"
>
```
Thêm field `slug` vào interface `Job`.

### 3.6 Database & Embedding
**Vấn đề:** Bảng `job_embedding` chưa tồn tại, chưa có embedding data.  
**Sửa:**
```bash
npx prisma db push                         # Tạo bảng job_embedding
npx ts-node scripts/sync-embeddings.ts    # Sync embedding cho 3 job ACTIVE
```

---

## 4. Lỗi gì? (đã gặp trong quá trình)

| Lỗi | Nguyên nhân | Đã sửa |
|---|---|---|
| `ImportError: cannot import name 'create_candidate_advisor_graph'` | Thiếu 3 hàm trong `agent_factory.py` | ✅ |
| `ValueError: No checkpointer set` | `main.py` cần `MemorySaver()` nhưng bị xóa | ✅ |
| `ValueError: custom checkpointer not allowed` | `langgraph dev` không cho custom checkpointer | ✅ (dùng `main.py` thay) |
| Chat không phản hồi | Agent chạy port 2024, Frontend gọi port 8125 | ✅ Thêm `--port 8125` |
| `relation "job_embedding" does not exist` | Chưa chạy migration | ✅ `prisma db push` |
| Kết quả search rỗng | `response.get("data")` chưa được bóc tách | ✅ |
| Location hiện `ward_dd` | Thiếu JOIN `address_ward` | ✅ |
| Click job mở trang "Không tìm thấy" | Dùng ID thay vì slug | ✅ |

---

## 5. Thiếu gì? (chưa làm trong lần này)

- **Filter lương/địa điểm chưa hoạt động đầy đủ**: `VectorSearchDto` và `jobs.service.ts` chưa nhận `wardId`, `salaryMin`, `salaryMax` từ Agent (đã phân tích, chưa implement)
- **Chỉ có 3 job seed data**: Kết quả search chưa đa dạng, cần thêm job mẫu để test chính xác hơn
- **Location trong job card**: Hiện vẫn hiện ID (`ward_dd`) ở card — cần Backend reload để thấy tên thật
- **Similarity threshold chưa được tinh chỉnh**: Ngưỡng 0.3 là ước tính, cần test với nhiều data hơn
- **Chưa viết unit test** cho luồng vector search
- **`ward_name` chỉ là tên phường/xã**: Chưa JOIN thêm district/province để hiện đầy đủ "Dương Đông, Phú Quốc, Kiên Giang"

---

## 6. Đã khắc phục như thế nào?

**Kết quả cuối cùng sau khi sửa:**
- ✅ Agent khởi động thành công (`uv run python main.py`, port 8125)
- ✅ Chat "Tìm việc lễ tân khách sạn" → Agent gọi tool `search_jobs` → trả về job thật từ DB
- ✅ Job card hiển thị đúng: tên job, công ty, lương, loại hình
- ✅ Click job card → mở tab mới → đúng trang chi tiết job (`/jobs/le-tan-khach-san`)
- ✅ Similarity threshold 0.3 lọc bớt job không liên quan
- ✅ Location bắt đầu hiển thị tên thật sau khi Backend reload

**Cách chạy lại Agent sau khi tắt máy:**
```bash
# Terminal 1: Database
pnpm db:up

# Terminal 2: Backend + Frontend  
pnpm dev

# Terminal 3: Agent
cd web/agent
uv run python main.py
```

**Lưu ý quan trọng:**
- File `web/.env` cần có `OPENAI_API_KEY` thật (không commit lên git)
- Ollama tự chạy nền sau khi cài, không cần `ollama serve` thủ công
- Mỗi khi thêm job mới, embedding tự động sync qua `EmbeddingService` (async)
- Nếu cần sync lại toàn bộ: `cd backend && npx ts-node scripts/sync-embeddings.ts`

---

*Nếu cần giải thích thêm, liên hệ Võ Thành Phú hoặc xem thêm tại `TEAM_FE_DOCUMENT.md`*