/**
 * @file jobDetails.ts
 * @description Dữ liệu giả lập (mock data) chi tiết công việc cho hệ thống PQJobs.
 * Cung cấp dữ liệu mở rộng cho trang chi tiết công việc và logic tìm kiếm các công việc tương tự.
 */

import { JobDetailType, RelatedJobType } from '@/types/job';
import { mockJobs } from './jobs';

/**
 * Tạo danh sách chi tiết các công việc mẫu bằng cách ánh xạ từ danh sách `mockJobs` và bổ sung thêm các trường chi tiết.
 * Các trường mở rộng bao gồm:
 * - deadline: Hạn chót ứng tuyển (ISO String)
 * - views: Lượt xem ngẫu nhiên
 * - applicants: Số hồ sơ ứng tuyển ngẫu nhiên
 * - startDate: Ngày bắt đầu nhận hồ sơ (lấy ngày đăng tuyển)
 * - totalSlots: Số lượng tuyển dụng
 * - companySize: Quy mô nhân viên công ty
 * - companyWebsite: Địa chỉ trang web công ty
 * - companyIndustry: Lĩnh vực kinh doanh của công ty
 * - companyAddress: Địa chỉ cụ thể văn phòng công ty
 * - description: Mô tả chi tiết các đầu việc bằng định dạng HTML
 * - required: Mảng danh sách các yêu cầu bắt buộc đối với ứng viên
 * - preferred: Mảng danh sách các yêu cầu ưu tiên (không bắt buộc)
 * - benefits: Mảng danh sách các chế độ phúc lợi kèm biểu tượng và màu nền
 */
