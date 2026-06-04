// ============================================
// Job Recruitment Platform - Mock Data Cleaned by DBML Schema
// File: src/mocks/mockData.ts
// ============================================

// 1. BẢNG TỈNH THÀNH (provinces)
export const mockProvinces = [
    { id: "prov-kiengiang", name: "Kiên Giang", slug: "kien-giang", createdAt: "2026-01-01T00:00:00Z" }
];

// 2. BẢNG QUẬN HUYỆN (districts)
export const mockDistricts = [
    { id: "dist-phuquoc", name: "Thành phố Phú Quốc", slug: "thanh-pho-phu-quoc", provinceId: "prov-kiengiang", createdAt: "2026-01-01T00:00:00Z" }
];

// 3. BẢNG PHƯỜNG XÃ (wards)
export const mockWards = [
    { id: "ward-duongdong", name: "Dương Đông", slug: "duong-dong", districtId: "dist-phuquoc", createdAt: "2026-01-01T00:00:00Z" },
    { id: "ward-anthoi", name: "An Thới", slug: "an-thoi", districtId: "dist-phuquoc", createdAt: "2026-01-01T00:00:00Z" },
    { id: "ward-ganhdau", name: "Gành Dầu", slug: "ganh-dau", districtId: "dist-phuquoc", createdAt: "2026-01-01T00:00:00Z" },
    { id: "ward-bacdao", name: "Bắc Đảo", slug: "bac-dao", districtId: "dist-phuquoc", createdAt: "2026-01-01T00:00:00Z" },
    { id: "ward-baitruong", name: "Bãi Trường", slug: "bai-truong", districtId: "dist-phuquoc", createdAt: "2026-01-01T00:00:00Z" },
    { id: "ward-duongto", name: "Dương Tơ", slug: "duong-to", districtId: "dist-phuquoc", createdAt: "2026-01-01T00:00:00Z" },
    { id: "ward-hamninh", name: "Hàm Ninh", slug: "ham-ninh", districtId: "dist-phuquoc", createdAt: "2026-01-01T00:00:00Z" },
    { id: "ward-cuacan", name: "Cửa Cạn", slug: "cua-can", districtId: "dist-phuquoc", createdAt: "2026-01-01T00:00:00Z" }
];

// 4. BẢNG NGƯỜI DÙNG (users)
export const mockUsers = [
    { id: "user-001", name: "Vinpearl HR Team", email: "hr@vinpearl.com", password: "hashed_password", role: "EMPLOYER", avatar: null, phone: "0901234567", isActive: true, isLocked: false, createdAt: "2026-01-10T00:00:00Z" },
    { id: "user-002", name: "Sunset Sanato HR", email: "hr@sunsetsanato.com", password: "hashed_password", role: "EMPLOYER", avatar: null, phone: "0907654321", isActive: true, isLocked: false, createdAt: "2026-02-12T00:00:00Z" },
    { id: "user-003", name: "Nguyễn Biên Tập", email: "editor@pqjobs.com", password: "hashed_password", role: "ADMIN", avatar: null, phone: "0988888888", isActive: true, isLocked: false, createdAt: "2026-01-01T00:00:00Z" }
];

// 5. BẢNG CÔNG TY (companies)
export const mockCompanies = [
    {
        id: "comp-vinpearl",
        name: "Vinpearl Resort & Spa Phú Quốc",
        slug: "vinpearl-resort-spa-phu-quoc",
        logo: "https://img.magnific.com/vector-mien-phi/vector-thiet-ke-gradient-chim-day-mau-sac_343694-2506.jpg?semt=ais_hybrid&w=740&q=80",
        website: "https://vinpearl.com",
        description: "Hệ thống nghỉ dưỡng 5 sao đẳng cấp quốc tế tại Gành Dầu.",
        wardId: "ward-ganhdau",
        addressDetail: "Bãi Dài, Xã Gành Dầu",
        size: "500+",
        industry: "Khách sạn / Du lịch",
        ownerId: "user-001",
        isApproved: true,
        isActive: true,
        createdAt: "2026-01-01T00:00:00Z",
    },
    {
        id: "comp-sunset",
        name: "Sunset Sanato Beach Club Phú Quốc",
        slug: "sunset-sanato-beach-club-phu-quoc",
        logo: "https://img.magnific.com/vector-mien-phi/vector-thiet-ke-gradient-chim-day-mau-sac_343694-2506.jpg?semt=ais_hybrid&w=740&q=80",
        website: "https://sunsetsanato.com",
        description: "Khu nghỉ dưỡng gân ấn tượng với bãi biển ngắm hoàng hôn đẹp nhất Phú Quốc.",
        wardId: "ward-duongto",
        addressDetail: "Khu Bãi Trường, Xã Dương Tơ",
        size: "201-500",
        industry: "Nhà hàng / Dịch vụ giải trí",
        ownerId: "user-002",
        isApproved: true,
        isActive: true,
        createdAt: "2026-02-13T00:00:00Z",
    }
];

