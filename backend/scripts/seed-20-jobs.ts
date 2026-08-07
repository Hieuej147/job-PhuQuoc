import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL || 'postgresql://pq_user:pq_pass123@localhost:5435/pq_jobs' }),
});

const jobsData = [
  { title: 'Bếp Trưởng Điều Hành Resort 5 Star', cat: 'cat_fnb', salaryMin: 35000000, salaryMax: 50000000, type: 'FULL_TIME', exp: 'OVER_FIVE_YEARS', level: 'MANAGER' },
  { title: 'Nhân Viên Lễ Tân Thu Ngân Ca Đêm', cat: 'cat_fnb', salaryMin: 9000000, salaryMax: 12000000, type: 'FULL_TIME', exp: 'UNDER_1_YEAR', level: 'JUNIOR' },
  { title: 'Quản Lý Nhà Hàng Hải Sản Sunset', cat: 'cat_fnb', salaryMin: 20000000, salaryMax: 30000000, type: 'FULL_TIME', exp: 'THREE_TO_FIVE_YEARS', level: 'MANAGER' },
  { title: 'Pha Chế Barista Beach Bar', cat: 'cat_fnb', salaryMin: 10000000, salaryMax: 15000000, type: 'FULL_TIME', exp: 'ONE_TO_THREE_YEARS', level: 'MID' },
  { title: 'Nhân Viên Buồng Phòng Khách Sạn', cat: 'cat_fnb', salaryMin: 8000000, salaryMax: 11000000, type: 'FULL_TIME', exp: 'NO_EXPERIENCE', level: 'FRESHER' },
  
  { title: 'Hướng Dẫn Viên Du Lịch Quốc Tế (Tiếng Anh/Trung)', cat: 'cat_tour', salaryMin: 15000000, salaryMax: 25000000, type: 'FULL_TIME', exp: 'ONE_TO_THREE_YEARS', level: 'MID' },
  { title: 'Điều Hành Tour Du Thuyền Phú Quốc', cat: 'cat_tour', salaryMin: 18000000, salaryMax: 24000000, type: 'FULL_TIME', exp: 'THREE_TO_FIVE_YEARS', level: 'SENIOR' },
  { title: 'Tài Xế Lái Xe Du Lịch 16 Chỗ', cat: 'cat_tour', salaryMin: 12000000, salaryMax: 18000000, type: 'FULL_TIME', exp: 'ONE_TO_THREE_YEARS', level: 'MID' },

  { title: 'Kỹ Sư CNTT / Quản Trị Mạng Resort', cat: 'cat_it', salaryMin: 18000000, salaryMax: 26000000, type: 'FULL_TIME', exp: 'ONE_TO_THREE_YEARS', level: 'MID' },
  { title: 'Lập Trình Viên Frontend React/Next.js', cat: 'cat_it', salaryMin: 22000000, salaryMax: 35000000, type: 'REMOTE', exp: 'THREE_TO_FIVE_YEARS', level: 'SENIOR' },
  { title: 'Lập Trình Viên Backend Node.js / NestJS', cat: 'cat_it', salaryMin: 25000000, salaryMax: 40000000, type: 'REMOTE', exp: 'THREE_TO_FIVE_YEARS', level: 'SENIOR' },

  { title: 'Chuyên Viên Marketing & Social Media', cat: 'cat_sale', salaryMin: 14000000, salaryMax: 20000000, type: 'FULL_TIME', exp: 'ONE_TO_THREE_YEARS', level: 'MID' },
  { title: 'Nhân Viên Sale Tour & Vé Cáp Treo', cat: 'cat_sale', salaryMin: 10000000, salaryMax: 20000000, type: 'FULL_TIME', exp: 'NO_EXPERIENCE', level: 'JUNIOR' },
  { title: 'Trưởng Phòng Bán Hàng Bất Động Sản', cat: 'cat_sale', salaryMin: 30000000, salaryMax: 60000000, type: 'FULL_TIME', exp: 'OVER_FIVE_YEARS', level: 'MANAGER' },

  { title: 'Kế Toán Tổng Hợp Doanh Nghiệp', cat: 'cat_ketoan', salaryMin: 15000000, salaryMax: 22000000, type: 'FULL_TIME', exp: 'THREE_TO_FIVE_YEARS', level: 'SENIOR' },
  { title: 'Kế Toán Trưởng Khu Nghỉ Dưỡng', cat: 'cat_ketoan', salaryMin: 30000000, salaryMax: 45000000, type: 'FULL_TIME', exp: 'OVER_FIVE_YEARS', level: 'MANAGER' },

  { title: 'Giám Sát Công Trình Xây Dựng Dự Án', cat: 'cat_xaydung', salaryMin: 18000000, salaryMax: 25000000, type: 'FULL_TIME', exp: 'THREE_TO_FIVE_YEARS', level: 'SENIOR' },
  { title: 'Kỹ Sư Điện Nước M&E Khách Sạn', cat: 'cat_xaydung', salaryMin: 14000000, salaryMax: 20000000, type: 'FULL_TIME', exp: 'ONE_TO_THREE_YEARS', level: 'MID' },

  { title: 'Bác Sĩ Đa Khoa Phòng Khám Phú Quốc', cat: 'cat_yte', salaryMin: 25000000, salaryMax: 40000000, type: 'FULL_TIME', exp: 'THREE_TO_FIVE_YEARS', level: 'SENIOR' },
  { title: 'Giáo Viên Tiếng Anh Trung Tâm Ngoại Ngữ', cat: 'cat_giaoduc', salaryMin: 15000000, salaryMax: 22000000, type: 'PART_TIME', exp: 'ONE_TO_THREE_YEARS', level: 'MID' }
];

