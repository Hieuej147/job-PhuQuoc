import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log('Seeding database...');

  // ===== Address data =====
  const province = await prisma.addressProvince.create({
    data: { name: 'Kiên Giang', slug: 'kien-giang' },
  });

  const district = await prisma.addressDistrict.create({
    data: { name: 'Phú Quốc', slug: 'phu-quoc', provinceId: province.id },
  });

  const wards = await Promise.all([
    prisma.addressWard.create({ data: { name: 'Dương Đông', slug: 'duong-dong', districtId: district.id } }),
    prisma.addressWard.create({ data: { name: 'An Thới', slug: 'an-thoi', districtId: district.id } }),
    prisma.addressWard.create({ data: { name: 'Cửa Cạn', slug: 'cua-can', districtId: district.id } }),
    prisma.addressWard.create({ data: { name: 'Hàm Ninh', slug: 'ham-ninh', districtId: district.id } }),
  ]);

  console.log('Seeded address data');

  // ===== Categories =====
  const categories = await Promise.all([
    prisma.jobCategory.create({ data: { name: 'Nhà hàng - Khách sạn', slug: 'nha-hang-khach-san', icon: 'hotel' } }),
    prisma.jobCategory.create({ data: { name: 'Du lịch - Lữ hành', slug: 'du-lich-lu-hanh', icon: 'map' } }),
    prisma.jobCategory.create({ data: { name: 'Công nghệ thông tin', slug: 'cong-nghe-thong-tin', icon: 'code' } }),
    prisma.jobCategory.create({ data: { name: 'Bán hàng', slug: 'ban-hang', icon: 'shopping-cart' } }),
    prisma.jobCategory.create({ data: { name: 'Kế toán - Tài chính', slug: 'ke-toan-tai-chinh', icon: 'calculator' } }),
    prisma.jobCategory.create({ data: { name: 'Xây dựng', slug: 'xay-dung', icon: 'building' } }),
    prisma.jobCategory.create({ data: { name: 'Y tế - Sức khỏe', slug: 'yte-suc-khoe', icon: 'heart' } }),
    prisma.jobCategory.create({ data: { name: 'Giáo dục - Đào tạo', slug: 'giao-duc-dao-tao', icon: 'book' } }),
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
      name: 'Admin',
      email: 'admin@phuquoc.jobs',
      emailVerified: true,
      role: Role.ADMIN,
      phone: '0900000001',
    },
  });

  const employer = await prisma.user.create({
    data: {
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
  await Promise.all([
    prisma.job.create({
      data: {
        title: 'Lễ tân khách sạn',
        slug: 'le-tan-khach-san',
        description: 'Tuyển lễ tân khách sạn, yêu cầu tiếng Anh giao tiếp',
        requirements: 'Tiếng Anh giao tiếp, ngoại hình ưa nhìn',
        benefits: 'Lương thưởng, bảo hiểm, ăn trưa',
        quantity: 2,
        salaryMin: 8000000,
        salaryMax: 12000000,
        wardId: wards[0].id,
        type: 'FULL_TIME',
        experience: 'UNDER_1_YEAR',
        level: 'FRESHER',
        status: 'ACTIVE',
        deadline: new Date('2026-06-30'),
        categoryId: categories[0].id,
        companyId: company.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Frontend Developer',
        slug: 'frontend-developer',
        description: 'Tuyển Frontend Developer làm việc remote',
        requirements: 'React, TypeScript, 2 năm kinh nghiệm',
        benefits: 'Lương cao, flexible time, remote',
        quantity: 1,
        salaryMin: 15000000,
        salaryMax: 25000000,
        type: 'REMOTE',
        experience: 'ONE_TO_THREE_YEARS',
        level: 'MID',
        status: 'ACTIVE',
        deadline: new Date('2026-07-15'),
        categoryId: categories[2].id,
        companyId: company.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Hướng dẫn viên du lịch',
        slug: 'huong-dan-vien-du-lich',
        description: 'Tuyển HDV du lịch part-time',
        requirements: 'Tiếng Anh, kiến thức về Phú Quốc',
        benefits: 'Lương theo tour, tip',
        quantity: 5,
        salaryMin: 5000000,
        salaryMax: 15000000,
        wardId: wards[1].id,
        type: 'PART_TIME',
        experience: 'NO_EXPERIENCE',
        level: 'INTERN',
        status: 'ACTIVE',
        categoryId: categories[1].id,
        companyId: company.id,
      },
    }),
  ]);

  console.log('Seeded jobs');

  // ===== Blog Categories =====
  const blogCat = await prisma.blogCategory.create({
    data: { name: 'Tin tức', slug: 'tin-tuc' },
  });

  // ===== Blog =====
  await prisma.blogPost.create({
    data: {
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
