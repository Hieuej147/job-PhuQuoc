"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, MapPin, Briefcase } from "lucide-react";
import { apiUrl } from "@/lib/api-client";

interface JobsHeroProps {
  totalJobs: number;
  categories: { id: string; name: string; slug: string }[];
  initialKeyword?: string;
  initialLocation?: string;
  initialIndustry?: string;
  onSearch: (keyword: string, location: string, industry: string) => void;
}

interface JobSuggestion {
  id: string;
  title: string;
  slug: string;
  companyName?: string;
}

export default function JobsHero({
  totalJobs,
  categories = [],
  initialKeyword = "",
  initialLocation = "",
  initialIndustry = "",
  onSearch,
}: JobsHeroProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [location, setLocation] = useState(initialLocation);
  const [industry, setIndustry] = useState(initialIndustry);
  const [wards, setWards] = useState<{ id: string; name: string; slug: string }[]>([]);

  // Suggestion states
  const [suggestions, setSuggestions] = useState<JobSuggestion[]>([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestStyle, setSuggestStyle] = useState<React.CSSProperties>({});

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const suggestDropdownRef = useRef<HTMLDivElement>(null);

  // Sync state with props
  useEffect(() => {
    setKeyword(initialKeyword);
  }, [initialKeyword]);

  useEffect(() => {
    setLocation(initialLocation);
  }, [initialLocation]);

  useEffect(() => {
    setIndustry(initialIndustry);
  }, [initialIndustry]);

  // Fetch wards dynamically from API
  useEffect(() => {
    fetch(apiUrl("/api/v1/address/wards?limit=50"), { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const items = d.data?.items || d.data || [];
        setWards(items);
      })
      .catch(() => { });
  }, []);

  // Calculate position for suggestions portal
  const calcSuggestPosition = useCallback(() => {
    if (!searchBoxRef.current) return;
    const r = searchBoxRef.current.getBoundingClientRect();
    setSuggestStyle({
      position: "fixed",
      top: r.bottom + 8,
      left: r.left,
      width: r.width,
      zIndex: 9999,
    });
  }, []);

  // Debounced job search suggestions (500ms)
  useEffect(() => {
    const query = keyword.trim();
    if (query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSuggestLoading(true);
      fetch(apiUrl(`/api/v1/jobs?search=${encodeURIComponent(query)}&limit=6`), {
        credentials: "include",
      })
        .then((r) => r.json())
        .then((d) => {
          const items = d.data?.items || d.data || [];
          setSuggestions(items);
          calcSuggestPosition();
          setShowSuggestions(true);
        })
        .catch(() => {
          setSuggestions([]);
        })
        .finally(() => {
          setIsSuggestLoading(false);
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword, calcSuggestPosition]);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (!showSuggestions) return;
    calcSuggestPosition();
    const handleScrollOrResize = () => calcSuggestPosition();
    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [showSuggestions, calcSuggestPosition]);

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        searchBoxRef.current?.contains(target) ||
        suggestDropdownRef.current?.contains(target)
      ) {
        return;
      }
      setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    setShowSuggestions(false);
    onSearch(keyword, location, industry);
  };

  const handleQuickTag = (tag: string) => {
    setShowSuggestions(false);
    setKeyword(tag);
    onSearch(tag, location, industry);
  };

  const suggestDropdown = showSuggestions && (suggestions.length > 0 || isSuggestLoading) ? (
    <div
      ref={suggestDropdownRef}
      style={suggestStyle}
      className="bg-white border border-slate-100 dark:bg-[#0d2137] dark:border-[#1a3d5c] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.18)] py-2 overflow-hidden max-h-80 overflow-y-auto z-50"
    >
      {isSuggestLoading ? (
        <div className="px-5 py-3 text-xs text-slate-400 dark:text-gray-400 flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Đang tìm kiếm gợi ý việc làm...</span>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="px-5 py-3 text-xs text-slate-400 dark:text-gray-400">Không tìm thấy việc làm phù hợp</div>
      ) : (
        <>
          <div className="px-5 py-2 text-[11px] font-semibold text-slate-400 dark:text-gray-400 uppercase tracking-wider bg-slate-50/60 dark:bg-[#091726] border-b border-slate-100 dark:border-[#1a3d5c]">
            Gợi ý việc làm
          </div>
          <div className="py-1">
            {suggestions.map((job) => (
              <button
                key={job.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowSuggestions(false);
                  setKeyword(job.title);
                  onSearch(job.title, location, industry);
                }}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-amber-50/70 dark:hover:bg-[#132e48] text-left transition-colors cursor-pointer group border-b border-slate-50 dark:border-[#132c44] last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Search className="w-4 h-4 text-slate-400 group-hover:text-amber-500 shrink-0 transition-colors" />
                  <span className="text-[13.5px] font-medium text-slate-700 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                    {job.title}
                  </span>
                </div>
                {job.companyName && (
                  <span className="text-[11.5px] font-normal text-slate-400 dark:text-gray-400 group-hover:text-amber-700/60 dark:group-hover:text-amber-300/80 shrink-0 ml-3 truncate max-w-[180px]">
                    {job.companyName}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  ) : null;

  return (
    <section className="bg-linear-to-b from-[#0E7490] to-[#0D9488] dark:from-[#002d3d] dark:to-[#003d38] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <h1 className="text-white font-bold text-2xl md:text-3xl mb-2">
          Tìm việc làm tại Phú Quốc
        </h1>

        <p className="text-white/80 text-base mb-6">
          Đang hiển thị{" "}
          <span className="font-semibold text-white">
            {totalJobs.toLocaleString("vi-VN")}
          </span>{" "}
          việc làm
        </p>

        {/* Khung Thanh Công Cụ Tìm Kiếm */}
        <div ref={searchBoxRef} className="bg-white dark:bg-[#0d2137] rounded-2xl shadow-xl flex flex-col md:flex-row items-stretch overflow-hidden border border-transparent dark:border-[#1a3d5c] transition-colors duration-200 relative">
          {/* Ô nhập từ khóa (Search Keyword) */}
          <div className="flex-1 flex items-center px-4 py-1 border-b md:border-b-0 md:border-r border-gray-100 dark:border-[#1a3d5c] relative">
            <Search className="text-gray-400 dark:text-gray-500 mr-3 w-5 h-5 flex-shrink-0" />
            <input
              className="w-full border-none outline-none text-gray-800 dark:text-[#cbd5e1] placeholder-gray-400 dark:placeholder-gray-500 bg-transparent py-3 text-sm focus:ring-0 focus:outline-none"
              placeholder="Tên công việc, kỹ năng, công ty..."
              type="text"
              id="search-keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => {
                if (keyword.trim().length >= 1 && suggestions.length > 0) {
                  calcSuggestPosition();
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>

          {/* Ô chọn khu vực địa lý (Location) */}
          <div className="flex items-center px-4 py-1 min-w-[180px] border-b md:border-b-0 md:border-r border-gray-100 dark:border-[#1a3d5c]">
            <MapPin className="text-gray-400 dark:text-gray-500 mr-3 w-5 h-5 flex-shrink-0" />
            <select
              className="w-full border-none outline-none text-gray-800 dark:text-[#cbd5e1] bg-transparent py-3 text-sm cursor-pointer focus:ring-0 focus:outline-none"
              value={location}
              onChange={(e) => {
                const val = e.target.value;
                setLocation(val);
                onSearch(keyword, val, industry);
              }}
              id="search-location"
            >
              <option value="" className="dark:bg-[#0d2137]">Tất cả khu vực</option>
              {wards.map((loc) => (
                <option key={loc.id} value={loc.slug} className="dark:bg-[#0d2137]">
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ô chọn ngành nghề tuyển dụng (Industry) */}
          <div className="flex items-center px-4 py-1 min-w-[160px]">
            <Briefcase className="text-gray-400 dark:text-gray-500 mr-3 w-5 h-5 flex-shrink-0" />
            <select
              className="w-full border-none outline-none text-gray-800 dark:text-[#cbd5e1] bg-transparent py-3 text-sm cursor-pointer focus:ring-0 focus:outline-none"
              value={industry}
              onChange={(e) => {
                const val = e.target.value;
                setIndustry(val);
                onSearch(keyword, location, val);
              }}
              id="search-industry"
            >
              <option value="" className="dark:bg-[#0d2137]">Tất cả ngành</option>
              {categories.map((ind) => (
                <option key={ind.id} value={ind.name} className="dark:bg-[#0d2137]">
                  {ind.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nút bấm kích hoạt tìm kiếm */}
          <button
            onClick={handleSearch}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-8 py-4 font-semibold transition-colors flex items-center justify-center gap-2 min-w-[140px] cursor-pointer"
            id="btn-search"
          >
            <Search className="w-4 h-4" />
            Tìm kiếm
          </button>
        </div>

        {/* Render suggest dropdown via portal */}
        {typeof window !== "undefined" && createPortal(suggestDropdown, document.body)}

        {/* Gợi ý Tìm nhanh (Quick Tags) */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-white/70 text-sm mr-1 self-center">
            Tìm nhanh:
          </span>
          {categories.slice(0, 7).map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleQuickTag(cat.name)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded-full transition-colors border border-white/30 cursor-pointer"
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

