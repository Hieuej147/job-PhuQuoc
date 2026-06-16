import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

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
        previewUrl: '/templates/preview-modern.png',
        isPublic: true,
        htmlTemplate: `<div class="cv-container max-w-[210mm] mx-auto bg-white shadow-lg min-h-[297mm] font-sans text-gray-800">
  <!-- Header -->
  <header class="bg-sky-700 text-white px-8 py-10">
    <div class="flex items-center gap-6">
      <div class="w-28 h-28 rounded-full bg-sky-600 border-4 border-white/30 flex items-center justify-center text-4xl font-bold" data-field="avatar">{{avatar}}</div>
      <div class="flex-1">
        <h1 class="text-3xl font-extrabold tracking-tight" data-field="name">{{name}}</h1>
        <p class="text-sky-200 text-lg mt-1" data-field="degree">{{degree}}</p>
        <div class="flex flex-wrap gap-3 mt-3 text-sm text-sky-200">
          <span class="flex items-center gap-1">📧 <span data-field="email">{{email}}</span></span>
          <span class="flex items-center gap-1">📱 <span data-field="phone">{{phone}}</span></span>
          <span class="flex items-center gap-1">📍 <span data-field="address">{{address}}</span></span>
        </div>
      </div>
    </div>
  </header>

  <!-- Body -->
  <div class="grid grid-cols-[280px_1fr] min-h-[800px]">
    <!-- Sidebar -->
    <aside class="bg-sky-50 px-6 py-8 border-r border-sky-100">
      <!-- Skills -->
      <section class="mb-8">
        <h2 class="text-xs font-bold uppercase tracking-widest text-sky-700 mb-3 border-b-2 border-sky-300 pb-1">Kỹ năng</h2>
        <div class="flex flex-wrap gap-2" data-field="skills">{{skills}}</div>
      </section>

      <!-- Languages -->
      <section class="mb-8">
        <h2 class="text-xs font-bold uppercase tracking-widest text-sky-700 mb-3 border-b-2 border-sky-300 pb-1">Ngôn ngữ</h2>
        <p class="text-sm text-gray-600" data-field="languages">{{languages}}</p>
      </section>

      <!-- Education -->
      <section data-section="education">
        <h2 class="text-xs font-bold uppercase tracking-widest text-sky-700 mb-3 border-b-2 border-sky-300 pb-1">Học vấn</h2>
        <div data-repeat="education" class="mb-4">
          <p class="font-semibold text-sm" data-field="education.school">{{school}}</p>
          <p class="text-xs text-gray-500" data-field="education.degree">{{degree}} - {{field}}</p>
          <p class="text-xs text-gray-400">{{startYear}} - {{endYear}}</p>
          <p class="text-xs text-gray-600 mt-1" data-field="education.description">{{description}}</p>
        </div>
      </section>
    </aside>

    <!-- Main Content -->
    <main class="px-8 py-8">
      <!-- Summary -->
      <section class="mb-8">
        <h2 class="text-xs font-bold uppercase tracking-widest text-sky-700 mb-3 border-b-2 border-sky-300 pb-1">Tóm tắt</h2>
        <p class="text-sm leading-relaxed text-gray-600" data-field="summary">{{summary}}</p>
      </section>

      <!-- Experience -->
      <section class="mb-8" data-section="experience">
        <h2 class="text-xs font-bold uppercase tracking-widest text-sky-700 mb-3 border-b-2 border-sky-300 pb-1">Kinh nghiệm</h2>
        <div data-repeat="experience" class="mb-6">
          <div class="flex justify-between items-baseline">
            <h3 class="font-bold text-sm" data-field="experience.position">{{position}}</h3>
            <span class="text-xs text-gray-400">{{startYear}} - {{endYear}}</span>
          </div>
          <p class="text-xs text-sky-600 font-semibold" data-field="experience.company">{{company}}</p>
          <p class="text-sm text-gray-600 mt-2" data-field="experience.description">{{description}}</p>
        </div>
      </section>

      <!-- Projects -->
      <section data-section="projects">
        <h2 class="text-xs font-bold uppercase tracking-widest text-sky-700 mb-3 border-b-2 border-sky-300 pb-1">Dự án</h2>
        <div data-repeat="projects" class="mb-4 p-4 bg-sky-50 rounded-lg border border-sky-100">
          <div class="flex justify-between items-baseline">
            <h3 class="font-bold text-sm" data-field="projects.name">{{name}}</h3>
            <a class="text-xs text-sky-500 underline" data-field="projects.link" href="{{link}}">{{link}}</a>
          </div>
          <p class="text-xs text-gray-500 mt-1" data-field="projects.position">{{position}}</p>
          <p class="text-sm text-gray-600 mt-2" data-field="projects.description">{{description}}</p>
        </div>
      </section>
    </main>
  </div>
</div>`,
        cssTemplate: `.cv-container { font-family: 'Inter', system-ui, sans-serif; }
@media print { .cv-container { box-shadow: none; margin: 0; } }`,
      },
    }),

    // Template 2: Classic Elegant - Nâu/beige, header trên + 2 cột dưới
    prisma.resumeTemplate.create({
      data: {
        id: 'tpl-classic-02',
        name: 'Classic Elegant',
        description: 'Truyền thống, thanh lịch - phù hợp mọi ngành',
        previewUrl: '/templates/preview-classic.png',
        isPublic: true,
        htmlTemplate: `<div class="cv-container max-w-[210mm] mx-auto bg-white shadow-lg min-h-[297mm] font-serif text-gray-800">
  <!-- Header -->
  <header class="bg-stone-800 text-white px-10 py-8">
    <div class="flex items-center gap-6">
      <div class="w-24 h-24 rounded-full bg-stone-600 border-4 border-stone-400 flex items-center justify-center text-3xl font-bold" data-field="avatar">{{avatar}}</div>
      <div class="flex-1">
        <h1 class="text-3xl font-bold tracking-wide" data-field="name">{{name}}</h1>
        <p class="text-stone-300 italic mt-1" data-field="degree">{{degree}}</p>
        <div class="flex flex-wrap gap-4 mt-3 text-sm text-stone-300">
          <span>✉ <span data-field="email">{{email}}</span></span>
          <span>📞 <span data-field="phone">{{phone}}</span></span>
          <span>📍 <span data-field="address">{{address}}</span></span>
        </div>
      </div>
    </div>
  </header>

  <!-- Body -->
  <div class="grid grid-cols-[260px_1fr] min-h-[800px] border-t border-stone-200">
    <!-- Left Column -->
    <aside class="bg-stone-50 px-7 py-8 space-y-8 border-r border-stone-200">
      <!-- Education -->
      <section data-section="education">
        <h2 class="text-xs uppercase tracking-widest font-bold text-stone-600 mb-3 border-b-2 border-stone-400 pb-1">Học vấn</h2>
        <div data-repeat="education" class="mb-4">
          <p class="font-semibold text-sm text-stone-800" data-field="education.school">{{school}}</p>
          <p class="text-xs text-stone-600">{{degree}} - {{field}}</p>
          <p class="text-xs text-stone-500">{{startYear}} - {{endYear}} · GPA: {{GPA}}</p>
          <p class="text-xs text-stone-600 mt-1" data-field="education.description">{{description}}</p>
        </div>
      </section>

      <!-- Skills -->
      <section>
        <h2 class="text-xs uppercase tracking-widest font-bold text-stone-600 mb-3 border-b-2 border-stone-400 pb-1">Kỹ năng</h2>
        <div class="flex flex-wrap gap-2" data-field="skills">{{skills}}</div>
      </section>

      <!-- Languages -->
      <section>
        <h2 class="text-xs uppercase tracking-widest font-bold text-stone-600 mb-3 border-b-2 border-stone-400 pb-1">Ngôn ngữ</h2>
        <p class="text-sm text-stone-700" data-field="languages">{{languages}}</p>
      </section>
    </aside>

    <!-- Right Column -->
    <main class="px-10 py-8 space-y-8">
      <!-- Summary -->
      <section>
        <h2 class="text-xs uppercase tracking-widest font-bold text-stone-600 mb-3 border-b-2 border-stone-400 pb-1">Tóm tắt</h2>
        <p class="text-sm leading-relaxed text-gray-700" data-field="summary">{{summary}}</p>
      </section>

      <!-- Experience -->
      <section data-section="experience">
        <h2 class="text-xs uppercase tracking-widest font-bold text-stone-600 mb-3 border-b-2 border-stone-400 pb-1">Kinh nghiệm</h2>
        <div data-repeat="experience" class="mb-6">
          <div class="flex justify-between items-baseline">
            <h3 class="font-semibold text-stone-800" data-field="experience.position">{{position}}</h3>
            <span class="text-xs text-stone-500">{{startYear}} - {{endYear}}</span>
          </div>
          <p class="text-xs text-stone-600 italic" data-field="experience.company">{{company}}</p>
          <p class="text-sm text-gray-700 mt-2" data-field="experience.description">{{description}}</p>
        </div>
      </section>

      <!-- Projects -->
      <section data-section="projects">
        <h2 class="text-xs uppercase tracking-widest font-bold text-stone-600 mb-3 border-b-2 border-stone-400 pb-1">Dự án</h2>
        <div data-repeat="projects" class="mb-4">
          <div class="flex justify-between items-baseline">
            <h3 class="font-semibold text-stone-800" data-field="projects.name">{{name}}</h3>
            <a class="text-xs text-stone-500 underline" data-field="projects.link">{{link}}</a>
          </div>
          <p class="text-xs text-stone-500" data-field="projects.position">{{position}}</p>
          <p class="text-sm text-gray-700 mt-1" data-field="projects.description">{{description}}</p>
        </div>
      </section>
    </main>
  </div>
</div>`,
        cssTemplate: `.cv-container { font-family: 'Georgia', 'Times New Roman', serif; }
@media print { .cv-container { box-shadow: none; margin: 0; } }`,
      },
    }),

    // Template 3: Creative Bold - Gradient tím-xanh, 1 cột
    prisma.resumeTemplate.create({
      data: {
        id: 'tpl-creative-04',
        name: 'Creative Bold',
        description: 'Sáng tạo, nổi bật - gradient header, badge skills',
        previewUrl: '/templates/preview-creative.png',
        isPublic: true,
        htmlTemplate: `<div class="cv-container max-w-[210mm] mx-auto bg-white shadow-xl min-h-[297mm] font-sans text-slate-800 rounded-2xl overflow-hidden">
  <!-- Gradient Header -->
  <header class="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white px-10 py-12 relative">
    <div class="absolute right-0 top-0 w-1/3 h-full opacity-10 bg-[radial-gradient(circle_at_right,_white,_transparent)]"></div>
    <div class="relative flex items-center gap-8">
      <div class="w-28 h-28 rounded-full bg-white/20 border-4 border-white flex items-center justify-center text-4xl font-bold" data-field="avatar">{{avatar}}</div>
      <div class="flex-1">
        <h1 class="text-4xl font-extrabold tracking-tight" data-field="name">{{name}}</h1>
        <p class="text-violet-200 text-lg mt-1" data-field="degree">{{degree}}</p>
        <div class="flex flex-wrap gap-3 mt-4 text-xs">
          <span class="bg-white/20 px-3 py-1 rounded-full">📧 <span data-field="email">{{email}}</span></span>
          <span class="bg-white/20 px-3 py-1 rounded-full">📱 <span data-field="phone">{{phone}}</span></span>
          <span class="bg-white/20 px-3 py-1 rounded-full">📍 <span data-field="address">{{address}}</span></span>
        </div>
      </div>
    </div>
  </header>

  <!-- Content -->
  <div class="px-10 py-8 space-y-8">
    <!-- Summary -->
    <section>
      <h2 class="text-xs font-extrabold uppercase tracking-widest text-violet-700 mb-3 flex items-center gap-2">
        <span class="w-1 h-3 bg-violet-600 rounded-full"></span>
        Giới thiệu
      </h2>
      <p class="text-sm leading-relaxed text-gray-600" data-field="summary">{{summary}}</p>
    </section>

    <!-- Skills -->
    <section>
      <h2 class="text-xs font-extrabold uppercase tracking-widest text-violet-700 mb-3 flex items-center gap-2">
        <span class="w-1 h-3 bg-violet-600 rounded-full"></span>
        Kỹ năng
      </h2>
      <div class="flex flex-wrap gap-2" data-field="skills">{{skills}}</div>
    </section>

    <!-- Experience -->
    <section data-section="experience">
      <h2 class="text-xs font-extrabold uppercase tracking-widest text-violet-700 mb-3 flex items-center gap-2">
        <span class="w-1 h-3 bg-violet-600 rounded-full"></span>
        Kinh nghiệm
      </h2>
      <div data-repeat="experience" class="flex gap-4 mb-6">
        <div class="flex flex-col items-center pt-1">
          <div class="w-3 h-3 rounded-full bg-violet-600"></div>
          <div class="flex-1 w-px bg-violet-200 mt-1"></div>
        </div>
        <div class="flex-1">
          <div class="flex justify-between items-baseline">
            <h3 class="font-bold text-sm" data-field="experience.position">{{position}}</h3>
            <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{{startYear}} - {{endYear}}</span>
          </div>
          <p class="text-xs text-violet-600 font-semibold" data-field="experience.company">{{company}}</p>
          <p class="text-sm text-gray-600 mt-2" data-field="experience.description">{{description}}</p>
        </div>
      </div>
    </section>

    <!-- Education -->
    <section data-section="education">
      <h2 class="text-xs font-extrabold uppercase tracking-widest text-violet-700 mb-3 flex items-center gap-2">
        <span class="w-1 h-3 bg-violet-600 rounded-full"></span>
        Học vấn
      </h2>
      <div class="grid grid-cols-2 gap-4">
        <div data-repeat="education" class="p-4 bg-violet-50 rounded-xl border border-violet-100">
          <p class="font-bold text-sm" data-field="education.school">{{school}}</p>
          <p class="text-xs text-gray-500">{{degree}} - {{field}}</p>
          <p class="text-xs text-gray-400">{{startYear}} - {{endYear}} · GPA: {{GPA}}</p>
        </div>
      </div>
    </section>

    <!-- Projects -->
    <section data-section="projects">
      <h2 class="text-xs font-extrabold uppercase tracking-widest text-violet-700 mb-3 flex items-center gap-2">
        <span class="w-1 h-3 bg-violet-600 rounded-full"></span>
        Dự án
      </h2>
      <div class="grid grid-cols-2 gap-4">
        <div data-repeat="projects" class="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <h3 class="font-bold text-sm" data-field="projects.name">{{name}}</h3>
          <a class="text-xs text-violet-500 underline" data-field="projects.link">{{link}}</a>
          <p class="text-xs text-gray-500 mt-1" data-field="projects.position">{{position}}</p>
          <p class="text-xs text-gray-600 mt-2" data-field="projects.description">{{description}}</p>
        </div>
      </div>
    </section>

    <!-- Languages -->
    <section>
      <h2 class="text-xs font-extrabold uppercase tracking-widest text-violet-700 mb-3 flex items-center gap-2">
        <span class="w-1 h-3 bg-violet-600 rounded-full"></span>
        Ngôn ngữ
      </h2>
      <p class="text-sm text-gray-600" data-field="languages">{{languages}}</p>
    </section>
  </div>
</div>`,
        cssTemplate: `.cv-container { font-family: 'Inter', system-ui, sans-serif; }
@media print { .cv-container { box-shadow: none; margin: 0; border-radius: 0; } }`,
      },
    }),

    // Template 4: Minimalist Clean - Đen trắng, 1 cột, typography lớn
    prisma.resumeTemplate.create({
      data: {
        id: 'tpl-minimal-03',
        name: 'Minimalist Clean',
        description: 'Tối giản, sạch sẽ - typography lớn, nhiều khoảng trắng',
        previewUrl: '/templates/preview-minimal.png',
        isPublic: true,
        htmlTemplate: `<div class="cv-container max-w-[210mm] mx-auto bg-white shadow-lg min-h-[297mm] font-sans text-gray-900 px-12 py-10">
  <!-- Header -->
  <header class="mb-10 border-b border-gray-200 pb-8">
    <h1 class="text-5xl font-black tracking-tight" data-field="name">{{name}}</h1>
    <p class="text-xl text-gray-500 mt-2 font-light" data-field="degree">{{degree}}</p>
    <div class="flex gap-6 mt-4 text-sm text-gray-500">
      <span data-field="email">{{email}}</span>
      <span data-field="phone">{{phone}}</span>
      <span data-field="address">{{address}}</span>
    </div>
  </header>

  <!-- Summary -->
  <section class="mb-10">
    <h2 class="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">Giới thiệu</h2>
    <p class="text-base leading-relaxed text-gray-600 max-w-prose" data-field="summary">{{summary}}</p>
  </section>

  <!-- Skills -->
  <section class="mb-10">
    <h2 class="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">Kỹ năng</h2>
    <div class="flex flex-wrap gap-2" data-field="skills">{{skills}}</div>
  </section>

  <!-- Experience -->
  <section class="mb-10" data-section="experience">
    <h2 class="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">Kinh nghiệm</h2>
    <div data-repeat="experience" class="mb-8 grid grid-cols-[120px_1fr] gap-6">
      <div class="text-sm text-gray-400 pt-1">{{startYear}} - {{endYear}}</div>
      <div>
        <h3 class="font-bold text-lg" data-field="experience.position">{{position}}</h3>
        <p class="text-sm text-gray-500" data-field="experience.company">{{company}}</p>
        <p class="text-sm text-gray-600 mt-2 leading-relaxed" data-field="experience.description">{{description}}</p>
      </div>
    </div>
  </section>

  <!-- Education -->
  <section class="mb-10" data-section="education">
    <h2 class="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">Học vấn</h2>
    <div data-repeat="education" class="mb-6 grid grid-cols-[120px_1fr] gap-6">
      <div class="text-sm text-gray-400 pt-1">{{startYear}} - {{endYear}}</div>
      <div>
        <h3 class="font-bold" data-field="education.school">{{school}}</h3>
        <p class="text-sm text-gray-500">{{degree}} - {{field}} · GPA: {{GPA}}</p>
        <p class="text-sm text-gray-600 mt-1" data-field="education.description">{{description}}</p>
      </div>
    </div>
  </section>

  <!-- Projects -->
  <section data-section="projects">
    <h2 class="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">Dự án</h2>
    <div data-repeat="projects" class="mb-6">
      <div class="flex items-baseline gap-3">
        <h3 class="font-bold" data-field="projects.name">{{name}}</h3>
        <a class="text-sm text-gray-400 underline" data-field="projects.link">{{link}}</a>
      </div>
      <p class="text-sm text-gray-500" data-field="projects.position">{{position}}</p>
      <p class="text-sm text-gray-600 mt-1 leading-relaxed" data-field="projects.description">{{description}}</p>
    </div>
  </section>

  <!-- Languages -->
  <section class="mt-10">
    <h2 class="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">Ngôn ngữ</h2>
    <p class="text-sm text-gray-600" data-field="languages">{{languages}}</p>
  </section>
</div>`,
        cssTemplate: `.cv-container { font-family: 'Inter', system-ui, sans-serif; }
@media print { .cv-container { box-shadow: none; margin: 0; } }`,
      },
    }),

    // Template 5: Tech Developer - Dark mode, terminal style
    prisma.resumeTemplate.create({
      data: {
        id: 'tpl-dev-05',
        name: 'Tech Developer',
        description: 'Dark mode, terminal style - dành cho developer',
        previewUrl: '/templates/preview-dev.png',
        isPublic: true,
        htmlTemplate: `<div class="cv-container max-w-[210mm] mx-auto bg-[#0d1117] shadow-lg min-h-[297mm] font-mono text-[#c9d1d9]">
  <!-- Header -->
  <header class="border-b border-[#21262d] px-10 py-8">
    <div class="flex items-center gap-2 mb-4">
      <span class="w-3 h-3 rounded-full bg-[#ff5f56]"></span>
      <span class="w-3 h-3 rounded-full bg-[#ffbd2e]"></span>
      <span class="w-3 h-3 rounded-full bg-[#27c93f]"></span>
      <span class="text-xs text-[#484f58] ml-2">~/resume</span>
    </div>
    <div class="flex items-center gap-6">
      <div class="w-20 h-20 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-2xl font-bold text-[#58a6ff]" data-field="avatar">{{avatar}}</div>
      <div>
        <h1 class="text-2xl font-bold text-white" data-field="name">{{name}}</h1>
        <p class="text-[#58a6ff] mt-1" data-field="degree">{{degree}}</p>
        <div class="flex gap-4 mt-2 text-xs text-[#8b949e]">
          <span>📧 <span data-field="email">{{email}}</span></span>
          <span>📱 <span data-field="phone">{{phone}}</span></span>
          <span>📍 <span data-field="address">{{address}}</span></span>
        </div>
      </div>
    </div>
  </header>

  <!-- Body -->
  <div class="grid grid-cols-[250px_1fr] min-h-[750px]">
    <!-- Sidebar -->
    <aside class="border-r border-[#21262d] px-6 py-8 bg-[#161b22]">
      <!-- Skills -->
      <section class="mb-8">
        <h2 class="text-xs font-bold text-[#58a6ff] mb-3 flex items-center gap-2">
          <span class="text-[#27c93f]">$</span> skills
        </h2>
        <div class="flex flex-wrap gap-2" data-field="skills">{{skills}}</div>
      </section>

      <!-- Languages -->
      <section class="mb-8">
        <h2 class="text-xs font-bold text-[#58a6ff] mb-3 flex items-center gap-2">
          <span class="text-[#27c93f]">$</span> languages
        </h2>
        <p class="text-sm text-[#8b949e]" data-field="languages">{{languages}}</p>
      </section>

      <!-- Education -->
      <section data-section="education">
        <h2 class="text-xs font-bold text-[#58a6ff] mb-3 flex items-center gap-2">
          <span class="text-[#27c93f]">$</span> education
        </h2>
        <div data-repeat="education" class="mb-4 border-l-2 border-[#21262d] pl-3">
          <p class="font-semibold text-sm text-white" data-field="education.school">{{school}}</p>
          <p class="text-xs text-[#8b949e]">{{degree}} - {{field}}</p>
          <p class="text-xs text-[#484f58]">{{startYear}} - {{endYear}}</p>
        </div>
      </section>
    </aside>

    <!-- Main -->
    <main class="px-8 py-8">
      <!-- Summary -->
      <section class="mb-8">
        <h2 class="text-xs font-bold text-[#58a6ff] mb-3 flex items-center gap-2">
          <span class="text-[#27c93f]">$</span> cat about.md
        </h2>
        <p class="text-sm leading-relaxed text-[#8b949e] bg-[#161b22] p-4 rounded-lg border border-[#21262d]" data-field="summary">{{summary}}</p>
      </section>

      <!-- Experience -->
      <section class="mb-8" data-section="experience">
        <h2 class="text-xs font-bold text-[#58a6ff] mb-3 flex items-center gap-2">
          <span class="text-[#27c93f]">$</span> ls experience/
        </h2>
        <div data-repeat="experience" class="mb-6 bg-[#161b22] p-4 rounded-lg border border-[#21262d]">
          <div class="flex justify-between items-baseline">
            <h3 class="font-bold text-white" data-field="experience.position">{{position}}</h3>
            <span class="text-xs text-[#484f58]">{{startYear}} - {{endYear}}</span>
          </div>
          <p class="text-xs text-[#58a6ff]" data-field="experience.company">{{company}}</p>
          <p class="text-sm text-[#8b949e] mt-2" data-field="experience.description">{{description}}</p>
        </div>
      </section>

      <!-- Projects -->
      <section data-section="projects">
        <h2 class="text-xs font-bold text-[#58a6ff] mb-3 flex items-center gap-2">
          <span class="text-[#27c93f]">$</span> ls projects/
        </h2>
        <div data-repeat="projects" class="mb-4 bg-[#161b22] p-4 rounded-lg border border-[#21262d]">
          <div class="flex justify-between items-baseline">
            <h3 class="font-bold text-white" data-field="projects.name">{{name}}</h3>
            <a class="text-xs text-[#58a6ff] underline" data-field="projects.link">{{link}}</a>
          </div>
          <p class="text-xs text-[#8b949e]" data-field="projects.position">{{position}}</p>
          <p class="text-sm text-[#8b949e] mt-2" data-field="projects.description">{{description}}</p>
        </div>
      </section>
    </main>
  </div>
</div>`,
        cssTemplate: `.cv-container { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
@media print { .cv-container { box-shadow: none; margin: 0; } }`,
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
  await Promise.all([
    prisma.job.create({
      data: {
        id: 'job_001',
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
        id: 'job_002',
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
        id: 'job_003',
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
