import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const BACKUP_DIR = process.argv[2] || './backup';

function loadJSON(filename: string): any[] {
  const content = readFileSync(join(BACKUP_DIR, filename), 'utf-8');
  return JSON.parse(content);
}

function mapCompanySize(size: string | null): string | null {
  if (!size) return null;
  const map: Record<string, string> = {
    '1-50': 'SIZE_1_50',
    '51-200': 'SIZE_51_200',
    '201-500': 'SIZE_201_500',
    '500+': 'SIZE_500_PLUS',
  };
  return map[size] || size;
}

function mapJobStatus(status: string): string {
  return status === 'REJECTED' ? 'CLOSED' : status;
}

function mapNotificationType(type: string): string {
  if (type === 'NEW_MESSAGE') return 'SYSTEM';
  if (type === 'APPLICATION_STATUS_CHANGED') return 'APPLICATION_ACCEPTED';
  return type;
}

async function main() {
  console.log('=== Import Backup Data ===\n');
  console.log(`Backup directory: ${BACKUP_DIR}\n`);

  // 1. Addresses
  console.log('Addresses...');
  await prisma.addressWard.deleteMany();
  await prisma.addressDistrict.deleteMany();
  await prisma.addressProvince.deleteMany();
  for (const p of loadJSON('provinces.json')) {
    await prisma.addressProvince.create({ data: { id: p.id, name: p.name, slug: p.slug } });
  }
  for (const d of loadJSON('districts.json')) {
    await prisma.addressDistrict.create({ data: { id: d.id, name: d.name, slug: d.slug, provinceId: d.provinceId } });
  }
  for (const w of loadJSON('wards.json')) {
    await prisma.addressWard.create({ data: { id: w.id, name: w.name, slug: w.slug, districtId: w.districtId } });
  }
  console.log('  Done');

  // 2. Categories
  console.log('Job categories...');
  await prisma.job.deleteMany();
  await prisma.jobCategory.deleteMany();
  for (const c of loadJSON('categories.json')) {
    await prisma.jobCategory.create({ data: { id: c.id, name: c.name, slug: c.slug, icon: c.icon } });
  }
  console.log('  Done');

  // 3. Blog categories
  console.log('Blog categories...');
  await prisma.blogPost.deleteMany();
  await prisma.blogCategory.deleteMany();
  for (const c of loadJSON('blog_categories.json')) {
    await prisma.blogCategory.create({ data: { id: c.id, name: c.name, slug: c.slug } });
  }
  console.log('  Done');

  // 4. Templates
  console.log('Resume templates...');
  for (const t of loadJSON('templates.json')) {
    const exists = await prisma.resumeTemplate.findUnique({ where: { id: t.id } });
    if (!exists) {
      await prisma.resumeTemplate.create({
        data: {
          id: t.id,
          name: t.name,
          htmlTemplate: t.html_template,
          cssTemplate: t.css_template,
          isPublic: true,
          isActive: true,
        },
      });
    }
  }
  console.log('  Done');

  // 5. Users
  console.log('Users...');
  const existingUserIds = new Set(
    (await prisma.user.findMany({ select: { id: true } })).map(u => u.id)
  );
  let importedUsers = 0;
  for (const u of loadJSON('users.json')) {
    if (existingUserIds.has(u.id)) continue;
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.avatar,
        role: u.role,
        phone: u.phone,
        isActive: u.isActive ?? true,
        isLocked: u.isLocked ?? false,
        emailVerified: true,
      },
    });
    importedUsers++;
  }
  console.log(`  Imported ${importedUsers} users`);

  // 6. Companies
  console.log('Companies...');
  await prisma.savedCompany.deleteMany();
  await prisma.company.deleteMany();
  for (const c of loadJSON('companies.json')) {
    await prisma.company.create({
      data: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        logo: c.logo,
        website: c.website,
        description: c.description,
        wardId: c.wardId,
        addressDetail: c.addressDetail,
        size: mapCompanySize(c.size) as any,
        industry: c.industry,
        ownerId: c.ownerId,
        isApproved: c.isApproved ?? true,
        isActive: c.isActive ?? true,
      },
    });
  }
  console.log('  Done');

  // 7. Jobs
  console.log('Jobs...');
  await prisma.savedJob.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.payment.deleteMany();
  for (const j of loadJSON('jobs.json')) {
    await prisma.job.create({
      data: {
        id: j.id,
        title: j.title,
        slug: j.slug,
        description: j.description,
        benefits: j.benefits,
        requirements: j.requirements,
        quantity: j.quantity ?? 1,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        wardId: j.wardId,
        addressDetail: j.addressDetail,
        type: j.type,
        experience: j.experience,
        level: j.level,
        status: mapJobStatus(j.status) as any,
        deadline: j.deadline ? new Date(j.deadline) : null,
        categoryId: j.categoryId,
        companyId: j.companyId,
      },
    });
  }
  console.log('  Done');

  // 8. Blogs
  console.log('Blogs...');
  for (const b of loadJSON('blogs.json')) {
    await prisma.blogPost.create({
      data: {
        id: b.id,
        title: b.title,
        slug: b.slug,
        type: b.type || 'NORMAL',
        content: b.content,
        landingContent: b.landing_content,
        thumbnail: b.thumbnail,
        excerpt: b.excerpt,
        categoryId: b.categoryId,
        authorId: b.authorId,
        views: b.views ?? 0,
        isPublished: b.isPublished ?? false,
      },
    });
  }
  console.log('  Done');

  // 9. Resumes
  console.log('Resumes...');
  await prisma.candidateResume.deleteMany();
  for (const r of loadJSON('resumes.json')) {
    await prisma.candidateResume.create({
      data: {
        id: r.id,
        userId: r.userId,
        title: r.title || 'Hồ sơ của tôi',
        address: r.address,
        summary: r.summary,
        socialLinks: r.socicallink,
        education: r.education,
        experience: r.experience,
        projects: r.projects,
        degree: r.degree,
        languages: r.languages,
        templateId: r.templateID,
      },
    });
  }
  console.log('  Done');

  // 10. Applications
  console.log('Applications...');
  for (const a of loadJSON('applications.json')) {
    await prisma.jobApplication.create({
      data: {
        id: a.id,
        userId: a.userId,
        jobId: a.jobId,
        cvUrl: a.cvUrl,
        resumeId: a.resumeId,
        coverLetter: a.coverLetter,
        status: a.status,
        isBookmarked: a.isBookmarked ?? false,
      },
    });
  }
  console.log('  Done');

  // 11. Notifications
  console.log('Notifications...');
  await prisma.notification.deleteMany();
  for (const n of loadJSON('notifications.json')) {
    await prisma.notification.create({
      data: {
        id: n.id,
        userId: n.userId,
        type: mapNotificationType(n.type) as any,
        title: n.title,
        content: n.content,
        refId: n.refId,
        isRead: n.isRead ?? false,
      },
    });
  }
  console.log('  Done');

  // 12. Saved jobs
  console.log('Saved jobs...');
  for (const s of loadJSON('saved_jobs.json')) {
    await prisma.savedJob.create({ data: { id: s.id, userId: s.userId, jobId: s.jobId } });
  }
  console.log('  Done');

  // 13. Saved companies
  console.log('Saved companies...');
  for (const s of loadJSON('saved_companies.json')) {
    await prisma.savedCompany.create({ data: { id: s.id, userId: s.userId, companyId: s.companyId } });
  }
  console.log('  Done');

  // Verify
  console.log('\n=== Verify ===');
  const counts = await Promise.all([
    prisma.user.count(),
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
  console.log(`companies:        ${counts[1]}`);
  console.log(`jobs:             ${counts[2]}`);
  console.log(`blogs:            ${counts[3]}`);
  console.log(`resumes:          ${counts[4]}`);
  console.log(`applications:     ${counts[5]}`);
  console.log(`notifications:    ${counts[6]}`);
  console.log(`saved_jobs:       ${counts[7]}`);
  console.log(`saved_companies:  ${counts[8]}`);
  console.log(`job_categories:   ${counts[9]}`);
  console.log(`blog_categories:  ${counts[10]}`);
  console.log(`templates:        ${counts[11]}`);
  console.log(`wards:            ${counts[12]}`);
  console.log(`pricing_packages: ${counts[13]}`);
  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
