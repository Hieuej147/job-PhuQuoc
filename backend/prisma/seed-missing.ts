import { PrismaClient, Role, CompanySize, JobType, ExperienceLevel, JobLevel, JobStatus, BlogType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Inserting missing seed data...');

  // Get existing data
  const admin = await prisma.user.findUnique({ where: { email: 'admin@phuquoc.jobs' } });
  const employer = await prisma.user.findUnique({ where: { email: 'employer@phuquoc.jobs' } });
  const candidate = await prisma.user.findUnique({ where: { email: 'candidate@phuquoc.jobs' } });
  const catFnB = await prisma.jobCategory.findUnique({ where: { slug: 'nha-hang-khach-san' } });
  const catIT = await prisma.jobCategory.findUnique({ where: { slug: 'cong-nghe-thong-tin' } });
  const catTour = await prisma.jobCategory.findUnique({ where: { slug: 'du-lich-lu-hanh' } });
  const wardDD = await prisma.addressWard.findFirst({ where: { slug: 'duong-dong' } });
  const wardDT = await prisma.addressWard.findFirst({ where: { slug: 'an-thoi' } });

  if (!admin || !employer || !candidate || !catFnB || !catIT || !catTour || !wardDD || !wardDT) {
    console.error('Missing required base data. Run seed.ts first.');
    return;
  }

  // ===== Pricing Packages =====
  const existingPricing = await prisma.pricingPackage.count();
  if (existingPricing === 0) {
    await prisma.pricingPackage.createMany({
      data: [
        { id: 'pkg_basic', name: 'Cơ bản', days: 7, price: 50000, isActive: true },
        { id: 'pkg_standard', name: 'Tiêu chuẩn', days: 14, price: 90000, isActive: true },
        { id: 'pkg_premium', name: 'Cao cấp', days: 30, price: 150000, isActive: true },
        { id: 'pkg_vip', name: 'VIP', days: 60, price: 250000, isActive: true },
      ],
    });
    console.log('✅ Seeded 4 pricing packages');
  } else {
    console.log('⏭️ Pricing packages already exist');
  }

  // ===== Company =====
  const existingCompany = await prisma.company.count();
  let company;
  if (existingCompany === 0) {
    company = await prisma.company.create({
      data: {
        id: 'comp_resort',
        name: 'Phú Quốc Resort & Spa',
        slug: 'phu-quoc-resort-spa',
        logo: null,
        website: 'https://phuquoc-resort.vn',
        description: 'Khu nghỉ dưỡng 5 sao hàng đầu tại đảo Phú Quốc. Với đội ngũ nhân viên chuyên nghiệp và cơ sở vật chất hiện đại, chúng tôi mang đến trải nghiệm tuyệt vời cho du khách và môi trường làm việc lý tưởng cho nhân viên.',
        wardId: wardDD.id,
        addressDetail: '123 Trần Hưng Đạo, Dương Đông',
        size: CompanySize.SIZE_201_500,
        industry: 'Du lịch - Khách sạn',
        ownerId: employer.id,
        isApproved: true,
        isActive: true,
      },
    });
    console.log('✅ Seeded 1 company');
  } else {
    company = await prisma.company.findFirst();
    console.log('⏭️ Company already exists');
  }

  // ===== Jobs =====
  const existingJobs = await prisma.job.count();
  if (existingJobs === 0 && company && wardDD && wardDT) {
    await prisma.job.createMany({
      data: [
        {
          id: 'job_receptionist',
          title: 'Lễ tân khách sạn',
          slug: 'le-tan-khach-san',
          description: '<p>Chúng tôi đang tìm kiếm <strong>Lễ tân khách sạn</strong> năng động, thân thiện để gia nhập đội ngũ.</p><p><strong>Trách nhiệm:</strong></p><ul><li>Đón tiếp và hỗ trợ khách check-in/check-out</li><li>Giải đáp thắc mắc của khách qua điện thoại và trực tiếp</li><li>Quản lý đặt phòng và xử lý thanh toán</li></ul>',
          benefits: '<ul><li>Lương cạnh tranh + thưởng hiệu suất</li><li>Bảo hiểm xã hội đầy đủ</li><li>Ăn ca miễn phí</li><li>Đào tạo chuyên môn</li></ul>',
          requirements: '<ul><li>Tốt nghiệp CĐ/ĐH chuyên ngành Quản trị khách sạn</li><li>Giao tiếp tiếng Anh tốt</li><li>Kinh nghiệm 1 năm ưu tiên</li></ul>',
          quantity: 2,
          salaryMin: 8000000,
          salaryMax: 12000000,
          wardId: wardDD.id,
          addressDetail: '123 Trần Hưng Đạo',
          type: JobType.FULL_TIME,
          experience: ExperienceLevel.ONE_TO_THREE_YEARS,
          level: JobLevel.JUNIOR,
          status: JobStatus.ACTIVE,
          deadline: new Date('2026-07-15'),
          categoryId: catFnB.id,
          companyId: company.id,
        },
        {
          id: 'job_frontend',
          title: 'Frontend Developer (React/Next.js)',
          slug: 'frontend-developer-react-nextjs',
          description: '<p>Tuyển dụng <strong>Frontend Developer</strong> làm việc remote hoặc onsite tại Phú Quốc.</p><p><strong>Yêu cầu:</strong></p><ul><li>Thành thạo React, Next.js, TypeScript</li><li>Kinh nghiệm với TailwindCSS hoặc CSS-in-JS</li><li>Hiểu biết về REST API và GraphQL</li></ul>',
          benefits: '<ul><li>Lương USD hoặc VNĐ theo năng lực</li><li>Làm việc flexible</li><li>MacBook Pro được cấp</li><li>15 ngày phép/năm</li></ul>',
          requirements: '<ul><li>2+ năm kinh nghiệm React</li><li>Có portfolio hoặc GitHub</li><li>Đam mê clean code</li></ul>',
          quantity: 1,
          salaryMin: 15000000,
          salaryMax: 30000000,
          wardId: wardDD.id,
          addressDetail: 'Remote / 45 Nguyễn Văn Cừ',
          type: JobType.FULL_TIME,
          experience: ExperienceLevel.ONE_TO_THREE_YEARS,
          level: JobLevel.MID,
          status: JobStatus.ACTIVE,
          deadline: new Date('2026-08-01'),
          categoryId: catIT.id,
          companyId: company.id,
        },
        {
          id: 'job_tourguide',
          title: 'Hướng dẫn viên du lịch',
          slug: 'huong-dan-vien-du-lich',
          description: '<p>Tuyển <strong>Hướng dẫn viên du lịch</strong> cho các tour khám phá đảo Phú Quốc.</p><p><strong>Mô tả công việc:</strong></p><ul><li>Dẫn tour cho khách quốc tế và nội địa</li><li>Giới thiệu lịch sử, văn hóa Phú Quốc</li><li>Đảm bảo an toàn cho khách trong suốt chuyến đi</li></ul>',
          benefits: '<ul><li>Tip từ khách + lương cơ bản</li><li>Được đi tour miễn phí</li><li>Đào tạo nghiệp vụ</li></ul>',
          requirements: '<ul><li>Chứng chỉ hướng dẫn viên</li><li>Tiếng Anh giao tiếp tốt</li><li>Sức khỏe tốt, năng động</li></ul>',
          quantity: 3,
          salaryMin: 6000000,
          salaryMax: 15000000,
          wardId: wardDT.id,
          addressDetail: 'Bến tàu An Thới',
          type: JobType.FULL_TIME,
          experience: ExperienceLevel.UNDER_1_YEAR,
          level: JobLevel.FRESHER,
          status: JobStatus.ACTIVE,
          deadline: new Date('2026-07-30'),
          categoryId: catTour.id,
          companyId: company.id,
        },
      ],
    });
    console.log('✅ Seeded 3 jobs');
  } else {
    console.log('⏭️ Jobs already exist or missing dependencies');
  }

  // ===== Blog Category =====
  const existingBlogCat = await prisma.blogCategory.count();
  let blogCat;
  if (existingBlogCat === 0) {
    blogCat = await prisma.blogCategory.create({
      data: { id: 'blogcat_news', name: 'Tin tức', slug: 'tin-tuc' },
    });
    console.log('✅ Seeded 1 blog category');
  } else {
    blogCat = await prisma.blogCategory.findFirst();
    console.log('⏭️ Blog category already exists');
  }

  // ===== Blog Posts =====
  const existingBlogs = await prisma.blogPost.count();
  if (existingBlogs === 0 && blogCat) {
    await prisma.blogPost.createMany({
      data: [
        {
          id: 'blog_top10',
          title: 'Top 10 việc làm hot nhất Phú Quốc 2026',
          slug: 'top-10-viec-lam-hot-nhat-phu-quoc-2026',
          type: BlogType.NORMAL,
          content: `<h2>1. Lễ tân khách sạn</h2><p>Vị trí lễ tân luôn nằm trong top đầu nhu cầu tuyển dụng tại Phú Quốc. Với sự phát triển mạnh mẽ của ngành du lịch, các khu nghỉ dưỡng 5 sao liên tục tìm kiếm nhân sự chất lượng cao.</p><h2>2. Hướng dẫn viên du lịch</h2><p>Phú Quốc đón hàng triệu lượt khách mỗi năm, tạo nhu cầu lớn cho hướng dẫn viên thông thạo ngoại ngữ.</p><h2>3. Đầu bếp</h2><p>Ẩm thực là yếu tố quan trọng trong trải nghiệm du lịch. Các nhà hàng, resort luôn cần đầu bếp giỏi.</p><h2>4. Nhân viên IT</h2><p>Các công ty công nghệ đang mở rộng hoạt động tại Phú Quốc, tạo cơ hội cho lập trình viên.</p><h2>5. Nhân viên bán hàng</h2><p>Các trung tâm thương mại, cửa hàng lưu niệm cần nhiều nhân viên bán hàng.</p>`,
          thumbnail: null,
          excerpt: 'Khám phá top 10 việc làm được săn đón nhất tại đảo ngọc Phú Quốc năm 2026.',
          categoryId: blogCat ? blogCat.id : null,
          authorId: admin.id,
          views: 156,
          isPublished: true,
        },
        {
          id: 'blog_cv',
          title: 'Cách viết CV ấn tượng cho ngành du lịch',
          slug: 'cach-vet-cv-an-tuong-cho-nganh-du-lich',
          type: BlogType.NORMAL,
          content: `<h2>Tại sao CV quan trọng?</h2><p>CV là ấn tượng đầu tiên của nhà tuyển dụng về bạn. Một CV tốt sẽ giúp bạn nổi bật giữa hàng trăm ứng viên.</p><h2>Các yếu tố cần có</h2><ul><li>Thông tin liên lạc rõ ràng</li><li>Mục tiêu nghề nghiệp cụ thể</li><li>Kinh nghiệm làm việc liên quan</li><li>Kỹ năng ngoại ngữ</li></ul>`,
          thumbnail: null,
          excerpt: 'Hướng dẫn chi tiết cách viết CV chuyên nghiệp cho ngành du lịch - khách sạn.',
          categoryId: blogCat ? blogCat.id : null,
          authorId: admin.id,
          views: 89,
          isPublished: true,
        },
      ],
    });
    console.log('✅ Seeded 2 blog posts');
  } else {
    console.log('⏭️ Blog posts already exist');
  }

  console.log('\n✅ Done! Summary:');
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.job.count(),
    prisma.jobCategory.count(),
    prisma.pricingPackage.count(),
    prisma.blogPost.count(),
    prisma.resumeTemplate.count(),
    prisma.addressWard.count(),
  ]);
  console.log(`  Users: ${counts[0]}`);
  console.log(`  Companies: ${counts[1]}`);
  console.log(`  Jobs: ${counts[2]}`);
  console.log(`  Categories: ${counts[3]}`);
  console.log(`  Pricing: ${counts[4]}`);
  console.log(`  Blogs: ${counts[5]}`);
  console.log(`  Templates: ${counts[6]}`);
  console.log(`  Wards: ${counts[7]}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
