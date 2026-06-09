"use client";

import { useState, useCallback, useEffect } from "react";
import JobsHero from "@/components/jobs/JobsHero";
import { JobFilterSidebar, JobFilterMobileDrawer } from "@/components/jobs/JobFilter";
import JobSortBar from "@/components/jobs/JobSortBar";
import JobList from "@/components/jobs/JobList";

interface JobItem {
  id: string;
  slug: string;
  title: string;
  company: { name: string; logo?: string | null; slug: string };
  type: string;
  experience?: string | null;
  level?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  ward?: { name: string; district?: { name: string } } | null;
  addressDetail?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  createdAt: string;
  deadline?: string | null;
  _count?: { applications?: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

interface JobsPageClientProps {
  initialJobs: JobItem[];
  initialTotal: number;
  initialTotalPages: number;
  categories: Category[];
}

const TYPE_MAP: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  REMOTE: "Remote",
  CONTRACT: "Hợp đồng",
  INTERNSHIP: "Thực tập",
  FREELANCE: "Freelance",
};

const EXP_MAP: Record<string, string> = {
  NO_EXPERIENCE: "Không yêu cầu",
  UNDER_1_YEAR: "Dưới 1 năm",
  ONE_TO_THREE_YEARS: "1-3 năm",
  THREE_TO_FIVE_YEARS: "3-5 năm",
  OVER_FIVE_YEARS: "Trên 5 năm",
};

const LEVEL_MAP: Record<string, string> = {
  INTERN: "Thực tập sinh",
  FRESHER: "Fresher",
  JUNIOR: "Junior",
  MID: "Middle",
  SENIOR: "Senior",
  LEAD: "Lead",
  MANAGER: "Manager",
  DIRECTOR: "Director",
};

function formatSalary(min?: number | null, max?: number | null): string {
  if (!min && !max) return "Thỏa thuận";
  const fmt = (n: number) => (n / 1000000).toFixed(0) + " triệu";
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return `Đến ${fmt(max!)}`;
}

function mapJobType(item: JobItem) {
  const daysLeft = item.deadline
    ? Math.max(0, Math.ceil((new Date(item.deadline).getTime() - Date.now()) / 86400000))
    : 0;
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    company: item.company.name,
    companyInitials: item.company.name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase(),
    logoColor: "#0E7490",
    textColor: "#ffffff",
    contractType: TYPE_MAP[item.type] || item.type,
    salary: formatSalary(item.salaryMin, item.salaryMax),
    experience: EXP_MAP[item.experience || ""] || "Không yêu cầu",
    level: LEVEL_MAP[item.level || ""] || "",
    industry: item.category?.name || "",
    location: item.ward ? `${item.ward.name}, Phú Quốc` : item.addressDetail || "Phú Quốc",
    isFeatured: false,
    isUrgent: false,
    daysLeft,
    postedDate: item.createdAt,
    tags: [TYPE_MAP[item.type] || item.type, formatSalary(item.salaryMin, item.salaryMax)],
  };
}

