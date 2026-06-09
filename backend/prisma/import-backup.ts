import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const BACKUP = '/mnt/disk3/job-phuquoc/backup-neon';

function load(file: string) {
  return JSON.parse(readFileSync(join(BACKUP, file), 'utf-8'));
}

function mapSize(s: string | null): string | null {
  if (!s) return null;
  const m: Record<string, string> = { '1-50': 'SIZE_1_50', '51-200': 'SIZE_51_200', '201-500': 'SIZE_201_500', '500+': 'SIZE_500_PLUS' };
  return m[s] || s;
}

function mapJobStatus(s: string): string {
  return s === 'REJECTED' ? 'CLOSED' : s;
}

function mapNotiType(t: string): string {
  if (t === 'NEW_MESSAGE') return 'SYSTEM';
  if (t === 'APPLICATION_STATUS_CHANGED') return 'APPLICATION_ACCEPTED';
  return t;
}

async function main() {
  console.log('=== Import Backup Data ===\n');

  // 1. Addresses (ghi đè)
  console.log('Addresses...');
  await prisma.addressWard.deleteMany();
  await prisma.addressDistrict.deleteMany();
  await prisma.addressProvince.deleteMany();
  const provinces = load('provinces.json');
  const districts = load('districts.json');
  const wards = load('wards.json');
  for (const p of provinces) await prisma.addressProvince.create({ data: { id: p.id, name: p.name, slug: p.slug } });
  for (const d of districts) await prisma.addressDistrict.create({ data: { id: d.id, name: d.name, slug: d.slug, provinceId: d.provinceId } });
  for (const w of wards) await prisma.addressWard.create({ data: { id: w.id, name: w.name, slug: w.slug, districtId: w.districtId } });
  console.log(`  ${provinces.length} provinces, ${districts.length} districts, ${wards.length} wards`);

  // 2. Categories (ghi đè)
  console.log('Categories...');
  await prisma.job.deleteMany();
  await prisma.jobCategory.deleteMany();
  const categories = load('categories.json');
  for (const c of categories) await prisma.jobCategory.create({ data: { id: c.id, name: c.name, slug: c.slug, icon: c.icon } });
  console.log(`  ${categories.length} job categories`);

  // 3. Blog categories (ghi đè)
  console.log('Blog categories...');
  await prisma.blogPost.deleteMany();
  await prisma.blogCategory.deleteMany();
  const blogCats = load('blog_categories.json');
  for (const c of blogCats) await prisma.blogCategory.create({ data: { id: c.id, name: c.name, slug: c.slug } });
  console.log(`  ${blogCats.length} blog categories`);

  // 4. Templates (thêm mới, giữ 5 hiện có)
  console.log('Templates...');
  const templates = load('templates.json');
  let newTpl = 0;
  for (const t of templates) {
    const exists = await prisma.resumeTemplate.findUnique({ where: { id: t.id } });
    if (!exists) {
      await prisma.resumeTemplate.create({
        data: {
          id: t.id, name: t.name,
          htmlTemplate: t.html_template, cssTemplate: t.css_template,
          isPublic: true, isActive: true,
        },
      });
      newTpl++;
    }
  }
  console.log(`  ${newTpl} new templates (${templates.length} in backup)`);

  // 5. Users (thêm mới, giữ 3 users hiện có)
  console.log('Users...');
  const users = load('users.json');
  const existingUserIds = new Set(
    (await prisma.user.findMany({ select: { id: true } })).map(u => u.id)
  );
  let importedUsers = 0;
  for (const u of users) {
    if (existingUserIds.has(u.id)) continue;
    await prisma.user.create({
      data: {
        id: u.id, name: u.name, email: u.email,
        image: u.avatar, role: u.role, phone: u.phone,
        isActive: u.isActive ?? true, isLocked: u.isLocked ?? false,
        emailVerified: true,
      },
    });
    importedUsers++;
  }
  console.log(`  ${importedUsers} new users (${users.length} in backup, ${existingUserIds.size} kept)`);

  // 6. Companies
  console.log('Companies...');
  await prisma.savedCompany.deleteMany();
  await prisma.company.deleteMany();
  const companies = load('companies.json');
  for (const c of companies) {
    await prisma.company.create({
      data: {
        id: c.id, name: c.name, slug: c.slug,
        logo: c.logo, website: c.website, description: c.description,
        wardId: c.wardId, addressDetail: c.addressDetail,
        size: mapSize(c.size) as any, industry: c.industry,
        ownerId: c.ownerId, isApproved: c.isApproved ?? true, isActive: c.isActive ?? true,
      },
    });
  }
  console.log(`  ${companies.length} companies`);

  // 7. Jobs
  console.log('Jobs...');
  await prisma.savedJob.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.payment.deleteMany();
  const jobs = load('jobs.json');
  for (const j of jobs) {
    await prisma.job.create({
      data: {
        id: j.id, title: j.title, slug: j.slug,
        description: j.description, benefits: j.benefits, requirements: j.requirements,
        quantity: j.quantity ?? 1, salaryMin: j.salaryMin, salaryMax: j.salaryMax,
        wardId: j.wardId, addressDetail: j.addressDetail,
        type: j.type, experience: j.experience, level: j.level,
        status: mapJobStatus(j.status) as any,
        deadline: j.deadline ? new Date(j.deadline) : null,
        categoryId: j.categoryId, companyId: j.companyId,
      },
    });
  }
  console.log(`  ${jobs.length} jobs`);

  // 8. Blogs
  console.log('Blogs...');
  const blogs = load('blogs.json');
  for (const b of blogs) {
    await prisma.blogPost.create({
      data: {
        id: b.id, title: b.title, slug: b.slug,
        type: b.type || 'NORMAL', content: b.content,
        landingContent: b.landing_content, thumbnail: b.thumbnail, excerpt: b.excerpt,
        categoryId: b.categoryId, authorId: b.authorId,
        views: b.views ?? 0, isPublished: b.isPublished ?? false,
      },
    });
  }
  console.log(`  ${blogs.length} blogs`);

  // 9. Resumes
  console.log('Resumes...');
  await prisma.candidateResume.deleteMany();
  const resumes = load('resumes.json');
  for (const r of resumes) {
    await prisma.candidateResume.create({
      data: {
        id: r.id, userId: r.userId, title: r.title || 'Hồ sơ của tôi',
        address: r.address, summary: r.summary,
        socialLinks: r.socicallink, education: r.education,
        experience: r.experience, projects: r.projects,
        degree: r.degree, languages: r.languages,
        templateId: r.templateID,
      },
    });
  }
  console.log(`  ${resumes.length} resumes`);

  // 10. Applications
  console.log('Applications...');
  const apps = load('applications.json');
  for (const a of apps) {
    await prisma.jobApplication.create({
      data: {
        id: a.id, userId: a.userId, jobId: a.jobId,
        cvUrl: a.cvUrl, resumeId: a.resumeId, coverLetter: a.coverLetter,
        status: a.status, isBookmarked: a.isBookmarked ?? false,
      },
    });
  }
  console.log(`  ${apps.length} applications`);

  // 11. Notifications
  console.log('Notifications...');
  await prisma.notification.deleteMany();
  const notifs = load('notifications.json');
  for (const n of notifs) {
    await prisma.notification.create({
      data: {
        id: n.id, userId: n.userId,
        type: mapNotiType(n.type) as any,
        title: n.title, content: n.content,
        refId: n.refId, isRead: n.isRead ?? false,
      },
    });
  }
  console.log(`  ${notifs.length} notifications`);

  // 12. Saved jobs
  console.log('Saved jobs...');
  const savedJobs = load('saved_jobs.json');
  for (const s of savedJobs) {
    await prisma.savedJob.create({ data: { id: s.id, userId: s.userId, jobId: s.jobId } });
  }
  console.log(`  ${savedJobs.length} saved jobs`);

  // 13. Saved companies
  console.log('Saved companies...');
  const savedCos = load('saved_companies.json');
  for (const s of savedCos) {
    await prisma.savedCompany.create({ data: { id: s.id, userId: s.userId, companyId: s.companyId } });
  }
  console.log(`  ${savedCos.length} saved companies`);

  // Verify
  console.log('\n=== Verify ===');
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.company.count(),
    prisma.job.count(),
    prisma.blogPost.count(),
    prisma.candidateResume.count(),
    prisma.jobApplication.count(),
    prisma.notification.count(),
    prisma.savedJob.count(),
    prisma.savedCompany.count(),
    prisma.jobCategory.count(),
    prisma.blogCategory.count(),
    prisma.resumeTemplate.count(),
    prisma.addressWard.count(),
    prisma.pricingPackage.count(),
  ]);
  console.log(`users:            ${counts[0]}`);
  console.log(`accounts:         ${counts[1]}`);
  console.log(`companies:        ${counts[2]}`);
  console.log(`jobs:             ${counts[3]}`);
  console.log(`blogs:            ${counts[4]}`);
  console.log(`resumes:          ${counts[5]}`);
  console.log(`applications:     ${counts[6]}`);
  console.log(`notifications:    ${counts[7]}`);
  console.log(`saved_jobs:       ${counts[8]}`);
  console.log(`saved_companies:  ${counts[9]}`);
  console.log(`job_categories:   ${counts[10]}`);
  console.log(`blog_categories:  ${counts[11]}`);
  console.log(`templates:        ${counts[12]}`);
  console.log(`wards:            ${counts[13]}`);
  console.log(`pricing_packages: ${counts[14]}`);
  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