export const mockJobDetails: JobDetailType[] = mockJobs.map((job) => {
  // Cấu hình mô tả chi tiết và yêu cầu riêng biệt cho một vài công việc nổi bật để tăng tính chân thực
  let descriptionHtml = `
    <p>Chúng tôi đang tìm kiếm nhân sự có năng lực và đam mê công việc để gia nhập đội ngũ chuyên nghiệp tại Phú Quốc.</p>
    <h4>Trách nhiệm công việc chính:</h4>
    <ul>
      <li>Chịu trách nhiệm điều hành và quản lý trực tiếp các hoạt động chuyên môn theo ca làm việc.</li>
      <li>Đảm bảo chất lượng dịch vụ phục vụ khách hàng đạt chuẩn cao nhất.</li>
      <li>Đào tạo, hướng dẫn nghiệp vụ và phân công ca trực cho nhân viên cấp dưới.</li>
      <li>Báo cáo kết quả công việc định kỳ lên cấp quản lý trực tiếp.</li>
    </ul>
  `;

  let requiredList = [
    'Có tối thiểu kinh nghiệm tương đương tại các resort/khách sạn hoặc mô hình dịch vụ lớn.',
    'Khả năng giao tiếp tiếng Anh tốt và xử lý tình huống chuyên nghiệp.',
    'Kỹ năng quản lý thời gian, phân công công việc và làm việc đội nhóm hiệu quả.',
    'Sẵn sàng làm việc theo ca kíp và tăng ca vào mùa cao điểm du lịch của đảo Ngọc.'
  ];

  let preferredList = [
    'Tốt nghiệp các chuyên ngành Du lịch, Khách sạn, Ngoại ngữ hoặc ngành nghề liên quan.',
    'Biết thêm ngoại ngữ thứ hai (như tiếng Trung, tiếng Hàn, hoặc tiếng Nga).'
  ];

  // Custom dữ liệu chi tiết cho Quản Lý Tiền Sảnh (job-001)
  if (job.id === 'job-001') {
    descriptionHtml = `
      <p>Vinpearl Resort & Spa Phú Quốc đang tìm kiếm <strong>Front Office Manager</strong> có kinh nghiệm và đam mê với ngành khách sạn để dẫn dắt đội ngũ tiền sảnh tại resort 5 sao đẳng cấp quốc tế.</p>
      <h4>Trách nhiệm chính:</h4>
      <ul>
        <li>Quản lý toàn bộ hoạt động của bộ phận tiền sảnh (lễ tân, concierge, bellman, valet parking).</li>
        <li>Đảm bảo chất lượng dịch vụ đạt tiêu chuẩn 5 sao quốc tế của Vinpearl.</li>
        <li>Xây dựng kế hoạch, đào tạo nâng cao tay nghề và phát triển đội ngũ nhân viên tiền sảnh.</li>
        <li>Phối hợp chặt chẽ với các bộ phận buồng phòng, F&B, kỹ thuật để đảm bảo trải nghiệm khách hàng liền mạch.</li>
        <li>Xử lý nhanh chóng các khiếu nại và phản hồi của khách hàng một cách chuyên nghiệp.</li>
        <li>Quản lý tình trạng phòng, tối ưu công suất phòng (occupancy rate).</li>
        <li>Lập báo cáo hoạt động hàng ngày, hàng tuần cho Ban Giám đốc resort.</li>
        <li>Thực hiện các hoạt động bán chéo (cross-selling) các dịch vụ thuộc hệ sinh thái Vinpearl.</li>
      </ul>
    `;
    requiredList = [
      'Tốt nghiệp Đại học chuyên ngành Quản trị Khách sạn, Du lịch hoặc tương đương.',
      'Tối thiểu 3 năm kinh nghiệm ở vị trí tương đương tại khách sạn hoặc resort tiêu chuẩn 4-5 sao.',
      'Khả năng tiếng Anh giao tiếp lưu loát (ưu tiên có chứng chỉ IELTS 6.0 trở lên hoặc tương đương).',
      'Kỹ năng lãnh đạo và quản lý nhân sự xuất sắc.',
      'Thành thạo phần mềm quản lý khách sạn chuyên dụng (Opera, VinHMS hoặc tương đương).'
    ];
    preferredList = [
      'Biết thêm ngoại ngữ thứ hai (tiếng Trung, tiếng Nga hoặc tiếng Hàn) là lợi thế cực kỳ lớn.',
      'Có chứng chỉ nghiệp vụ khách sạn quốc tế (CHA, CHIA,...).',
      'Đã có kinh nghiệm làm việc thực tế tại khu vực Phú Quốc.'
    ];
  }

  // Custom dữ liệu chi tiết cho Bếp Trưởng (job-002)
  if (job.id === 'job-002') {
    descriptionHtml = `
      <p>Sunset Sanato Beach Club Phú Quốc đang cần tuyển <strong>Bếp Trưởng (Head Chef)</strong> chuyên trách nhà hàng hải sản cao cấp để phát triển thực đơn và quản lý bếp ăn.</p>
      <h4>Trách nhiệm chính:</h4>
      <ul>
        <li>Điều hành hoạt động chế biến món ăn, quản lý chất lượng và định lượng thực phẩm đầu vào.</li>
        <li>Xây dựng thực đơn các món ăn hải sản độc đáo mang phong cách ẩm thực Phú Quốc kết hợp hiện đại.</li>
        <li>Kiểm soát chi phí nguyên vật liệu (Food Cost), đảm bảo hiệu quả kinh doanh của bếp.</li>
        <li>Đào tạo tay nghề, quy trình vệ sinh an toàn thực phẩm (HACCP) cho nhân viên bếp.</li>
        <li>Giám sát và duy trì tiêu chuẩn vệ sinh, an toàn lao động trong toàn bộ khu vực bếp.</li>
      </ul>
    `;
    requiredList = [
      'Có tối thiểu 5 năm kinh nghiệm làm bếp, trong đó ít nhất 2 năm ở vị trí Bếp trưởng hoặc Bếp phó chính tại các nhà hàng/khu nghỉ dưỡng cao cấp.',
      'Kỹ năng xử lý, bảo quản các loại hải sản tươi sống chất lượng cao.',
      'Có gu thẩm mỹ ẩm thực tốt và kỹ năng trang trí món ăn bắt mắt.'
    ];
    preferredList = [
      'Có bằng cấp/chứng chỉ nghề nấu ăn chính quy trong và ngoài nước.',
      'Có mối quan hệ tốt với các nguồn cung cấp hải sản đặc sản tại Phú Quốc.'
    ];
  }

  return {
    ...job,
    deadline: job.id === 'job-001' ? '2026-06-30T23:59:59Z' : '2026-07-15T23:59:59Z',
    views: job.id === 'job-001' ? 1240 : Math.floor(Math.random() * 500) + 100,
    applicants: job.id === 'job-001' ? 28 : Math.floor(Math.random() * 20) + 2,
    startDate: job.postedDate,
    totalSlots: job.id === 'job-001' ? 2 : job.id === 'job-002' ? 1 : 3,
    companySize: job.id === 'job-001' ? '500+ nhân viên' : '100 - 200 nhân viên',
    companyWebsite: job.id === 'job-001' ? 'vinpearl.com' : 'sunsetsanato.com',
    companyIndustry: job.industry,
    companyAddress: job.id === 'job-001' ? 'Bãi Dài, Xã Gành Dầu, Phú Quốc, Kiên Giang' : 'Khu Bãi Trường, Xã Dương Tơ, Phú Quốc, Kiên Giang',
    description: descriptionHtml,
    required: requiredList,
    preferred: preferredList,
    benefits: [
      {
        icon: 'payments',
        iconColor: 'text-[#005a71]',
        bgColor: 'bg-[#005a71]/10',
        title: 'Lương cạnh tranh',
        description: job.salary + '/tháng + thưởng KPI'
      },
      {
        icon: 'home',
        iconColor: 'text-[#0d9488]',
        bgColor: 'bg-[#0d9488]/10',
        title: 'Hỗ trợ chỗ ở',
        description: 'Cung cấp ký túc xá cao cấp đầy đủ tiện nghi cho nhân viên ở xa'
      },
      {
        icon: 'restaurant',
        iconColor: 'text-[#D97706]',
        bgColor: 'bg-[#F59E0B]/10',
        title: 'Ăn uống miễn phí',
        description: 'Hỗ trợ 3 bữa ăn miễn phí mỗi ngày tại canteen của resort'
      },
      {
        icon: 'health_and_safety',
        iconColor: 'text-red-500',
        bgColor: 'bg-red-50',
        title: 'Bảo hiểm đầy đủ',
        description: 'Đóng bảo hiểm sức khỏe (BHYT, BHXH) và gói chăm sóc VIP'
      }
    ]
  };
});