export default function JobsPageClient({ initialJobs, initialTotal, initialTotalPages, categories }: JobsPageClientProps) {
  const [jobs, setJobs] = useState(initialJobs);
  const [totalJobs, setTotalJobs] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    keyword: "",
    location: "",
    industries: [] as string[],
    contractTypes: [] as string[],
    salaryRanges: [] as string[],
    experiences: [] as string[],
    levels: [] as string[],
  });

  const fetchJobs = useCallback(async (p: number, f: typeof filters, s: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", "12");
      if (f.keyword) params.set("search", f.keyword);
      if (f.contractTypes.length === 1) {
        const typeMap: Record<string, string> = { "Full-time": "FULL_TIME", "Part-time": "PART_TIME", "Remote": "REMOTE", "Hợp đồng": "CONTRACT", "Thực tập": "INTERNSHIP", "Freelance": "FREELANCE" };
        params.set("type", typeMap[f.contractTypes[0]] || f.contractTypes[0]);
      }
      if (f.experiences.length === 1) {
        const expMap: Record<string, string> = { "Không yêu cầu": "NO_EXPERIENCE", "Dưới 1 năm": "UNDER_1_YEAR", "1-3 năm": "ONE_TO_THREE_YEARS", "3-5 năm": "THREE_TO_FIVE_YEARS", "Trên 5 năm": "OVER_FIVE_YEARS" };
        params.set("experience", expMap[f.experiences[0]] || f.experiences[0]);
      }
      if (f.levels.length === 1) {
        const lvlMap: Record<string, string> = { "Thực tập sinh": "INTERN", "Fresher": "FRESHER", "Junior": "JUNIOR", "Middle": "MID", "Senior": "SENIOR", "Lead": "LEAD", "Manager": "MANAGER", "Director": "DIRECTOR" };
        params.set("level", lvlMap[f.levels[0]] || f.levels[0]);
      }
      if (f.industries.length === 1) {
        const cat = categories.find(c => c.name === f.industries[0]);
        if (cat) params.set("categoryId", cat.id);
      }
      if (s === "salary_high") params.set("sort", "salary");

      const res = await fetch(`/api/v1/jobs?${params.toString()}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.data?.items || []);
        setTotalJobs(data.data?.total || 0);
        setTotalPages(data.data?.totalPages || 0);
      }
    } catch {
      // keep current data
    } finally {
      setLoading(false);
    }
  }, [categories]);

  useEffect(() => {
    fetchJobs(page, filters, sortBy);
  }, [page, filters, sortBy, fetchJobs]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ keyword: "", location: "", industries: [], contractTypes: [], salaryRanges: [], experiences: [], levels: [] });
    setPage(1);
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSearch = useCallback((keyword: string, location: string, industry: string) => {
    updateFilters({ keyword, location, industries: industry ? [industry] : [] });
  }, [updateFilters]);

  const activeFilters = [
    ...filters.contractTypes.map(ct => ({ key: `contractType:${ct}`, label: ct })),
    ...filters.salaryRanges.map(sr => ({ key: `salary:${sr}`, label: sr })),
    ...filters.experiences.map(ex => ({ key: `exp:${ex}`, label: ex })),
    ...filters.levels.map(lv => ({ key: `level:${lv}`, label: lv })),
    ...filters.industries.map(ind => ({ key: `industry:${ind}`, label: ind })),
  ];

  const removeFilter = useCallback((key: string) => {
    const [type, value] = key.split(":");
    setFilters(prev => {
      const next = { ...prev };
      if (type === "contractType") next.contractTypes = prev.contractTypes.filter(v => v !== value);
      if (type === "salary") next.salaryRanges = prev.salaryRanges.filter(v => v !== value);
      if (type === "exp") next.experiences = prev.experiences.filter(v => v !== value);
      if (type === "level") next.levels = prev.levels.filter(v => v !== value);
      if (type === "industry") next.industries = prev.industries.filter(v => v !== value);
      return next;
    });
    setPage(1);
  }, []);

  const mappedJobs = jobs.map(mapJobType);

  return (
    <div className="min-h-screen bg-[#f7f9ff] dark:bg-[#071a2b] text-slate-800 dark:text-[#cbd5e1] transition-colors duration-200">
      <JobsHero totalJobs={totalJobs} onSearch={handleSearch} />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex gap-6 items-start">
          <aside className="hidden lg:block w-72 shrink-0 sticky top-20">
            <JobFilterSidebar
              filters={filters as any}
              onFilterChange={updateFilters as any}
              onClearAll={clearFilters}
            />
          </aside>

          <div className="flex-1 min-w-0">
            <JobSortBar
              totalResults={totalJobs}
              activeFilters={activeFilters}
              sortBy={sortBy as any}
              onSortChange={setSortBy as any}
              onRemoveFilter={removeFilter}
              onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
            />

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0E7490]" />
              </div>
            ) : (
              <JobList
                jobs={mappedJobs}
                totalPages={totalPages}
                currentPage={page}
                onPageChange={setPage}
                bookmarkedIds={bookmarkedIds}
                onBookmark={toggleBookmark}
              />
            )}
          </div>
        </div>
      </main>

      <JobFilterMobileDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={filters as any}
        onFilterChange={updateFilters as any}
        onClearAll={clearFilters}
      />
    </div>
  );
}