// 6. BẢNG DANH MỤC VIỆC LÀM (categories)
export const mockCategories = [
    { id: "cat-hotel", name: "Khách sạn & Resort", slug: "khach-san-resort", icon: "hotel", createdAt: "2026-01-01T00:00:00Z" },
    { id: "cat-fb", name: "Nhà hàng & F&B", slug: "nha-hang-fb", icon: "restaurant", createdAt: "2026-01-01T00:00:00Z" },
    { id: "cat-tourism", name: "Du lịch & Lữ hành", slug: "du-lich-lu-hanh", icon: "sailing", createdAt: "2026-01-01T00:00:00Z" },
    { id: "cat-sales", name: "Sales & Marketing", slug: "sales-marketing", icon: "leaderboard", createdAt: "2026-01-01T00:00:00Z" }
];

// 7. BẢNG VIỆC LÀM (jobs)
export const mockJobs = [
    {
        id: "job-001",
        title: "Quản Lý Tiền Sảnh (Front Office Manager)",
        slug: "quan-ly-tien-sanh-front-office-manager",
        description: "Chịu trách nhiệm điều hành toàn bộ hoạt động của bộ phận Tiền sảnh...",
        benefits: "Lương thưởng tháng 13, đóng bảo hiểm đầy đủ, hỗ trợ chỗ ở nhà nhân viên.",
        requirements: "Tối thiểu 3 năm kinh nghiệm vị trí tương đương tại các resort 4-5 sao. Tiếng Anh lưu loát.",
        quantity: 1,
        salaryMin: 15000000,
        salaryMax: 25000000,
        wardId: "ward-ganhdau",
        addressDetail: "Khu Bãi Dài",
        type: "FULL_TIME",
        experience: "THREE_TO_FIVE_YEARS",
        level: "MANAGER",
        status: "ACTIVE",
        deadline: "2026-07-30T23:59:59Z",
        categoryId: "cat-hotel",
        companyId: "comp-vinpearl",
        createdAt: "2026-05-15T08:00:00Z",

    },
    {
        id: "job-002",
        title: "Bếp Trưởng (Head Chef) Nhà Hàng Hải Sản",
        slug: "bep-truong-head-chef-nha-hang-hai-san",
        description: "Quản lý bếp, lên thực đơn, kiểm soát chất lượng món ăn và chi phí nguyên liệu...",
        benefits: "Thưởng doanh số, tips cao, cung cấp bữa ăn giữa ca.",
        requirements: "Có gu thẩm mỹ ẩm thực tốt, kinh nghiệm xử lý hải sản tươi sống cao cấp.",
        quantity: 1,
        salaryMin: null, // Thỏa thuận
        salaryMax: null, // Thỏa thuận
        wardId: "ward-duongto",
        addressDetail: "Bãi Trường",
        type: "FULL_TIME",
        experience: "OVER_FIVE_YEARS",
        level: "LEAD",
        status: "ACTIVE",
        deadline: "2026-08-15T23:59:59Z",
        categoryId: "cat-fb",
        companyId: "comp-sunset",
        createdAt: "2026-05-20T09:30:00Z",

    }
];

// 8. BẢNG DANH MỤC BÀI VIẾT (blog_categories)
export const mockBlogCategories = [
    { id: "bcat-001", name: "Bí quyết tìm việc", slug: "bi-quyet-tim-viec", createdAt: "2026-01-01T00:00:00Z" },
    { id: "bcat-002", name: "Xu hướng thị trường", slug: "xu-huong-thi-truong", createdAt: "2026-01-01T00:00:00Z" }
];

