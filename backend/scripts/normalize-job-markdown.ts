import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Script chuẩn hóa dữ liệu job cũ sang Markdown thuần cho các field hiển thị ở JobDetail.
// Mặc định là dry-run; thêm `--apply` mới ghi DB, thêm `--verbose` để in toàn bộ thay đổi.
const APPLY = process.argv.includes('--apply');
const VERBOSE = process.argv.includes('--verbose');
const MAX_PREVIEW = 20;
type JobMarkdownUpdate = {
  description?: string;
  requirements?: string | null;
  benefits?: string | null;
};

const htmlEntityMap: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

// Chuyển entity HTML phổ biến về ký tự thật trước khi lưu Markdown.
function decodeEntities(value: string) {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === '#') {
      const isHex = entity[1]?.toLowerCase() === 'x';
      const code = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }

    return htmlEntityMap[entity] ?? match;
  });
}

// Loại bỏ script/style/event handler trước khi convert để không giữ lại nội dung nguy hiểm.
function stripDangerousHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

// Convert một tập HTML cơ bản từ editor/seed cũ sang Markdown.
// Đây không phải HTML renderer; mục tiêu là đưa DB về plain Markdown để FE render an toàn.
function htmlToMarkdown(value: string) {
  let text = stripDangerousHtml(value);

  text = text
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    .replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<[^>]+>/g, '');

  return normalizeWhitespace(decodeEntities(text));
}

// Heuristic nhận diện HTML cũ trong DB job.
function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

// Nếu field đã có Markdown thì giữ nguyên để script chạy lại không làm bẩn dữ liệu.
function looksLikeMarkdown(value: string) {
  return /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|\|.+\|)/.test(value)
    || /\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)/.test(value);
}

// Chuẩn hóa khoảng trắng để Markdown render ổn định, không tạo paragraph/list rỗng.
function normalizeWhitespace(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// Text cũ của requirements/benefits thường là chuỗi phân cách bằng dấu phẩy/chấm phẩy.
// Chuyển sang bullet list để JobDetail hiển thị đúng ngữ nghĩa.
function plainTextToMarkdown(value: string, field: 'description' | 'requirements' | 'benefits') {
  const text = normalizeWhitespace(value);
  if (!text) return text;

  if (looksLikeMarkdown(text)) return text;

  if (field === 'requirements' || field === 'benefits') {
    const parts = text
      .split(/\n|;|•|·|,(?=\s*\S)/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (parts.length > 1) {
      return parts.map((item) => `- ${item.replace(/^[-*+]\s+/, '')}`).join('\n');
    }
  }

  return text;
}

// Entry point convert cho từng field job. HTML cũ được convert, Markdown sẵn có được giữ nguyên.
function toMarkdown(value: string | null, field: 'description' | 'requirements' | 'benefits') {
  if (!value) return value;

  if (looksLikeHtml(value)) {
    return htmlToMarkdown(value);
  }

  return plainTextToMarkdown(value, field);
}

async function main() {
  // Chỉ chọn field cần migrate để tránh ghi đè nhầm các dữ liệu job khác.
  const jobs = await prisma.job.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      requirements: true,
      benefits: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  let changedJobs = 0;
  let changedFields = 0;
  let previewedJobs = 0;

  for (const job of jobs) {
    const next = {
      description: toMarkdown(job.description, 'description') ?? job.description,
      requirements: toMarkdown(job.requirements, 'requirements'),
      benefits: toMarkdown(job.benefits, 'benefits'),
    };

    const data: JobMarkdownUpdate = {};

    // So sánh từng field để update tối thiểu; nếu chạy lại script thì phải ra 0 changes.
    if (next.description !== job.description) {
      data.description = next.description;
      changedFields += 1;
    }

    if (next.requirements !== job.requirements) {
      data.requirements = next.requirements;
      changedFields += 1;
    }

    if (next.benefits !== job.benefits) {
      data.benefits = next.benefits;
      changedFields += 1;
    }

    if (Object.keys(data).length === 0) continue;

    changedJobs += 1;
    if (VERBOSE || previewedJobs < MAX_PREVIEW) {
      previewedJobs += 1;
      console.log(`\n${APPLY ? 'Updating' : 'Would update'}: ${job.title} (${job.id})`);
      for (const [field, value] of Object.entries(data)) {
        // Preview chỉ in đoạn đầu để log không quá lớn với DB nhiều job.
        const preview = String(value ?? '').slice(0, 140).replace(/\n/g, '\\n');
        console.log(`  - ${field}: ${preview}${String(value ?? '').length > 140 ? '...' : ''}`);
      }
    }

    if (APPLY) {
      // Chỉ khi có --apply mới ghi DB; dry-run dùng để review trước khi migrate.
      await prisma.job.update({
        where: { id: job.id },
        data,
      });
    }
  }

  console.log(`\n${APPLY ? 'Updated' : 'Dry-run'} jobs: ${changedJobs}/${jobs.length}`);
  console.log(`${APPLY ? 'Updated' : 'Would update'} fields: ${changedFields}`);
  if (!VERBOSE && changedJobs > MAX_PREVIEW) {
    console.log(`Preview limited to ${MAX_PREVIEW} jobs. Run with --verbose to print all changes.`);
  }

  if (!APPLY) {
    console.log('\nRun with --apply to write changes.');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
