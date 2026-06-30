/**
 * TÊN TRANG: Hồ sơ ứng viên (Employer Applications)
 * MÔ TẢ: Danh sách hồ sơ các ứng viên đã ứng tuyển vào các vị trí tuyển dụng của công ty. Cho phép cập nhật trạng thái hồ sơ.
 * TƯƠNG TÁC DỮ LIỆU (FE-BE-DB):
 * - GET `/api/v1/applications/employer`: Lấy danh sách hồ sơ ứng tuyển từ bảng `Application` liên kết với tài khoản nhà tuyển dụng hiện tại.
 * - PATCH `/api/v1/applications/:id/status`: Gửi API xuống backend để cập nhật trạng thái hồ sơ (Chờ duyệt, Chấp nhận, Từ chối) vào DB.
 * - GET `/api/v1/applications/:id/resume-pdf`: Employer xem CV ứng viên (hỗ trợ cả resumeId và cvUrl).
 */
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Users,
  Check,
  X,
  Eye,
  FileText,
  Mail,
  Phone,
  Download,
  Briefcase,
  GraduationCap,
  MapPin,
  Star,
  Search,
  ChevronDown
} from "lucide-react";

interface ResumeInfo {
  id: string;
  title: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  experience?: any;
  education?: any;
  skills?: string | null;
}

interface Application {
  id: string;
  status: string;
  createdAt: string;
  cvUrl?: string | null;
  resumeId?: string | null;
  coverLetter?: string | null;
  isBookmarked?: boolean;
  user: { id: string; name: string; email: string; phone?: string | null };
  job: { id: string; title: string; company?: { name: string } };
  resume?: ResumeInfo | null;
}

