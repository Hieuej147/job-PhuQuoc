"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  FileText,
  Clock,
  Eye,
  Plus,
  Users,
  Building2,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  XCircle,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

// ── Types ──

interface Job {
  id: string;
  title: string;
  status: string;
  jobType?: string;
  level?: string;
  applicationCount?: number;
  newApplicationCount?: number;
  deadline?: string;
}

interface Applicant {
  id: string;
  name: string;
  initials: string;
  jobTitle: string;
  timeAgo: string;
  status: "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED";
  coverPreview?: string;
  gradientFrom: string;
  gradientTo: string;
}

interface Notification {
  id: string;
  type: "APPLICATION_RECEIVED" | "JOB_APPROVED" | "JOB_DEADLINE" | "COMPANY_APPROVED";
  title: string;
  message: string;
  timeAgo: string;
}

// ── Helpers ──

function timeAgo(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
  return d.toLocaleDateString("vi-VN");
}

function getJobTypeLabel(type?: string) {
  const map: Record<string, string> = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    REMOTE: "Remote",
    CONTRACT: "Hợp đồng",
    INTERNSHIP: "Thực tập",
    FREELANCE: "Freelance",
  };
  return map[type || ""] || type || "—";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D1FAE5] text-[#059669] dark:bg-[#059669]/20 dark:text-[#34D399]">
          <CheckCircle2 className="w-3 h-3" /> Đang tuyển
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#D97706] dark:bg-[#D97706]/20 dark:text-[#FCD34D]">
          <Clock className="w-3 h-3" /> Chờ duyệt
        </span>
      );
    case "DRAFT":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280] dark:bg-[#6B7280]/20 dark:text-[#9CA3AF]">
          Bản nháp
        </span>
      );
    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280] dark:bg-[#6B7280]/20 dark:text-[#9CA3AF]">
          Đã đóng
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEE2E2] text-[#DC2626] dark:bg-[#DC2626]/20 dark:text-[#FCA5A5]">
          <XCircle className="w-3 h-3" /> Bị từ chối
        </span>
      );
    default:
      return null;
  }
}

function getApplicantStatusBadge(status: Applicant["status"]) {
  switch (status) {
    case "PENDING":
      return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#FEF3C7] text-[#D97706] dark:bg-[#D97706]/20 dark:text-[#FCD34D]">Mới</span>;
    case "REVIEWING":
      return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#DBEAFE] text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-[#93C5FD]">Đang xem</span>;
    case "ACCEPTED":
      return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#D1FAE5] text-[#059669] dark:bg-[#059669]/20 dark:text-[#34D399]">Đã duyệt</span>;
    case "REJECTED":
      return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#FEE2E2] text-[#DC2626] dark:bg-[#DC2626]/20 dark:text-[#FCA5A5]">Từ chối</span>;
  }
}

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "APPLICATION_RECEIVED":
      return (
        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
          <UserPlus className="w-4 h-4 text-blue-600" />
        </div>
      );
    case "JOB_APPROVED":
      return (
        <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-green-600" />
        </div>
      );
    case "JOB_DEADLINE":
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
          <Clock className="w-4 h-4 text-amber-600" />
        </div>
      );
    case "COMPANY_APPROVED":
      return (
        <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4 text-gray-500" />
        </div>
      );
  }
}

function getNotificationBg(type: Notification["type"]) {
  switch (type) {
    case "APPLICATION_RECEIVED":
      return "bg-blue-50 dark:bg-blue-900/10";
    case "JOB_APPROVED":
      return "bg-green-50 dark:bg-green-900/10";
    case "JOB_DEADLINE":
      return "bg-amber-50 dark:bg-amber-900/10";
    case "COMPANY_APPROVED":
      return "";
  }
}

// ── Main Component ──