// 9. BẢNG BÀI VIẾT (blogs)
export const mockBlogs = [
    {
        id: "blog-001",
        title: "5 Kỹ năng bắt buộc để làm việc tại Resort 5 sao Phú Quốc",
        slug: "5-ky-nang-bat-buoc-lam-viec-resort-5-sao-phu-quoc",
        type: "NORMAL" as const,
        content: `
          <p>Phú Quốc đang trở thành một trong những điểm đến resort hot nhất Đông Nam Á, với hàng loạt
              resort 5 sao liên tục mở cửa. Điều này tạo ra nhu cầu tuyển dụng nhân sự khách sạn khổng lồ
              — nhưng cũng đặt ra yêu cầu ngày càng cao hơn với ứng viên.</p>
          <p>Chúng tôi đã khảo sát HR của hơn 20 resort hàng đầu Phú Quốc, từ Vinpearl, InterContinental
              đến Premier Village. Dưới đây là <strong>5 kỹ năng không thể thiếu</strong> mà bất kỳ ai
              muốn làm việc tại môi trường resort 5 sao đều phải có.</p>

          <div class="highlight-box">
              <p>"Chúng tôi không tìm người biết làm — chúng tôi tìm người biết phục vụ với trái tim." —
                  HR Director, Vinpearl Resort Phú Quốc</p>
          </div>

          <h2 id="skill-1">1. Tiếng Anh giao tiếp chuyên nghiệp</h2>
          <p>Đây là yêu cầu số một, không thể thương lượng. Khách hàng tại resort 5 sao Phú Quốc đến từ
              hơn 50 quốc gia — từ châu Âu, Bắc Mỹ đến Trung Đông và Đông Á.</p>
          <h3>Mức độ cần thiết theo bộ phận:</h3>
          <ul>
              <li><strong>Tiền sảnh & Concierge:</strong> Tiếng Anh lưu loát (IELTS 6.5+), ưu tiên biết
                  thêm tiếng Nga hoặc tiếng Trung</li>
              <li><strong>F&B:</strong> Tiếng Anh giao tiếp tốt (IELTS 5.5+) là đủ</li>
              <li><strong>Buồng phòng:</strong> Tiếng Anh cơ bản, chủ yếu giao tiếp qua hành động</li>
              <li><strong>Marketing & Sales:</strong> Tiếng Anh viết tốt, đặc biệt kỹ năng email và thuyết
                  trình</li>
          </ul>

          <h2 id="skill-2">2. Tư duy dịch vụ — "Service Mindset"</h2>
          <p>Đây là yếu tố khó dạy nhất nhưng lại được đánh giá cao nhất. Service mindset không phải là
              cúi đầu hay nói "dạ vâng" mọi lúc — đó là khả năng <strong>đọc vị nhu cầu của khách trước
                  khi họ nói ra</strong>.</p>
          <ul>
              <li>Chủ động chào hỏi và nhận diện khách VIP</li>
              <li>Ghi nhớ tên khách, sở thích cá nhân, dị ứng thực phẩm</li>
              <li>Xử lý phàn nàn với thái độ bình tĩnh và giải pháp tức thì</li>
              <li>Luôn đặt trải nghiệm khách hàng lên trên quy trình</li>
          </ul>

          <div class="highlight-box">
              <p>Tại Premier Village, nhân viên được đào tạo theo triết lý: "Say YES before you say NO".
                  Mọi yêu cầu của khách đều được lắng nghe nghiêm túc, tìm phương án thay thế nếu không
                  thể đáp ứng trực tiếp.</p>
          </div>

          <h2 id="skill-3">3. Kỹ năng làm việc nhóm liên bộ phận</h2>
          <p>Resort 5 sao là một cỗ máy phức tạp với hàng chục bộ phận phối hợp với nhau. Một khách
              check-in muộn vào lúc 2 giờ sáng cần sự phối hợp của: lễ tân, buồng phòng, bếp (nếu muốn ăn
              khuya), kỹ thuật (nếu có vấn đề phòng).</p>
          <ul>
              <li>Sử dụng thành thạo hệ thống quản lý khách sạn (PMS: Opera, VinHMS...)</li>
              <li>Kỹ năng giao tiếp nội bộ rõ ràng, ngắn gọn</li>
              <li>Tôn trọng quy trình bàn giao ca (handover)</li>
              <li>Không "đá bóng" trách nhiệm giữa các bộ phận trước mặt khách</li>
          </ul>

          <h2 id="skill-4">4. Khả năng chịu áp lực và làm ca linh hoạt</h2>
          <p>Resort không có ngày nghỉ — thực ra, <strong>lễ tết và dịp nghỉ hè chính là thời điểm cao
                  điểm nhất</strong>. Ứng viên cần chuẩn bị tâm lý làm việc ca đêm, ca xoay, và xử lý
              nhiều tình huống cùng lúc trong giờ rush.</p>
          <ul>
              <li>Kỹ năng quản lý thời gian và ưu tiên công việc</li>
              <li>Giữ phong thái chuyên nghiệp kể cả khi mệt mỏi</li>
              <li>Thích nghi nhanh với thay đổi (hủy sự kiện, thay đổi menu, sự cố kỹ thuật)</li>
              <li>Không để cảm xúc cá nhân ảnh hưởng đến chất lượng dịch vụ</li>
          </ul>

          <h2 id="skill-5">5. Hình thức và tác phong chuyên nghiệp</h2>
          <p>Bạn là gương mặt của resort. Từ cách ăn mặc theo đồng phục, đến cách đứng, đi lại và cười —
              tất cả đều được chuẩn hóa và kiểm tra thường xuyên.</p>
          <ul>
              <li>Tuân thủ nghiêm ngặt quy định về đồng phục và vệ sinh cá nhân</li>
              <li>Ngôn ngữ cơ thể mở, thân thiện nhưng vẫn chuyên nghiệp</li>
              <li>Giọng nói rõ ràng, tốc độ vừa phải, không dùng slang</li>
              <li>Biểu cảm khuôn mặt tự nhiên, không gượng gạo</li>
          </ul>

          <h2 id="conclusion">Tổng kết</h2>
          <p>Resort 5 sao tại Phú Quốc không chỉ tuyển người có kỹ năng — họ tuyển người có <strong>thái
                  độ đúng đắn</strong>. Kỹ năng có thể được đào tạo, nhưng đam mê phục vụ và sự tận tâm
              thì phải đến từ bên trong.</p>
          <p>Nếu bạn có những phẩm chất trên và đang tìm kiếm cơ hội tại đảo ngọc, hãy khám phá ngay các
              vị trí đang tuyển dụng trên PQJobs!</p>
        `,
        landing_content: null,
        thumbnail: "https://images.unsplash.com/photo-1540206395-68808572332f?q=80&w=1200",
        excerpt: "Từ kỹ năng ngoại ngữ đến tác phong chuyên nghiệp - những điều nhà tuyển dụng luôn tìm kiếm tại các resort hàng đầu Phú Quốc.",
        categoryId: "bcat-001",
        authorId: "user-003",
        views: 1250,
        isPublished: true,
        createdAt: "2026-05-10T14:20:00Z",
        updatedAt: "2026-05-11T09:00:00Z",
    },
    {
        id: "blog-002",
        title: "Tuần Lễ Việc Làm Du Lịch Phú Quốc 2026",
        slug: "tuan-le-viec-lam-du-lich-phu-quoc-2026",
        type: "LANDING_PAGE" as const,
        content: null,
        landing_content: {
            html: `
              <section class="hero">
                <h1>Tuần Lễ Việc Làm Du Lịch Phú Quốc 2026</h1>
                <p>50+ nhà tuyển dụng · 500+ vị trí · 3 ngày sự kiện</p>
                <a href="#jobs" class="cta-btn">Xem danh sách việc làm</a>
              </section>
              <section class="jobs-list" id="jobs">
                <h2>Vị trí đang tuyển dụng</h2>
                <div class="job-grid">
                  <div class="job-card"><strong>Quản lý F&B</strong><span>Vinpearl Resort</span></div>
                  <div class="job-card"><strong>Lễ tân khách sạn</strong><span>InterContinental Phú Quốc</span></div>
                  <div class="job-card"><strong>Hướng dẫn viên du lịch</strong><span>Saigon Tourist</span></div>
                  <div class="job-card"><strong>Bartender</strong><span>Sunset Sanato Beach Club</span></div>
                </div>
              </section>
            `,
            css: `
              * { box-sizing: border-box; }
              body { font-family: 'Segoe UI', sans-serif; color: #1e293b; }
              .hero {
                background: linear-gradient(135deg, #0f766e, #0891b2);
                color: white;
                padding: 64px 32px;
                text-align: center;
              }
              .hero h1 { font-size: 28px; font-weight: 800; margin-bottom: 12px; }
              .hero p { font-size: 15px; opacity: 0.85; margin-bottom: 28px; }
              .cta-btn {
                background: #f59e0b;
                color: white;
                padding: 12px 32px;
                border-radius: 9999px;
                text-decoration: none;
                font-weight: 700;
                font-size: 14px;
                display: inline-block;
              }
              .jobs-list { padding: 48px 32px; background: #f8fafc; }
              .jobs-list h2 { font-size: 20px; font-weight: 700; color: #025a70; margin-bottom: 24px; }
              .job-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
              .job-card {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 4px;
              }
              .job-card strong { font-size: 14px; color: #1e293b; }
              .job-card span { font-size: 12px; color: #64748b; }
            `,
            js: `
              document.querySelectorAll('.job-card').forEach(card => {
                card.style.cursor = 'pointer';
                card.addEventListener('mouseenter', () => {
                  card.style.borderColor = '#0891b2';
                  card.style.boxShadow = '0 4px 12px rgba(8,145,178,0.12)';
                });
                card.addEventListener('mouseleave', () => {
                  card.style.borderColor = '#e2e8f0';
                  card.style.boxShadow = 'none';
                });
              });
            `,
        },
        thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200",
        excerpt: "Sự kiện tuyển dụng lớn nhất Phú Quốc năm 2026 với 50+ nhà tuyển dụng và hàng trăm vị trí hấp dẫn.",
        categoryId: "bcat-002",
        authorId: "user-003",
        views: 340,
        isPublished: true,
        createdAt: "2026-05-25T08:00:00Z",
        updatedAt: "2026-05-25T08:00:00Z",
    }
];