async function seed20() {
  const owner = (await prisma.user.findFirst({ where: { role: 'EMPLOYER' } })) || (await prisma.user.findFirst());
  const ward = (await prisma.addressWard.findFirst()) || { id: 'ward_dd' };

  const company = (await prisma.company.findFirst()) || (await prisma.company.create({
    data: {
      id: 'company_pq_001',
      name: 'Phú Quốc Tourism & Resort Group',
      slug: 'phu-quoc-tourism-resort-group',
      description: 'Tập đoàn Du lịch & Khách sạn Phú Quốc',
      wardId: ward.id,
      ownerId: owner ? owner.id : 'cuid_employer_001',
      addressDetail: 'Dương Đông, Phú Quốc',
      industry: 'Du lịch - Khách sạn',
      isApproved: true,
    }
  }));
  let count = 0;

  for (const item of jobsData) {
    const slug = item.title.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Math.floor(Math.random() * 10000);

    const categoryExists = await prisma.jobCategory.findUnique({ where: { id: item.cat } });
    const fallbackCategory = await prisma.jobCategory.findFirst();
    const categoryId = categoryExists ? item.cat : (fallbackCategory ? fallbackCategory.id : 'cat_fnb');

    await prisma.job.create({
      data: {
        title: item.title,
        slug: slug,
        description: `Mô tả công việc vị trí ${item.title}: Quản lý và thực hiện các công việc chuyên môn theo yêu cầu. Môi trường làm việc năng động, chuyên nghiệp tại Phú Quốc.`,
        requirements: `Yêu cầu vị trí ${item.title}: Tinh thần trách nhiệm cao, có kỹ năng chuyên môn phù hợp với vị trí ${item.level}.`,
        benefits: 'Chế độ BHXH, BHYT đầy đủ. Lương thưởng tháng 13, phụ cấp ăn ở, du lịch hàng năm.',
        quantity: Math.floor(Math.random() * 5) + 1,
        salaryMin: item.salaryMin,
        salaryMax: item.salaryMax,
        type: item.type as any,
        experience: item.exp as any,
        level: item.level as any,
        status: 'ACTIVE',
        categoryId: categoryId,
        wardId: ward.id,
        companyId: company.id,
      }
    });
    count++;
  }

  console.log(`Successfully created ${count} jobs!`);
}

seed20()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