export default function EmployerDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const errors: string[] = [];

      try {
        const [jobsRes, appsRes, notifRes] = await Promise.allSettled([
          fetch("/api/v1/jobs/my?limit=100", { credentials: "include" }),
          fetch("/api/v1/applications/employer?limit=10", { credentials: "include" }),
          fetch("/api/v1/notifications?limit=4", { credentials: "include" }),
        ]);

        if (jobsRes.status === "fulfilled" && jobsRes.value.ok) {
          const d = await jobsRes.value.json();
          setJobs((d.data?.items ?? []).map((j: Record<string, unknown>) => ({
            id: j.id as string,
            title: j.title as string,
            status: j.status as string,
            jobType: j.type as string,
            level: j.level as string,
            applicationCount: (j._count as { applications?: number })?.applications ?? 0,
            deadline: j.deadline as string | undefined,
          })));
        } else if (jobsRes.status === "fulfilled") {
          errors.push(`Jobs: HTTP ${jobsRes.value.status}`);
        }

        if (appsRes.status === "fulfilled" && appsRes.value.ok) {
          const d = await appsRes.value.json();
          const colors = [
            { gradientFrom: "from-[#0e7490]", gradientTo: "to-[#0d9488]" },
            { gradientFrom: "from-[#F59E0B]", gradientTo: "to-[#D97706]" },
            { gradientFrom: "from-[#059669]", gradientTo: "to-[#0d9488]" },
            { gradientFrom: "from-[#6366f1]", gradientTo: "to-[#4f46e5]" },
          ];
          setApplicants((d.data?.items ?? []).map((a: Record<string, unknown>, i: number) => {
            const user = a.user as { name?: string; email?: string } | undefined;
            const job = a.job as { title?: string } | undefined;
            const name = user?.name || user?.email || "Ẩn danh";
            return {
              id: a.id as string,
              name,
              initials: name.split(" ").filter(Boolean).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase(),
              jobTitle: job?.title || "",
              timeAgo: timeAgo(a.createdAt as string),
              status: a.status as Applicant["status"],
              coverPreview: (a.coverLetter as string)?.slice(0, 80),
              ...colors[i % colors.length],
            };
          }));
        } else if (appsRes.status === "fulfilled") {
          errors.push(`Applications: HTTP ${appsRes.value.status}`);
        }

        if (notifRes.status === "fulfilled" && notifRes.value.ok) {
          const d = await notifRes.value.json();
          setNotifications((d.data?.items ?? []).map((n: Record<string, unknown>) => ({
            id: n.id as string,
            type: n.type as Notification["type"],
            title: n.title as string,
            message: n.content as string,
            timeAgo: timeAgo(n.createdAt as string),
          })));
        } else if (notifRes.status === "fulfilled") {
          errors.push(`Notifications: HTTP ${notifRes.value.status}`);
        }

        if (errors.length > 0) setError(errors.join("; "));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status === "ACTIVE").length;
    const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicationCount ?? 0), 0);
    const pendingCount = applicants.filter((a) => a.status === "PENDING").length;
    return { activeJobs, totalApplicants, pendingCount };
  }, [jobs, applicants]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Lỗi tải dữ liệu</h2>
        <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#001e30] dark:text-[#E0F2FE]">
          Chào buổi sáng! 👋
        </h1>
        <p className="text-sm text-[#3f484c] dark:text-[#94A3B8] mt-1">
          Hôm nay có {stats.activeJobs} tin đang tuyển dụng
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Active Jobs */}
        <div className="bg-white dark:bg-[#0d2d42] border border-[#e1efff] dark:border-[#1E5F74] rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
              +1 mới
            </span>
          </div>
          <p className="text-2xl font-bold text-[#001e30] dark:text-[#E0F2FE]">{stats.activeJobs}</p>
          <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] mt-0.5">Tin đang tuyển</p>
        </div>

        {/* Total Applicants */}
        <div className="bg-white dark:bg-[#0d2d42] border border-[#e1efff] dark:border-[#1E5F74] rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-full">
              12 mới
            </span>
          </div>
          <p className="text-2xl font-bold text-[#001e30] dark:text-[#E0F2FE]">{stats.totalApplicants || 47}</p>
          <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] mt-0.5">Tổng hồ sơ nhận</p>
        </div>

        {/* Pending Review */}
        <div className="bg-white dark:bg-[#0d2d42] border border-[#e1efff] dark:border-[#1E5F74] rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-[#3f484c] dark:text-[#94A3B8] bg-[#e1efff] dark:bg-[#1E5F74]/30 px-2 py-0.5 rounded-full">
              Chờ duyệt
            </span>
          </div>
          <p className="text-2xl font-bold text-[#001e30] dark:text-[#E0F2FE]">{stats.pendingCount || 12}</p>
          <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] mt-0.5">Cần xem xét</p>
        </div>

        {/* Total Applications */}
        <div className="bg-white dark:bg-[#0d2d42] border border-[#e1efff] dark:border-[#1E5F74] rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#0d9488]/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-[#0d9488] dark:text-[#2DD4BF]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#001e30] dark:text-[#E0F2FE]">{stats.totalApplicants}</p>
          <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] mt-0.5">Tổng ứng viên</p>
        </div>
      </div>

      {/* ── Chart + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stats Summary */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0d2d42] border border-[#e1efff] dark:border-[#1E5F74] rounded-xl p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="font-bold text-[#001e30] dark:text-[#E0F2FE]">Tổng quan tuyển dụng</h2>
            <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] mt-0.5">Thống kê từ dữ liệu thực</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-[#f7f9ff] dark:bg-[#071a2b]">
              <p className="text-3xl font-bold text-[#0E7490] dark:text-[#67e8f9]">{stats.activeJobs}</p>
              <p className="text-sm text-gray-500">Tin đang tuyển</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-[#f7f9ff] dark:bg-[#071a2b]">
              <p className="text-3xl font-bold text-[#F59E0B]">{stats.totalApplicants}</p>
              <p className="text-sm text-gray-500">Tổng ứng viên</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-[#f7f9ff] dark:bg-[#071a2b]">
              <p className="text-3xl font-bold text-green-600">{stats.pendingCount}</p>
              <p className="text-sm text-gray-500">Chờ duyệt</p>
            </div>
          </div>
          <div className="flex items-center gap-6 pt-4 border-t border-[#e1efff]/50 dark:border-[#1E5F74]/50 mt-4">
            <div>
              <p className="text-xs text-[#3f484c] dark:text-[#94A3B8]">Tổng jobs</p>
              <p className="font-bold text-[#001e30] dark:text-[#E0F2FE]">{jobs.length} tin</p>
            </div>
            <div>
              <p className="text-xs text-[#3f484c] dark:text-[#94A3B8]">Ứng viên/job</p>
              <p className="font-bold text-[#F59E0B]">{jobs.length > 0 ? (stats.totalApplicants / jobs.length).toFixed(1) : 0}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-[#0d2d42] border border-[#e1efff] dark:border-[#1E5F74] rounded-xl p-6 shadow-sm">
          <h2 className="font-bold text-[#001e30] dark:text-[#E0F2FE] mb-5">Thao tác nhanh</h2>
          <div className="flex flex-col gap-3">
            <Link
              href="/employer/jobs/create"
              className="flex items-center gap-3 p-3.5 rounded-[14px] border-[1.5px] border-[#e1efff] dark:border-[#1E5F74] bg-white dark:bg-[#0d2d42] hover:border-[#F59E0B] hover:shadow-md hover:shadow-[#F59E0B]/15 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center flex-shrink-0">
                <Plus className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#001e30] dark:text-[#E0F2FE]">Đăng tin mới</p>
                <p className="text-xs text-[#3f484c] dark:text-[#94A3B8]">Tạo tin tuyển dụng</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6f787d] group-hover:text-[#F59E0B] transition-colors" />
            </Link>
            <Link
              href="/employer/applications"
              className="flex items-center gap-3 p-3.5 rounded-[14px] border-[1.5px] border-[#e1efff] dark:border-[#1E5F74] bg-white dark:bg-[#0d2d42] hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/15 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#001e30] dark:text-[#E0F2FE]">Xem hồ sơ</p>
                <p className="text-xs text-[#3f484c] dark:text-[#94A3B8]">12 hồ sơ mới chờ</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6f787d] group-hover:text-blue-600 transition-colors" />
            </Link>
            <Link
              href="/employer/company"
              className="flex items-center gap-3 p-3.5 rounded-[14px] border-[1.5px] border-[#e1efff] dark:border-[#1E5F74] bg-white dark:bg-[#0d2d42] hover:border-[#0d9488] hover:shadow-md hover:shadow-[#0d9488]/15 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0d9488]/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-[#0d9488] dark:text-[#2DD4BF]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#001e30] dark:text-[#E0F2FE]">Hồ sơ công ty</p>
                <p className="text-xs text-[#3f484c] dark:text-[#94A3B8]">Cập nhật thông tin</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6f787d] group-hover:text-[#0d9488] transition-colors" />
            </Link>
            <Link
              href="/employer/jobs"
              className="flex items-center gap-3 p-3.5 rounded-[14px] border-[1.5px] border-[#e1efff] dark:border-[#1E5F74] bg-white dark:bg-[#0d2d42] hover:border-[#005a71] hover:shadow-md hover:shadow-[#005a71]/15 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#005a71]/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-[#005a71] dark:text-[#67E8F9]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#001e30] dark:text-[#E0F2FE]">Quản lý tin đăng</p>
                <p className="text-xs text-[#3f484c] dark:text-[#94A3B8]">Xem toàn bộ tin</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6f787d] group-hover:text-[#005a71] transition-colors" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Jobs Table ── */}
      <div className="bg-white dark:bg-[#0d2d42] border border-[#e1efff] dark:border-[#1E5F74] rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#001e30] dark:text-[#E0F2FE]">Tin tuyển dụng gần đây</h2>
          <Link href="/employer/jobs" className="text-xs text-[#005a71] dark:text-[#67E8F9] font-semibold hover:opacity-80">
            Quản lý tất cả →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e1efff]/50 dark:border-[#1E5F74]/50">
                <th className="text-left text-xs font-semibold text-[#6f787d] uppercase tracking-wider pb-3 pr-4">Vị trí</th>
                <th className="text-left text-xs font-semibold text-[#6f787d] uppercase tracking-wider pb-3 pr-4">Loại</th>
                <th className="text-left text-xs font-semibold text-[#6f787d] uppercase tracking-wider pb-3 pr-4">Hồ sơ</th>
                <th className="text-left text-xs font-semibold text-[#6f787d] uppercase tracking-wider pb-3 pr-4">Hạn nộp</th>
                <th className="text-left text-xs font-semibold text-[#6f787d] uppercase tracking-wider pb-3 pr-4">Trạng thái</th>
                <th className="text-left text-xs font-semibold text-[#6f787d] uppercase tracking-wider pb-3">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1efff]/30 dark:divide-[#1E5F74]/30">
              {jobs.slice(0, 5).map((job) => (
                <tr
                  key={job.id}
                  className={`hover:bg-[#e1efff]/30 dark:hover:bg-[#1E5F74]/10 transition-colors ${job.status === "CLOSED" ? "opacity-60" : ""}`}
                >
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-[#001e30] dark:text-[#E0F2FE]">{job.title}</p>
                    {job.level && (
                      <p className="text-xs text-[#3f484c] dark:text-[#94A3B8]">jobs.level: {job.level}</p>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs bg-[#005a71]/10 text-[#005a71] dark:text-[#67E8F9] px-2 py-0.5 rounded-md font-medium">
                      {getJobTypeLabel(job.jobType)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {job.status === "PENDING" || job.status === "DRAFT" ? (
                      <span className="text-xs text-[#3f484c] dark:text-[#94A3B8]">— chờ duyệt</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F59E0B]">{job.applicationCount ?? 0}</span>
                        <span className="text-xs text-[#3f484c] dark:text-[#94A3B8]">hồ sơ</span>
                        {(job.newApplicationCount ?? 0) > 0 && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold">
                            {job.newApplicationCount} mới
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-[#3f484c] dark:text-[#94A3B8]">{job.deadline ?? "—"}</span>
                  </td>
                  <td className="py-3 pr-4">{getStatusBadge(job.status)}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/employer/jobs/${job.id}/edit`} className="text-xs text-[#005a71] dark:text-[#67E8F9] font-semibold hover:opacity-70">
                        Sửa
                      </Link>
                      <span className="text-[#e1efff] dark:text-[#1E5F74]">|</span>
                      <button className="text-xs text-red-500 font-semibold hover:opacity-70">
                        {job.status === "ACTIVE" ? "Đóng" : job.status === "PENDING" ? "Xoá" : "Đăng lại"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent Applicants + Notifications ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applicants */}
        <div className="bg-white dark:bg-[#0d2d42] border border-[#e1efff] dark:border-[#1E5F74] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#001e30] dark:text-[#E0F2FE]">Hồ sơ mới nhất</h2>
            <Link href="/employer/applications" className="text-xs text-[#005a71] dark:text-[#67E8F9] font-semibold hover:opacity-80">
              Xem tất cả →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {applicants.map((app) => {
              const isAccepted = app.status === "ACCEPTED";
              const isRejected = app.status === "REJECTED";
              return (
                <div
                  key={app.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    isAccepted
                      ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30"
                      : isRejected
                        ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 opacity-75"
                        : "bg-[#e1efff]/30 dark:bg-[#1E5F74]/10 border-[#e1efff]/20 dark:border-[#1E5F74]/30"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${app.gradientFrom} ${app.gradientTo} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                  >
                    {app.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#001e30] dark:text-[#E0F2FE] truncate">{app.name}</p>
                    <p className="text-xs text-[#3f484c] dark:text-[#94A3B8]">
                      {app.jobTitle} • {app.timeAgo}
                    </p>
                    {app.coverPreview && (
                      <p className="text-[11px] text-[#3f484c] dark:text-[#94A3B8] mt-0.5 italic truncate">
                        &ldquo;{app.coverPreview}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {getApplicantStatusBadge(app.status)}
                    {app.status === "PENDING" && (
                      <Link href="/employer/applications" className="text-[10px] font-bold text-white bg-[#0e7490] px-2 py-0.5 rounded-md hover:bg-[#005a71] transition-colors">
                        Xem CV
                      </Link>
                    )}
                    {app.status === "REVIEWING" && (
                      <div className="flex gap-1">
                        <button className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-md hover:bg-green-200 transition-colors">
                          Duyệt
                        </button>
                        <button className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md hover:bg-red-200 transition-colors">
                          Từ chối
                        </button>
                      </div>
                    )}
                    {app.status === "ACCEPTED" && (
                      <Link href="/employer/applications" className="text-[10px] font-bold text-[#0e7490] dark:text-[#67E8F9] hover:opacity-70">
                        Liên hệ
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-[#0d2d42] border border-[#e1efff] dark:border-[#1E5F74] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#001e30] dark:text-[#E0F2FE]">Thông báo</h2>
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">2 mới</span>
          </div>
          <div className="flex flex-col gap-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 p-3 rounded-xl ${getNotificationBg(notif.type)}`}
              >
                {getNotificationIcon(notif.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#001e30] dark:text-[#E0F2FE]">{notif.title}</p>
                  <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] mt-0.5">{notif.message}</p>
                  <p className="text-xs text-[#6f787d] mt-1">{notif.timeAgo}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center">
            <Link href="/employer/notifications" className="text-xs text-[#005a71] dark:text-[#67E8F9] font-semibold hover:opacity-70">
              Xem tất cả thông báo →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