// ============================================================================
// DATA SELECTORS / JOIN MAPPING CHO FRONTEND HIỂN THỊ TRỰC TIẾP
// ============================================================================

// ============================================================================
// DATA SELECTORS / JOIN MAPPING CHO FRONTEND HIỂN THỊ TRỰC TIẾP (CẬP NHẬT SLUG)
// ============================================================================

export const mockHomeJobs = mockJobs.map(job => {
    const company = mockCompanies.find(c => c.id === job.companyId);
    const ward = mockWards.find(w => w.id === job.wardId);
    const category = mockCategories.find(c => c.id === job.categoryId);

    const salaryText = job.salaryMin && job.salaryMax
        ? `${job.salaryMin / 1000000}-${job.salaryMax / 1000000}tr`
        : "Thỏa thuận";

    const typeMapping: Record<string, string> = {
        FULL_TIME: "Full-time",
        PART_TIME: "Part-time",
        REMOTE: "Từ xa",
        CONTRACT: "Hợp đồng",
        INTERNSHIP: "Thực tập",
        FREELANCE: "Tự do"
    };

    const expMapping: Record<string, string> = {
        NO_EXPERIENCE: "Không yêu cầu KN",
        UNDER_1_YEAR: "Dưới 1 năm KN",
        ONE_TO_THREE_YEARS: "1-3 năm KN",
        THREE_TO_FIVE_YEARS: "3-5 năm KN",
        OVER_FIVE_YEARS: "Trên 5 năm KN",
    };

    const isHot = job.experience === "OVER_FIVE_YEARS" || (job.salaryMin && job.salaryMin >= 15000000);
    const uiTagText = isHot ? "🔥 HOT" : "Mới";
    const uiTagStyle = isHot
        ? "bg-amber-50 text-amber-600 border border-amber-200"
        : "bg-blue-50 text-blue-600 border border-blue-100";

    return {
        id: job.id,
        title: job.title,
        slug: job.slug, // ✨ LẤY ĐƯỢC SLUG CỦA JOB ĐỂ LÀM LINK CHI TIẾT VIỆC LÀM
        companyLogo: company?.logo || "CO",
        companyName: company?.name || "Công ty ẩn danh",
        companySlug: company?.slug || "", // ✨ LẤY ĐƯỢC SLUG CÔNG TY ĐỂ XEM PROFILE CÔNG TY
        location: ward ? `${ward.name}` : "Phú Quốc",
        uiTagText,
        uiTagStyle,
        uiLogoBg: isHot ? "bg-amber-100 text-amber-700" : "bg-cyan-100 text-cyan-700",
        labels: [
            typeMapping[job.type] || job.type,
            salaryText,
            expMapping[job.experience] || "Chưa rõ KN"
        ],
        categoryName: category?.name || "Không xác định",
        categoryIcon: category?.icon || "folder",
        CreateAt: job.createdAt,
        // formattedDate: new Date(job.atCreate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        categorySlug: category?.slug || "", // ✨ LẤY SLUG DANH MỤC (Ví dụ: 'khach-san-resort')
    };
});

