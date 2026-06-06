import { JobDetailType, RelatedJobType } from '@/types/job';
import { mockJobs } from './jobs';

export const mockJobDetails: JobDetailType[] = mockJobs.map(job => {
  return {
    ...job,
    deadline: '2026-08-30T23:59:59Z',
    views: Math.floor(Math.random() * 1000) + 100,
    applicants: Math.floor(Math.random() * 50) + 5,
    startDate: job.postedDate,
    totalSlots: job.id === 'job-001' || job.id === 'job-002' ? 1 : 3,
    companySize: '500+',
    companyWebsite: 'https://vinpearl.com',
    companyIndustry: job.industry,
    companyAddress: `${job.location}, Phú Quốc, Kiên Giang`,
    description: `
      <h3>Mô tả công việc</h3>
      <p>Chúng tôi đang tìm kiếm nhân sự có năng lực và đam mê công việc để gia nhập đội ngũ chuyên nghiệp tại Phú Quốc.</p>
      <ul>
        <li>Chịu trách nhiệm quản lý, điều hành công việc hàng ngày trong phạm vi công việc.</li>
        <li>Đảm bảo chất lượng dịch vụ phục vụ khách hàng đạt chuẩn 5 sao.</li>
        <li>Đào tạo, hướng dẫn và phân công công việc cho nhân viên cấp dưới.</li>
        <li>Báo cáo kết quả công việc định kỳ lên cấp quản lý trực tiếp.</li>
      </ul>
    `,
    required: [
      'Có tối thiểu kinh nghiệm tương đương tại các resort/khách sạn lớn.',
      'Khả năng tiếng Anh giao tiếp lưu loát và chuyên nghiệp.',
      'Kỹ năng quản lý, phân công và giám sát công việc tốt.',
      'Sẵn sàng làm việc theo ca kíp và mùa cao điểm du lịch.'
    ],
    preferred: [
      'Có chứng chỉ/bằng cấp chuyên ngành Du lịch - Nhà hàng - Khách sạn.',
      'Biết thêm ngoại ngữ thứ hai (tiếng Trung, tiếng Hàn, hoặc tiếng Nga).'
    ],
    benefits: [
      {
        icon: 'payments',
        iconColor: 'text-[#0d9488]',
        bgColor: 'bg-[#0d9488]/10',
        title: 'Mức lương hấp dẫn',
        description: job.salary
      },
      {
        icon: 'home',
        iconColor: 'text-[#0e7490]',
        bgColor: 'bg-[#0e7490]/10',
        title: 'Hỗ trợ chỗ ở',
        description: 'Cung cấp nhà ở nhân viên đầy đủ tiện nghi'
      },
      {
        icon: 'health_and_safety',
        iconColor: 'text-red-500',
        bgColor: 'bg-red-50',
        title: 'Chăm sóc sức khỏe',
        description: 'Đóng bảo hiểm đầy đủ theo quy định của pháp luật'
      }
    ]
  };
});

export function getRelatedJobs(id: string): RelatedJobType[] {
  const currentJob = mockJobs.find(job => job.id === id);
  if (!currentJob) return [];

  // Lấy các công việc cùng ngành nghề (industry) hoặc cùng địa điểm (location), loại trừ công việc hiện tại
  return mockJobs
    .filter(job => job.id !== id && (job.industry === currentJob.industry || job.location === currentJob.location))
    .slice(0, 3)
    .map(job => ({
      id: job.id,
      companyInitials: job.companyInitials,
      logoTextColor: job.textColor,
      title: job.title,
      company: job.company,
      contractType: job.contractType,
      salary: job.salary,
      location: job.location
    }));
}