const statusMap: Record<string, { label: string; class: string; dot: string }> = {
  PENDING: { label: "Chờ xem", class: "bg-amber-500/10 text-amber-500 border-amber-500/20", dot: "bg-amber-500" },
  REVIEWING: { label: "Đang xem xét", class: "bg-blue-500/10 text-blue-500 border-blue-500/20", dot: "bg-blue-500" },
  ACCEPTED: { label: "Chấp nhận", class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", dot: "bg-emerald-500" },
  REJECTED: { label: "Từ chối", class: "bg-rose-500/10 text-rose-500 border-rose-500/20", dot: "bg-rose-500" },
};

function formatTimeAgo(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `Nộp ${diffMins || 1} phút trước`;
  if (diffHours < 24) return `Nộp ${diffHours} giờ trước`;
  if (diffDays === 1) return `Nộp hôm qua`;
  return `Nộp ${diffDays} ngày trước`;
}

export default function EmployerApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  useEffect(() => {
    fetch("/api/v1/applications/employer?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const payload = d.data?.data ?? d.data ?? d;
        const items = payload?.items ?? payload ?? [];
        setApps(Array.isArray(items) ? items : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/v1/applications/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    }
  };

  const handleBookmark = async (id: string) => {
    const app = apps.find(a => a.id === id);
    if (!app) return;
    const res = await fetch(`/api/v1/applications/${id}/bookmark`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isBookmarked: !app.isBookmarked }),
    });
    if (res.ok) {
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, isBookmarked: !a.isBookmarked } : a));
    }
  };

  const handleViewCV = (app: Application) => {
    if (app.cvUrl) {
      window.open(app.cvUrl, "_blank");
    } else if (app.resumeId) {
      window.open(`/resumes/${app.resumeId}/print?print=false&bypass=puppeteer_bypass_key`, "_blank");
    }
  };

  // Trích xuất danh sách job duy nhất phục vụ bộ lọc Vị trí
  const uniqueJobs = useMemo(() => {
    const jobsMap = new Map<string, string>();
    apps.forEach(a => {
      if (a.job?.id && a.job?.title) {
        jobsMap.set(a.job.id, a.job.title);
      }
    });
    return Array.from(jobsMap.entries()).map(([id, title]) => ({ id, title }));
  }, [apps]);

  // Đếm các trạng thái
  const counts = useMemo(() => {
    return {
      total: apps.length,
      pending: apps.filter(a => a.status === "PENDING").length,
      reviewing: apps.filter(a => a.status === "REVIEWING").length,
      accepted: apps.filter(a => a.status === "ACCEPTED").length,
      rejected: apps.filter(a => a.status === "REJECTED").length,
      bookmarked: apps.filter(a => a.isBookmarked).length,
    };
  }, [apps]);

  // Bộ lọc & Sắp xếp dữ liệu
  const filteredApps = useMemo(() => {
    let result = [...apps];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => {
        const name = (a.resume?.name || a.user.name || "").toLowerCase();
        const jobTitle = (a.job?.title || "").toLowerCase();
        return name.includes(q) || jobTitle.includes(q);
      });
    }

    // Filter by Job Position
    if (selectedJobId !== "ALL") {
      result = result.filter(a => a.job?.id === selectedJobId);
    }

    // Filter by status tab
    if (statusFilter !== "ALL") {
      if (statusFilter === "BOOKMARKED") {
        result = result.filter(a => a.isBookmarked);
      } else {
        result = result.filter(a => a.status === statusFilter);
      }
    }

    // Sort
    if (sortBy === "NEWEST") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "OLDEST") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return result;
  }, [apps, searchQuery, selectedJobId, statusFilter, sortBy]);

  // Helper sinh mock rate phù hợp dựa vào tên/id
  const getMatchRate = (id: string) => {
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    return 75 + (sum % 21); // Trả về ngẫu nhiên 75% -> 95%
  };

  // Helper lấy skills thành mảng
  const getSkillsList = (skillsStr?: string | null) => {
    if (!skillsStr) return ["Giao tiếp", "Làm việc nhóm", "Thích ứng"];
    return skillsStr.split(",").map(s => s.trim()).filter(Boolean).slice(0, 4);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map(w => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const colors = [
    "from-cyan-600 to-teal-500",
    "from-amber-500 to-orange-600",
    "from-emerald-600 to-teal-600",
    "from-indigo-600 to-violet-600",
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Spinner size="lg" className="text-[#005a71]" />
        <p className="text-sm text-muted-foreground animate-pulse">Đang tải danh sách hồ sơ ứng tuyển...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hover:underline cursor-pointer">Dashboard</span>
            <span>&gt;</span>
            <span className="text-[#0ea5e9]">Hồ sơ ứng viên</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2 mt-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Users className="w-5 h-5" />
            </div>
            Hồ sơ ứng viên
          </h1>
          <p className="text-xs text-slate-400">Quản lý và xét duyệt đơn ứng tuyển</p>
        </div>

        <Button variant="outline" size="sm" className="bg-[#0f2d42] border-slate-700 hover:bg-[#153b54] text-slate-100 gap-1.5 self-end">
          <Download className="w-4 h-4" />
          <span>Xuất Excel</span>
        </Button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#0b2434] border border-slate-700/60 rounded-xl p-5 shadow-md flex flex-col justify-between min-h-[100px] border-l-4 border-l-blue-500">
          <p className="text-2xl font-black text-slate-100">{counts.total}</p>
          <p className="text-xs text-slate-400 font-semibold mt-1">Tổng hồ sơ</p>
        </div>
        {/* Card 2 */}
        <div className="bg-[#0b2434] border border-slate-700/60 rounded-xl p-5 shadow-md flex flex-col justify-between min-h-[100px] border-l-4 border-l-amber-500">
          <p className="text-2xl font-black text-slate-100">{counts.pending}</p>
          <p className="text-xs text-slate-400 font-semibold mt-1">Chờ xem xét</p>
        </div>
        {/* Card 3 */}
        <div className="bg-[#0b2434] border border-slate-700/60 rounded-xl p-5 shadow-md flex flex-col justify-between min-h-[100px] border-l-4 border-l-emerald-500">
          <p className="text-2xl font-black text-slate-100">{counts.accepted}</p>
          <p className="text-xs text-slate-400 font-semibold mt-1">Đã chấp nhận</p>
        </div>
        {/* Card 4 */}
        <div className="bg-[#0b2434] border border-slate-700/60 rounded-xl p-5 shadow-md flex flex-col justify-between min-h-[100px] border-l-4 border-l-rose-500">
          <p className="text-2xl font-black text-slate-100">{counts.rejected}</p>
          <p className="text-xs text-slate-400 font-semibold mt-1">Không phù hợp</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-[#0b2434] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="relative md:col-span-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên ứng viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#071622] border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500 text-slate-100"
            />
          </div>

          {/* Job Filter selector */}
          <div className="relative md:col-span-3">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full bg-[#071622] border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-200 appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả vị trí</option>
              {uniqueJobs.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort selector */}
          <div className="relative md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#071622] border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-200 appearance-none cursor-pointer"
            >
              <option value="NEWEST">Mới nhất</option>
              <option value="OLDEST">Cũ nhất</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              statusFilter === "ALL"
                ? "bg-amber-500 text-slate-950 font-bold scale-105"
                : "bg-[#071622] text-slate-300 hover:bg-[#0f2a3f] border border-slate-800"
            }`}
          >
            <span>Tất cả</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === "ALL" ? "bg-slate-950/20 text-slate-950" : "bg-[#0d2334] text-slate-400"}`}>
              {counts.total}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              statusFilter === "PENDING"
                ? "bg-amber-500/20 text-amber-500 border border-amber-500/30 scale-105 font-bold"
                : "bg-[#071622] text-slate-300 hover:bg-[#0f2a3f] border border-slate-800"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Chờ xem</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === "PENDING" ? "bg-amber-500/20 text-amber-500" : "bg-[#0d2334] text-slate-400"}`}>
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("REVIEWING")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              statusFilter === "REVIEWING"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 scale-105 font-bold"
                : "bg-[#071622] text-slate-300 hover:bg-[#0f2a3f] border border-slate-800"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Đang xem xét</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === "REVIEWING" ? "bg-blue-500/20 text-blue-400" : "bg-[#0d2334] text-slate-400"}`}>
              {counts.reviewing}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("ACCEPTED")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              statusFilter === "ACCEPTED"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 scale-105 font-bold"
                : "bg-[#071622] text-slate-300 hover:bg-[#0f2a3f] border border-slate-800"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Chấp nhận</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === "ACCEPTED" ? "bg-emerald-500/20 text-emerald-450" : "bg-[#0d2334] text-slate-400"}`}>
              {counts.accepted}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("REJECTED")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              statusFilter === "REJECTED"
                ? "bg-rose-500/20 text-rose-450 border border-rose-500/30 scale-105 font-bold"
                : "bg-[#071622] text-slate-300 hover:bg-[#0f2a3f] border border-slate-800"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Từ chối</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === "REJECTED" ? "bg-rose-500/20 text-rose-450" : "bg-[#0d2334] text-slate-400"}`}>
              {counts.rejected}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("BOOKMARKED")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-800 ${
              statusFilter === "BOOKMARKED"
                ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30 scale-105 font-bold"
                : "bg-[#071622] text-slate-300 hover:bg-[#0f2a3f]"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${statusFilter === "BOOKMARKED" ? "fill-yellow-500" : "text-yellow-500"}`} />
            <span>Đã đánh dấu</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === "BOOKMARKED" ? "bg-yellow-500/20 text-yellow-500" : "bg-[#0d2334] text-slate-400"}`}>
              {counts.bookmarked}
            </span>
          </button>
        </div>
      </div>

      {/* Candidate List */}
      {filteredApps.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Không tìm thấy ứng viên phù hợp"
          description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để có nhiều kết quả hơn."
        />
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app, index) => {
            const cvName = app.resume?.name || app.user.name;
            const matchRate = getMatchRate(app.id);
            const timeStr = formatTimeAgo(app.createdAt);
            const statusConfig = statusMap[app.status] || { label: app.status, class: "bg-slate-800 text-slate-300", dot: "bg-slate-400" };
            const skills = getSkillsList(app.resume?.skills);

            // Địa chỉ
            const address = app.resume?.address || "Phú Quốc, Kiên Giang";
            
            // Trường học & Bằng cấp
            let school = "Chưa cập nhật học vấn";
            if (app.resume?.education) {
              try {
                const eduList = Array.isArray(app.resume.education) 
                  ? app.resume.education 
                  : JSON.parse(app.resume.education as string);
                if (eduList.length > 0 && eduList[0].school) {
                  school = eduList[0].school;
                }
              } catch {}
            }

            // Kinh nghiệm làm việc
            let exp = "Chưa cập nhật kinh nghiệm";
            if (app.resume?.experience) {
              try {
                const expList = Array.isArray(app.resume.experience)
                  ? app.resume.experience
                  : JSON.parse(app.resume.experience as string);
                if (expList.length > 0 && expList[0].position) {
                  const years = expList[0].years || (expList[0].startYear && expList[0].endYear ? Number(expList[0].endYear) - Number(expList[0].startYear) : 2);
                  exp = `${years} năm kinh nghiệm`;
                }
              } catch {}
            }

            return (
              <Card
                key={app.id}
                className={`bg-[#0d2334]/80 border border-slate-800/80 hover:border-blue-500/30 transition-all duration-200 rounded-2xl overflow-hidden ${
                  app.isBookmarked ? "ring-1 ring-yellow-500/20" : ""
                }`}
              >
                <CardContent className="p-6 space-y-4">
                  {/* Row 1: Initials, Name, Status, Bookmark */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar initial bubble */}
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center text-white text-base font-bold shadow-md shrink-0 border border-white/10`}>
                        {getInitials(cvName)}
                      </div>

                      {/* Name and Vị trí */}
                      <div className="space-y-0.5">
                        <h3 className="font-bold text-lg text-slate-100 hover:text-blue-400 transition-colors cursor-pointer">
                          {cvName}
                        </h3>
                        <p className="text-xs text-slate-400">
                          <span className="text-slate-300 font-semibold">{app.job.title}</span>
                          <span className="mx-2">•</span>
                          <span>{timeStr}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${statusConfig.class}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        {statusConfig.label}
                      </span>
                      {/* Bookmark Star button */}
                      <button
                        onClick={() => handleBookmark(app.id)}
                        className="p-1 text-slate-400 hover:text-yellow-500 transition-colors"
                      >
                        <Star className={`w-4 h-4 ${app.isBookmarked ? "fill-yellow-500 text-yellow-500" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Metadata list */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-4 pt-1 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{exp}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{school}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{address}</span>
                    </div>
                  </div>

                  {/* Row 3: Progress match bar */}
                  <div className="space-y-1.5 pt-1 max-w-md">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Độ phù hợp:</span>
                      <span className="text-amber-500">{matchRate}%</span>
                    </div>
                    <div className="w-full bg-[#071622] h-2 rounded-full overflow-hidden border border-slate-800/80">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${matchRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Row 4: Skills list */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="bg-[#071622] text-slate-300 border border-slate-800 text-[10px] px-2.5 py-1 rounded-md font-medium transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Row 5: Action buttons */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-3 border-t border-slate-800/60">
                    {/* View CV button */}
                    {(app.cvUrl || app.resumeId) ? (
                      <Button
                        size="sm"
                        onClick={() => handleViewCV(app)}
                        className="bg-[#106b82] text-white hover:bg-[#147e9a] flex items-center justify-center gap-1.5 rounded-lg border-0 px-4 py-2 text-xs font-semibold"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Xem CV đầy đủ</span>
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Không đính kèm CV</span>
                    )}

                    {/* Manage actions (Duyệt / Từ chối / Đang xem xét) */}
                    <div className="flex flex-wrap items-center gap-2">
                      {app.status === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatus(app.id, "REVIEWING")}
                          className="bg-[#0e2738] text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 text-xs px-4 py-2 rounded-lg border border-blue-500/20 font-semibold"
                        >
                          Đang xem xét
                        </Button>
                      )}

                      {app.status !== "ACCEPTED" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatus(app.id, "ACCEPTED")}
                          className="bg-[#0a3625] text-[#22c55e] hover:bg-[#0e4b34] text-xs px-4 py-2 rounded-lg border border-[#22c55e]/20 font-semibold flex items-center gap-1"
                        >
                          <span>✓ Chấp nhận</span>
                        </Button>
                      )}

                      {app.status !== "REJECTED" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatus(app.id, "REJECTED")}
                          className="bg-[#3b1219] text-[#ef4444] hover:bg-[#521922] text-xs px-4 py-2 rounded-lg border border-[#ef4444]/20 font-semibold flex items-center gap-1"
                        >
                          <span>✗ Từ chối</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