// ============================================================================
// DATA SELECTOR CHO BLOGS - ĐÃ SỬA ĐỂ TƯƠNG THÍCH 100% VỚI BLOG PAGE CLIENT
// ============================================================================
export const mockHomeBlogs = mockBlogs.map(blog => {
    const category = mockBlogCategories.find(bc => bc.id === blog.categoryId);
    const author = mockUsers.find(u => u.id === blog.authorId);

    // Sinh cấu hình UI Icon động dựa trên danh mục
    const uiIconName = blog.categoryId === "bcat-001" ? "school" : "trending_up";
    const uiCatBg = blog.categoryId === "bcat-001" ? "bg-[#0e7490]" : "bg-[#ea580c]";

    return {
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        thumbnail: blog.thumbnail,
        views: blog.views,
        categoryId: blog.categoryId,
        type: blog.type,

        date: new Date(blog.createdAt).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }),
        categoryName: category?.name || "Cẩm nang",
        categorySlug: category?.slug || "",
        authorName: author?.name || "Ban biên tập",
        uiIconName,
        uiCatBg
    };
});
// 10. BẢNG THÔNG BÁO (notifications)
export const mockNotifications = [
    {
        id: "noti-001",
        userId: "user-001", // ID của Employer Vinpearl
        type: "APPLICATION_RECEIVED",
        title: "Hồ sơ ứng tuyển mới",
        content: "Ứng viên Nguyễn Văn A vừa nộp hồ sơ vào vị trí Quản Lý Tiền Sảnh.",
        refId: "job-001", // ID của Job tương ứng
        isRead: false,
        createdAt: "2026-06-02T08:30:00Z",

    },
    {
        id: "noti-002",
        userId: "user-001",
        type: "JOB_APPROVED",
        title: "Tin tuyển dụng đã được duyệt",
        content: "Tin tuyển dụng 'Chuyên Viên Marketing Du Lịch' của bạn đã được Admin phê duyệt và hiển thị.",
        refId: "job-003",
        isRead: true,
        createdAt: "2026-06-01T15:00:00Z",

    },
    {
        id: "noti-003",
        userId: "user-001",
        type: "SYSTEM",
        title: "Bảo trì hệ thống định kỳ",
        content: "Hệ thống PQJobs sẽ bảo trì nâng cấp từ 01:00 đến 03:00 ngày 05/06/2026. Vui lòng lưu lại các phiên làm việc.",
        refId: null,
        isRead: false,
        createdAt: "2026-06-02T10:00:00Z",
    }
];

