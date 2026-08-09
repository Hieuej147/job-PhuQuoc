import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log('Seeding database...');

  // ===== Address data =====
  const province = await prisma.addressProvince.create({
    data: { id: 'province_kg', name: 'Kiên Giang', slug: 'kien-giang' },
  });

  const district = await prisma.addressDistrict.create({
    data: { id: 'district_pq', name: 'Phú Quốc', slug: 'phu-quoc', provinceId: province.id },
  });

  const wards = await Promise.all([
    prisma.addressWard.create({ data: { id: 'ward_dd', name: 'Dương Đông', slug: 'duong-dong', districtId: district.id } }),
    prisma.addressWard.create({ data: { id: 'ward_dt', name: 'An Thới', slug: 'an-thoi', districtId: district.id } }),
    prisma.addressWard.create({ data: { id: 'ward_cd', name: 'Cửa Cạn', slug: 'cua-can', districtId: district.id } }),
    prisma.addressWard.create({ data: { id: 'ward_hm', name: 'Hàm Ninh', slug: 'ham-ninh', districtId: district.id } }),
  ]);

  console.log('Seeded address data');

  // ===== Categories =====
  const categories = await Promise.all([
    prisma.jobCategory.create({ data: { id: 'cat_fnb', name: 'Nhà hàng - Khách sạn', slug: 'nha-hang-khach-san', icon: 'hotel' } }),
    prisma.jobCategory.create({ data: { id: 'cat_tour', name: 'Du lịch - Lữ hành', slug: 'du-lich-lu-hanh', icon: 'map' } }),
    prisma.jobCategory.create({ data: { id: 'cat_it', name: 'Công nghệ thông tin', slug: 'cong-nghe-thong-tin', icon: 'code' } }),
    prisma.jobCategory.create({ data: { id: 'cat_sale', name: 'Bán hàng', slug: 'ban-hang', icon: 'shopping-cart' } }),
    prisma.jobCategory.create({ data: { id: 'cat_ketoan', name: 'Kế toán - Tài chính', slug: 'ke-toan-tai-chinh', icon: 'calculator' } }),
    prisma.jobCategory.create({ data: { id: 'cat_xaydung', name: 'Xây dựng', slug: 'xay-dung', icon: 'building' } }),
    prisma.jobCategory.create({ data: { id: 'cat_yte', name: 'Y tế - Sức khỏe', slug: 'yte-suc-khoe', icon: 'heart' } }),
    prisma.jobCategory.create({ data: { id: 'cat_giaoduc', name: 'Giáo dục - Đào tạo', slug: 'giao-duc-dao-tao', icon: 'book' } }),
  ]);

  console.log('Seeded categories');

  // ===== Templates =====
  const templates = await Promise.all([
    // Template 1: Modern Professional - Xanh dương, sidebar trái
    prisma.resumeTemplate.create({
      data: {
        id: 'tpl-modern-01',
        name: 'Modern Professional',
        description: 'Hiện đại, chuyên nghiệp - sidebar trái màu xanh dương',
        previewUrl: '/templates/preview-modern.svg',
        isPublic: true,
      },
    }),

    // Template 2: Classic Elegant - Nâu/beige, header trên + 2 cột dưới
    prisma.resumeTemplate.create({
      data: {
        id: 'tpl-classic-02',
        name: 'Classic Elegant',
        description: 'Truyền thống, thanh lịch - phù hợp mọi ngành',
        previewUrl: '/templates/preview-classic.svg',
        isPublic: true,
      },
    }),

    // Template 3: Creative Bold - Gradient tím-xanh, 1 cột
    prisma.resumeTemplate.create({
      data: {
        id: 'tpl-creative-04',
        name: 'Creative Bold',
        description: 'Sáng tạo, nổi bật - gradient header, badge skills',
        previewUrl: '/templates/preview-creative.svg',
        isPublic: true,
      },
    }),

    // Template 4: Minimalist Clean - Đen trắng, 1 cột, typography lớn
    prisma.resumeTemplate.create({
      data: {
        id: 'tpl-minimal-03',
        name: 'Minimalist Clean',
        description: 'Tối giản, sạch sẽ - typography lớn, nhiều khoảng trắng',
        previewUrl: '/templates/preview-minimal.svg',
        isPublic: true,
      },
    }),

    // Template 5: Tech Developer - Dark mode, terminal style
    prisma.resumeTemplate.create({
      data: {
        id: 'tpl-dev-05',
        name: 'Tech Developer',
        description: 'Dark mode, terminal style - dành cho developer',
        previewUrl: '/templates/preview-dev.svg',
        isPublic: true,
      },
    }),
  ]);

  console.log('Seeded templates');

  // ===== Users =====
  const admin = await prisma.user.create({
    data: {
      id: 'cuid_admin_001',
      name: 'Admin',
      email: 'admin@phuquoc.jobs',
      emailVerified: true,
      role: Role.ADMIN,
      phone: '0900000001',
    },
  });

  const employer = await prisma.user.create({
    data: {
      id: 'cuid_employer_001',
      name: 'Nguyen Van A',
      email: 'employer@phuquoc.jobs',
      emailVerified: true,
      role: Role.EMPLOYER,
      phone: '0900000002',
    },
  });

  const employers2to8 = await Promise.all(
    Array.from({ length: 99 }, (_, i) => {
      const num = i + 2;
      return prisma.user.create({
        data: {
          id: `cuid_employer_${String(num).padStart(3, '0')}`,
          name: `Employer ${num}`,
          email: `employer${num}@phuquoc.jobs`,
          emailVerified: true,
          role: Role.EMPLOYER,
          phone: `0900000${String(num + 2).padStart(3, '0')}`,
        },
      });
    })
  );

  const candidate = await prisma.user.create({
    data: {
      id: 'cuid_candidate_001',
      name: 'Tran Thi B',
      email: 'candidate@phuquoc.jobs',
      emailVerified: true,
      role: Role.CANDIDATE,
      phone: '0900000003',
    },
  });

  console.log('Seeded users');

  // ===== Companies =====
  const company = await prisma.company.create({
    data: {
      id: 'company_001',
      name: 'Phú Quốc Resort & Spa',
      slug: 'phu-quoc-resort-spa',
      description: 'Khu nghỉ dưỡng 5 sao tại Phú Quốc',
      wardId: wards[0].id,
      addressDetail: '123 Trần Hưng Đạo',
      size: 'SIZE_201_500',
      industry: 'Du lịch - Khách sạn',
      ownerId: employer.id,
      isApproved: true,
    },
  });

  await Promise.all([
    prisma.company.create({
      data: {
        id: 'company_002',
        name: 'Vinpearl Resort',
        slug: 'vinpearl-resort',
        description: 'Resort cao cấp',
        wardId: wards[0].id,
        addressDetail: '1 Bãi Dài',
        size: 'SIZE_500_PLUS',
        industry: 'Khách sạn & Resort',
        ownerId: employers2to8[0].id,
        isApproved: true,
      },
    }),
    prisma.company.create({
      data: {
        id: 'company_003',
        name: 'Sao Biển Restaurant',
        slug: 'sao-bien-restaurant',
        description: 'Nhà hàng hải sản',
        wardId: wards[1].id,
        addressDetail: '20 Trần Hưng Đạo',
        size: 'SIZE_51_200',
        industry: 'Nhà hàng & F&B',
        ownerId: employers2to8[1].id,
        isApproved: true,
      },
    }),
    prisma.company.create({
      data: {
        id: 'company_004',
        name: 'PQ Travel',
        slug: 'pq-travel',
        description: 'Công ty du lịch lữ hành',
        wardId: wards[2].id,
        addressDetail: '5 Nguyễn Trãi',
        size: 'SIZE_1_50',
        industry: 'Du lịch & Lữ hành',
        ownerId: employers2to8[2].id,
        isApproved: true,
      },
    }),
    prisma.company.create({
      data: {
        id: 'company_005',
        name: 'PQ Mart',
        slug: 'pq-mart',
        description: 'Chuỗi bán lẻ',
        wardId: wards[3].id,
        addressDetail: '10 Lê Lợi',
        size: 'SIZE_201_500',
        industry: 'Bán lẻ & Dịch vụ',
        ownerId: employers2to8[3].id,
        isApproved: true,
      },
    }),
    prisma.company.create({
      data: {
        id: 'company_006',
        name: 'PQ Tech',
        slug: 'pq-tech',
        description: 'Công ty công nghệ',
        wardId: wards[0].id,
        addressDetail: '99 Hùng Vương',
        size: 'SIZE_1_50',
        industry: 'IT & Công nghệ',
        ownerId: employers2to8[4].id,
        isApproved: true,
      },
    }),
    prisma.company.create({
      data: {
        id: 'company_007',
        name: 'PQ Construction',
        slug: 'pq-construction',
        description: 'Công ty xây dựng',
        wardId: wards[1].id,
        addressDetail: '7 Phạm Văn Đồng',
        size: 'SIZE_51_200',
        industry: 'Xây dựng',
        ownerId: employers2to8[5].id,
        isApproved: true,
      },
    }),
    prisma.company.create({
      data: {
        id: 'company_008',
        name: 'PQ Spa & Wellness',
        slug: 'pq-spa-wellness',
        description: 'Spa và chăm sóc sức khỏe',
        wardId: wards[2].id,
        addressDetail: '15 Trần Phú',
        size: 'SIZE_1_50',
        industry: 'Y tế & Spa',
        ownerId: employers2to8[6].id,
        isApproved: true,
      },
    }),
  ]);

  await Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const num = i + 9; // 9..20
      const industries = ['Khách sạn & Resort', 'Nhà hàng & F&B', 'Du lịch & Lữ hành', 'Bán lẻ & Dịch vụ', 'IT & Công nghệ', 'Xây dựng', 'Y tế & Spa', 'Du lịch - Khách sạn'];
      const sizes = ['SIZE_1_50', 'SIZE_51_200', 'SIZE_201_500', 'SIZE_500_PLUS'];
      return prisma.company.create({
        data: {
          id: `company_${String(num).padStart(3, '0')}`,
          name: `Công ty Demo ${num}`,
          slug: `cong-ty-demo-${num}`,
          description: `Mô tả công ty demo số ${num}`,
          wardId: wards[i % 4].id,
          addressDetail: `${num} Đường Demo`,
          size: sizes[i % sizes.length] as any,
          industry: industries[i % industries.length],
          ownerId: employers2to8[i + 7].id, // employers index 7..18 = id 009..020
          isApproved: true,
        },
      });
    })
  );

  await Promise.all(
    Array.from({ length: 80 }, (_, i) => {
      const num = i + 21; // 21..100
      const industries = ['Khách sạn & Resort', 'Nhà hàng & F&B', 'Du lịch & Lữ hành', 'Bán lẻ & Dịch vụ', 'IT & Công nghệ', 'Xây dựng', 'Y tế & Spa', 'Du lịch - Khách sạn'];
      const sizes = ['SIZE_1_50', 'SIZE_51_200', 'SIZE_201_500', 'SIZE_500_PLUS'];
      return prisma.company.create({
        data: {
          id: `company_${String(num).padStart(3, '0')}`,
          name: `Công ty Demo ${num}`,
          slug: `cong-ty-demo-${num}`,
          description: `Mô tả công ty demo số ${num}`,
          wardId: wards[i % 4].id,
          addressDetail: `${num} Đường Demo`,
          size: sizes[i % sizes.length] as any,
          industry: industries[i % industries.length],
          ownerId: employers2to8[i + 19].id, // index 19..98 = id 021..100
          isApproved: true,
        },
      });
    })
  );

  console.log('Seeded companies');

  // ===== Jobs =====
  const sampleJobData: any[] = [
    { id: 'job_001', title: 'Lễ tân khách sạn 5 sao', slug: 'le-tan-khach-san-5-sao', description: 'Tuyển lễ tân khách sạn 5 sao tại Dương Đông', requirements: 'Tiếng Anh giao tiếp tốt', benefits: 'Lương thưởng, bảo hiểm, ăn trưa', quantity: 2, salaryMin: 8000000, salaryMax: 12000000, wardId: wards[0].id, type: 'FULL_TIME', experience: 'UNDER_1_YEAR', level: 'FRESHER', status: 'ACTIVE', categoryId: categories[0].id, companyId: company.id },
    { id: 'job_002', title: 'Frontend Developer (ReactJS / Next.js)', slug: 'frontend-developer-reactjs', description: 'Tuyển Frontend Developer làm việc remote', requirements: 'React, TypeScript, 2 năm kinh nghiệm', benefits: 'Lương cao, flexible time, remote', quantity: 1, salaryMin: 15000000, salaryMax: 25000000, type: 'REMOTE', experience: 'ONE_TO_THREE_YEARS', level: 'MID', status: 'ACTIVE', categoryId: categories[2].id, companyId: company.id },
    { id: 'job_003', title: 'Hướng dẫn viên du lịch Phú Quốc', slug: 'huong-dan-vien-du-lich-phu-quoc', description: 'Tuyển HDV du lịch part-time', requirements: 'Tiếng Anh, kiến thức về Phú Quốc', benefits: 'Lương theo tour, tip', quantity: 5, salaryMin: 5000000, salaryMax: 15000000, wardId: wards[1].id, type: 'PART_TIME', experience: 'NO_EXPERIENCE', level: 'INTERN', status: 'ACTIVE', categoryId: categories[1].id, companyId: company.id },
    { id: 'job_004', title: 'Đầu bếp Á - Âu (Bếp Trưởng)', slug: 'dau-bep-a-au-bep-truong', description: 'Tuyển đầu bếp có kinh nghiệm nhà hàng resort', requirements: 'Kinh nghiệm 3 năm làm bếp', benefits: 'Bao ăn ở, thưởng doanh số', quantity: 2, salaryMin: 18000000, salaryMax: 30000000, wardId: wards[0].id, type: 'FULL_TIME', experience: 'THREE_TO_FIVE_YEARS', level: 'SENIOR', status: 'ACTIVE', categoryId: categories[0].id, companyId: company.id },
    { id: 'job_005', title: 'Nhân viên Phục vụ Nhà hàng', slug: 'nhan-vien-phuc-vu-nha-hang', description: 'Tuyển nhân viên chạy bàn, phục vụ F&B', requirements: 'Nhanh nhẹn, trung thực', benefits: 'Lương + Tip + Phụ cấp ăn uống', quantity: 10, salaryMin: 6000000, salaryMax: 9000000, wardId: wards[1].id, type: 'FULL_TIME', experience: 'NO_EXPERIENCE', level: 'FRESHER', status: 'ACTIVE', categoryId: categories[0].id, companyId: company.id },
    { id: 'job_006', title: 'Pha chế Bartender / Barista', slug: 'pha-che-bartender-barista', description: 'Pha chế đồ uống, cocktail cho quầy Bar resort', requirements: 'Có chứng chỉ pha chế hoặc kinh nghiệm 1 năm', benefits: 'Thưởng tip cao, môi trường năng động', quantity: 3, salaryMin: 9000000, salaryMax: 14000000, wardId: wards[0].id, type: 'FULL_TIME', experience: 'UNDER_1_YEAR', level: 'FRESHER', status: 'ACTIVE', categoryId: categories[0].id, companyId: company.id },
    { id: 'job_007', title: 'Quản lý Khách sạn / Resort Manager', slug: 'quan-ly-khach-san-resort-manager', description: 'Quản lý vận hành toàn bộ Resort', requirements: 'Kinh nghiệm 5 năm quản lý nghỉ dưỡng', benefits: 'Lương thỏa thuận + Xe đưa đón + Thưởng', quantity: 1, salaryMin: 35000000, salaryMax: 60000000, wardId: wards[0].id, type: 'FULL_TIME', experience: 'OVER_FIVE_YEARS', level: 'MANAGER', status: 'ACTIVE', categoryId: categories[0].id, companyId: company.id },
    { id: 'job_008', title: 'Nhân viên Buồng phòng (Housekeeping)', slug: 'nhan-vien-buong-phong-housekeeping', description: 'Dọn dẹp phòng khách sạn nghỉ dưỡng', requirements: 'Sức khỏe tốt, chăm chỉ', benefits: 'Có chỗ ở cho nhân viên, phụ cấp', quantity: 8, salaryMin: 7000000, salaryMax: 10000000, wardId: wards[2].id, type: 'FULL_TIME', experience: 'NO_EXPERIENCE', level: 'FRESHER', status: 'ACTIVE', categoryId: categories[0].id, companyId: company.id },
    { id: 'job_009', title: 'Chuyên viên Digital Marketing & SEO', slug: 'chuyen-vien-digital-marketing-seo', description: 'Chạy quảng cáo Facebook, Google Ads, SEO website', requirements: 'Am hiểu Ads, SEO, Content Marketing', benefits: 'Lương thưởng theo chiến dịch', quantity: 2, salaryMin: 12000000, salaryMax: 20000000, type: 'REMOTE', experience: 'ONE_TO_THREE_YEARS', level: 'MID', status: 'ACTIVE', categoryId: categories[2].id, companyId: company.id },
    { id: 'job_010', title: 'Kế toán tổng hợp Resort', slug: 'ke-toan-tong-hop-resort', description: 'Theo dõi doanh thu, chi phí, báo cáo thuế', requirements: 'Bằng đại học chuyên ngành Kế toán, 2 năm kinh nghiệm', benefits: 'Chế độ đầy đủ theo luật lao động', quantity: 1, salaryMin: 12000000, salaryMax: 18000000, wardId: wards[0].id, type: 'FULL_TIME', experience: 'ONE_TO_THREE_YEARS', level: 'MID', status: 'ACTIVE', categoryId: categories[4].id, companyId: company.id },
    { id: 'job_011', title: 'Nhân viên Bán hàng Tour & Vé cáp treo', slug: 'nhan-vien-ban-hang-tour-ve-cap-treo', description: 'Tư vấn bán tour tham quan đảo, vé vui chơi', requirements: 'Giao tiếp tốt, vui vẻ', benefits: 'Hoa hồng doanh số bán vé rất cao', quantity: 4, salaryMin: 7000000, salaryMax: 16000000, wardId: wards[1].id, type: 'FULL_TIME', experience: 'NO_EXPERIENCE', level: 'FRESHER', status: 'ACTIVE', categoryId: categories[3].id, companyId: company.id },
    { id: 'job_012', title: 'Tài xế lái xe tour 16 chỗ / 29 chỗ', slug: 'tai-xe-lai-xe-tour-16-cho', description: 'Chở khách tham quan các điểm du lịch Phú Quốc', requirements: 'Bằng D/E, thuộc đường Phú Quốc', benefits: 'Lương cứng + Phụ cấp chuyến + Tip', quantity: 3, salaryMin: 10000000, salaryMax: 18000000, wardId: wards[3].id, type: 'FULL_TIME', experience: 'ONE_TO_THREE_YEARS', level: 'MID', status: 'ACTIVE', categoryId: categories[1].id, companyId: company.id },
    { id: 'job_013', title: 'Kỹ sư Điện - Bảo trì Resort', slug: 'ky-su-dien-bao-tri-resort', description: 'Bảo trì hệ thống điện, điều hòa, máy phát điện', requirements: 'Tốt nghiệp Trung cấp/Cao đẳng Điện', benefits: 'Lương ổn định, trực ca có phụ cấp', quantity: 2, salaryMin: 9000000, salaryMax: 14000000, wardId: wards[0].id, type: 'FULL_TIME', experience: 'UNDER_1_YEAR', level: 'FRESHER', status: 'ACTIVE', categoryId: categories[5].id, companyId: company.id },
    { id: 'job_014', title: 'Kỹ thuật viên Spa & Massage', slug: 'ky-thuat-vien-spa-massage', description: 'Thực hiện liệu trình chăm sóc sức khỏe, massage cho khách', requirements: 'Có chứng chỉ spa hoặc tay nghề tốt', benefits: 'Lương cứng + % tour liệu trình + Tip', quantity: 6, salaryMin: 10000000, salaryMax: 22000000, wardId: wards[2].id, type: 'FULL_TIME', experience: 'UNDER_1_YEAR', level: 'FRESHER', status: 'ACTIVE', categoryId: categories[6].id, companyId: company.id },
    { id: 'job_015', title: 'Backend Developer (Node.js / NestJS)', slug: 'backend-developer-nodejs-nestjs', description: 'Phát triển hệ thống API backend microservices', requirements: 'Node.js, NestJS, PostgreSQL, Redis', benefits: 'Lương thỏa thuận hấp dẫn, WFH', quantity: 2, salaryMin: 18000000, salaryMax: 32000000, type: 'REMOTE', experience: 'THREE_TO_FIVE_YEARS', level: 'SENIOR', status: 'ACTIVE', categoryId: categories[2].id, companyId: company.id },
    { id: 'job_016', title: 'Nhân viên Bảo vệ Resort / Night Guard', slug: 'nhan-vien-bao-ve-resort-night-guard', description: 'Đảm bảo an ninh trật tự khu nghỉ dưỡng', requirements: 'Sức khỏe tốt, trung thực, ưu tiên bộ đội xuất ngũ', benefits: 'Bao ăn ở, đồng phục miễn phí', quantity: 4, salaryMin: 7500000, salaryMax: 10000000, wardId: wards[0].id, type: 'FULL_TIME', experience: 'NO_EXPERIENCE', level: 'FRESHER', status: 'ACTIVE', categoryId: categories[0].id, companyId: company.id },
    { id: 'job_017', title: 'Giáo viên Tiếng Anh Trung tâm', slug: 'giao-vien-tieng-anh-trung-tam', description: 'Giảng dạy tiếng Anh giao tiếp cho người đi làm', requirements: 'IELTS 6.5+ hoặc bằng Sư phạm Tiếng Anh', benefits: 'Lương theo giờ giảng linh hoạt', quantity: 3, salaryMin: 8000000, salaryMax: 15000000, wardId: wards[0].id, type: 'PART_TIME', experience: 'UNDER_1_YEAR', level: 'FRESHER', status: 'ACTIVE', categoryId: categories[7].id, companyId: company.id },
  ];

  await Promise.all(
    sampleJobData.map((job) =>
      prisma.job.upsert({
        where: { id: job.id },
        update: { ...job, deadline: new Date('2026-12-31') },
        create: { ...job, deadline: new Date('2026-12-31') },
      })
    )
  );

  console.log('Seeded jobs');

  // ===== Blog Categories =====
  const blogCat = await prisma.blogCategory.create({
    data: { id: 'blogcat_news', name: 'Tin tức', slug: 'tin-tuc' },
  });

  // ===== Blog =====
  await prisma.blogPost.create({
    data: {
      id: 'blog_001',
      title: 'Top 10 việc làm hot tại Phú Quốc 2026',
      slug: 'top-10-viec-lam-hot-phu-quoc-2026',
      content: 'Nội dung bài viết về top 10 việc làm hot...',
      excerpt: 'Tổng hợp các việc làm hấp dẫn nhất tại Phú Quốc năm 2026',
      categoryId: blogCat.id,
      authorId: admin.id,
      isPublished: true,
    },
  });

  console.log('Seeded blogs');
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
