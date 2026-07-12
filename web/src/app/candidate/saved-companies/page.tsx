"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { timeAgo } from "@/lib/utils/date";
import { companyInitials } from "@/lib/utils/format";
import { deleteSavedCompany, getSavedCompanies } from "@/features/saved-companies/api";

interface SavedCompany {
    id: string;
    companyId: string;
    createdAt: string;
    company: {
        id: string;
        name: string;
        slug: string;
        logo?: string | null;
        industry?: string | null;
        size?: string | null;
        addressDetail?: string | null;
        ward?: { name: string } | null;
        _count?: { jobs: number };
    };
}

const SIZE_LABELS: Record<string, string> = {
    SIZE_1_50: "1-50",
    SIZE_51_200: "51-200",
    SIZE_201_500: "201-500",
    SIZE_500_PLUS: "500+",
};

const GRADIENTS = [
    "linear-gradient(135deg,#0E7490,#0D9488)",
    "linear-gradient(135deg,#0D9488,#006a61)",
    "linear-gradient(135deg,#F59E0B,#D97706)",
    "linear-gradient(135deg,#6366f1,#4f46e5)",
    "linear-gradient(135deg,#059669,#047857)",
    "linear-gradient(135deg,#0891b2,#0e7490)",
];

export default function SavedCompaniesPage() {
    const [items, setItems] = useState<SavedCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("recent");
    const [activeFilter, setActiveFilter] = useState("all");

    useEffect(() => {
        getSavedCompanies(500)
            .then((d) => setItems(d.items ?? d ?? []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleUnfollow = async (companyId: string, companyName: string) => {
        if (!confirm(`Bỏ theo dõi "${companyName}"?`)) return;
        try {
            await deleteSavedCompany(companyId);
            setItems((prev) => prev.filter((s) => s.companyId !== companyId));
        } catch (e) {
            console.error(e);
        }
    };

    // Unique industries for filter tabs
    const industries = useMemo(() => {
        const unique = [...new Set(items.map((s) => s.company.industry).filter(Boolean) as string[])];
        return unique;
    }, [items]);

    const filtered = useMemo(() => {
        let result = items.filter((s) => {
            const matchSearch = search === "" ||
                s.company.name.toLowerCase().includes(search.toLowerCase()) ||
                (s.company.industry || "").toLowerCase().includes(search.toLowerCase());
            const matchFilter = activeFilter === "all" || s.company.industry === activeFilter;
            return matchSearch && matchFilter;
        });

        if (sortBy === "jobs") {
            result = [...result].sort((a, b) => (b.company._count?.jobs || 0) - (a.company._count?.jobs || 0));
        } else if (sortBy === "name") {
            result = [...result].sort((a, b) => a.company.name.localeCompare(b.company.name, "vi"));
        }

        return result;
    }, [items, search, sortBy, activeFilter]);

    const totalJobs = items.reduce((sum, s) => sum + (s.company._count?.jobs || 0), 0);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
        </div>
    );

    return (
        <div className="space-y-6">

            {/* Breadcrumb + Header */}
            <div>
                <div className="flex items-center gap-1.5 text-xs text-[#3f484c] dark:text-[#94A3B8] mb-3">
                    <Link href="/candidate/dashboard" className="hover:text-[#005a71] dark:hover:text-[#67E8F9] transition-colors">
                        Dashboard
                    </Link>
                    <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                    <span className="text-[#005a71] dark:text-[#67E8F9] font-semibold">Công ty theo dõi</span>
                </div>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold text-[#001e30] dark:text-[#E0F2FE] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#005a71] dark:text-[#67E8F9]" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
                            Công ty theo dõi
                        </h1>
                        <p className="text-sm text-[#3f484c] dark:text-[#94A3B8] mt-1">
                            Theo dõi công ty để nhận thông báo việc làm mới sớm nhất
                        </p>
                    </div>
                    <Link
                        href="/companies"
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#005a71] to-[#0e7490] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-md"
                    >
                        <span className="material-symbols-outlined text-[18px]">search</span>
                        Khám phá công ty
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#0d2d42] border border-[#e1efff] dark:border-[#1E5F74] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#005a71]/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#005a71] dark:text-[#67E8F9] text-[20px]">apartment</span>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#001e30] dark:text-[#E0F2FE]">{items.length}</p>
                    <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] mt-0.5">Đang theo dõi</p>
                </div>
                <div className="bg-white dark:bg-[#0d2d42] border border-[#e1efff] dark:border-[#1E5F74] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#F59E0B] text-[20px]">work</span>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#001e30] dark:text-[#E0F2FE]">{totalJobs}</p>
                    <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] mt-0.5">Việc đang tuyển</p>
                </div>
                <div className="bg-white dark:bg-[#0d2d42] border border-[#e1efff] dark:border-[#1E5F74] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0d9488]/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#0d9488] dark:text-[#2DD4BF] text-[20px]">fiber_new</span>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#001e30] dark:text-[#E0F2FE]">{industries.length}</p>
                    <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] mt-0.5">Ngành nghề</p>
                </div>
                <div className="bg-white dark:bg-[#0d2d42] border border-[#e1efff] dark:border-[#1E5F74] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-500 text-[20px]">local_fire_department</span>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#001e30] dark:text-[#E0F2FE]">
                        {items.filter((s) => (s.company._count?.jobs || 0) > 5).length}
                    </p>
                    <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] mt-0.5">Đang tuyển gấp</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6f787d] text-[18px]">search</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm trong công ty đã theo dõi..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#bec8cd] dark:border-[#1E5F74] bg-white dark:bg-[#0d2d42] text-[#001e30] dark:text-[#E0F2FE] text-sm outline-none focus:border-[#0e7490] focus:shadow-[0_0_0_3px_rgba(14,116,144,.12)] transition-all placeholder:text-[#6f787d]"
                    />
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-[#bec8cd] dark:border-[#1E5F74] bg-white dark:bg-[#0d2d42] text-[#001e30] dark:text-[#E0F2FE] text-sm outline-none cursor-pointer"
                >
                    <option value="recent">Mới theo dõi nhất</option>
                    <option value="jobs">Nhiều việc nhất</option>
                    <option value="name">A → Z</option>
                </select>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                    onClick={() => setActiveFilter("all")}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeFilter === "all" ? "bg-[#005a71] text-white" : "text-[#3f484c] dark:text-[#94A3B8] hover:bg-[#005a71]/10 hover:text-[#005a71]"}`}
                >
                    🏢 Tất cả ({items.length})
                </button>
                {industries.map((ind) => (
                    <button
                        key={ind}
                        onClick={() => setActiveFilter(ind)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeFilter === ind ? "bg-[#005a71] text-white" : "text-[#3f484c] dark:text-[#94A3B8] hover:bg-[#005a71]/10 hover:text-[#005a71]"}`}
                    >
                        {ind}
                    </button>
                ))}
            </div>

            {/* Company Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-24">
                    <div className="w-24 h-24 rounded-3xl bg-[#005a71]/10 dark:bg-[#005a71]/20 flex items-center justify-center mx-auto mb-5">
                        <span className="material-symbols-outlined text-[#005a71] dark:text-[#67E8F9] text-5xl">apartment</span>
                    </div>
                    <p className="font-bold text-lg text-[#001e30] dark:text-[#E0F2FE] mb-2">Không tìm thấy công ty</p>
                    <p className="text-sm text-[#3f484c] dark:text-[#94A3B8] mb-6 max-w-xs mx-auto">
                        {items.length === 0 ? "Bạn chưa theo dõi công ty nào. Khám phá và theo dõi công ty yêu thích!" : "Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"}
                    </p>
                    <Link
                        href="/companies"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#005a71] to-[#0e7490] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-md"
                    >
                        <span className="material-symbols-outlined text-[18px]">search</span>
                        Khám phá công ty
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map((s, index) => {
                        const c = s.company;
                        const initials = companyInitials(c.name);
                        const gradient = GRADIENTS[index % GRADIENTS.length];
                        const jobCount = c._count?.jobs || 0;
                        const location = c.ward?.name ? `${c.ward.name}, Phú Quốc` : c.addressDetail || "Phú Quốc";
                        const size = SIZE_LABELS[c.size || ""] || c.size || "—";
                        const maxJobs = Math.max(...filtered.map((s) => s.company._count?.jobs || 0), 1);
                        const barPct = Math.round((jobCount / maxJobs) * 100);

                        return (
                            <div key={s.id} className="bg-white dark:bg-[#0d2d42] border border-[#e1efff] dark:border-[#1E5F74] rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                                {/* Cover */}
                                <div className="h-20 relative" style={{ background: gradient }}>
                                    <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 75% 25%, rgba(255,255,255,.18) 0%, transparent 65%)" }} />
                                    {jobCount > 0 && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#F59E0B] text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                            {jobCount} việc
                                        </div>
                                    )}
                                    {/* Logo */}
                                    <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-[14px] bg-white dark:bg-[#0d2d42] border-2 border-white dark:border-[#0d2d42] shadow-lg flex items-center justify-center">
                                        {c.logo ? (
                                            <img src={c.logo} alt={c.name} className="w-8 h-8 object-contain rounded-lg" />
                                        ) : (
                                            <span className="text-base font-black" style={{ color: "#0E7490" }}>{initials}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-4 pb-4 pt-7">
                                    <div className="flex items-start justify-between mb-2 gap-2">
                                        <div>
                                            <h3 className="font-bold text-sm text-[#001e30] dark:text-[#E0F2FE] leading-snug">{c.name}</h3>
                                            <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] mt-0.5 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">apartment</span>
                                                {c.industry || "—"}
                                            </p>
                                        </div>
                                        <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-[#005a71]/10 dark:bg-[#005a71]/20 text-[#005a71] dark:text-[#67E8F9]">
                                            <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                                            Đang theo dõi
                                        </span>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        <span className="bg-[#0D9488]/10 text-[#0D9488] dark:text-[#67E8F9] text-[11px] font-semibold px-2 py-0.5 rounded-md">{size} nhân viên</span>
                                        <span className="bg-[#0D9488]/10 text-[#0D9488] dark:text-[#67E8F9] text-[11px] font-semibold px-2 py-0.5 rounded-md">{location}</span>
                                        {jobCount > 5 && (
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#F59E0B]/10 text-[#D97706]">🔥 {jobCount} việc</span>
                                        )}
                                    </div>

                                    {/* Job bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-[10px] text-[#3f484c] dark:text-[#94A3B8] mb-1.5">
                                            <span>Việc đang tuyển</span>
                                            <span className="font-bold text-[#005a71] dark:text-[#67E8F9]">{jobCount}</span>
                                        </div>
                                        <div className="h-1.5 bg-[#e1efff] dark:bg-[#1E5F74] rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-[#005a71] to-[#0e7490] transition-all duration-500"
                                                style={{ width: `${barPct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/companies/${c.slug}`}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-[#005a71] to-[#0e7490] text-white font-bold text-xs rounded-full hover:opacity-90 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">business</span>
                                            Xem công ty
                                        </Link>
                                        <button
                                            onClick={() => handleUnfollow(c.id, c.name)}
                                            title="Bỏ theo dõi"
                                            className="flex items-center justify-center gap-1 px-3 py-2 rounded-full border border-[#0e7490] text-[#0e7490] dark:border-[#67E8F9] dark:text-[#67E8F9] text-xs font-bold hover:bg-[#0e7490] hover:text-white dark:hover:bg-[#67E8F9] dark:hover:text-[#071e2e] transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">bookmark_remove</span>
                                        </button>
                                    </div>

                                    {/* Follow date */}
                                    <p className="text-[10px] text-[#6f787d] mt-2 text-center">
                                        Theo dõi từ {timeAgo(s.createdAt)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