// ============================================================================
// SELECTOR CHO NOTIFICATIONS (FORMAT THEO KIỂU THỜI GIAN VÀ ICON UI)
// ============================================================================
export const mockHomeNotifications = mockNotifications.map(noti => {
    // Hàm helper sinh icon và màu sắc tương ứng với từng loại Notification Type trong CSDL
    const typeConfigs: Record<string, { icon: string; color: string }> = {
        APPLICATION_RECEIVED: { icon: "description", color: "text-blue-600 bg-blue-50" },
        APPLICATION_STATUS_CHANGED: { icon: "assignment_turned_in", color: "text-emerald-600 bg-emerald-50" },
        JOB_APPROVED: { icon: "verified", color: "text-teal-600 bg-teal-50" },
        COMPANY_APPROVED: { icon: "domain_verification", color: "text-purple-600 bg-purple-50" },
        NEW_MESSAGE: { icon: "chat", color: "text-amber-600 bg-amber-50" },
        JOB_DEADLINE: { icon: "alarm", color: "text-rose-600 bg-rose-50" },
        SYSTEM: { icon: "settings_suggest", color: "text-slate-600 bg-slate-50" }
    };

    const config = typeConfigs[noti.type] || { icon: "notifications", color: "text-slate-600 bg-slate-50" };

    // Định dạng hiển thị thời gian rút gọn (Ví dụ: 02/06/2026)
    const formattedTime = new Date(noti.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return {
        id: noti.id,
        title: noti.title,
        content: noti.content,
        isRead: noti.isRead,
        date: formattedTime,
        uiIcon: config.icon,
        uiColorClass: config.color,
        linkHref: noti.refId ? `/jobs/${noti.refId}` : "#" // Chuyển hướng khi click vào thông báo
    };
});