/**
 * Hàm lấy danh sách công việc tương tự.
 * Lọc theo các tiêu chí:
 * - Cùng ngành nghề (industry) hoặc cùng khu vực (location).
 * - Loại trừ công việc đang xem chi tiết.
 * - Giới hạn tối đa 3 kết quả để hiển thị đẹp trên giao diện.
 *
 * @param id ID của công việc đang xem
 * @returns Mảng các công việc liên quan định dạng RelatedJobType
 */
export function getRelatedJobs(id: string): RelatedJobType[] {
  // Tìm kiếm thông tin công việc hiện tại để lấy ngành nghề và địa điểm làm mốc so sánh
  const currentJob = mockJobs.find((job) => job.id === id);
  if (!currentJob) return [];

  // Lọc các công việc khác có cùng ngành nghề hoặc cùng địa điểm
  const filtered = mockJobs.filter(
    (job) =>
      job.id !== id &&
      (job.industry === currentJob.industry || job.location === currentJob.location)
  );

  // Map lại cấu trúc dữ liệu tối giản để truyền vào component liên quan
  return filtered.slice(0, 3).map((job) => ({
    id: job.id,
    logoTextColor: job.textColor,
    companyInitials: job.companyInitials,
    title: job.title,
    company: job.company,
    contractType: job.contractType,
    salary: job.salary,
    location: job.location
  }));
}
