"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, MapPin, ChevronDown, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api-client";

const ALL_LOCATION = { id: "", name: "Tất cả khu vực", slug: "" };

interface Ward {
  id: string;
  name: string;
  slug: string;
}

interface JobSuggestion {
  id: string;
  title: string;
  slug: string;
  companyName?: string;
}

export default function SearchBar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(ALL_LOCATION);
  const [keyword, setKeyword] = useState("");
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [suggestStyle, setSuggestStyle] = useState<React.CSSProperties>({});
  const [wards, setWards] = useState<Ward[]>([]);

  // Suggestion states
  const [suggestions, setSuggestions] = useState<JobSuggestion[]>([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchBarRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const suggestDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch wards from API
  useEffect(() => {
    fetch(apiUrl("/api/v1/address/wards?limit=50"), { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const items = d.data?.items || d.data || [];
        setWards(items);
      })
      .catch(() => { });
  }, []);

  // Calculate suggest dropdown position relative to the main search bar
  const calcSuggestPosition = useCallback(() => {
    if (!searchBarRef.current) return;
    const r = searchBarRef.current.getBoundingClientRect();
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

  // Recalculate position on scroll/resize when suggestions are visible
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
        searchBarRef.current?.contains(target) ||
        suggestDropdownRef.current?.contains(target)
      ) {
        return;
      }
      setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [ALL_LOCATION, ...wards.map(w => ({ id: w.id, name: w.name, slug: w.slug }))];

  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setStyle({
      position: "fixed",
      top: r.bottom + 6,
      left: r.left,
      width: r.width,
      zIndex: 9999,
    });
  }, []);

  const handleToggle = () => {
    if (!isOpen) calcPosition();
    setIsOpen((v) => !v);
  };

  // Close location dropdown on outside click or scroll
  useEffect(() => {
    if (!isOpen) return;

    const close = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) return;
      setIsOpen(false);
    };

    const onScroll = () => setIsOpen(false);

    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll);
    };
  }, [isOpen]);

  const handleSearch = () => {
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (keyword) params.set("search", keyword);
    if (selected.slug) params.set("ward", selected.slug);
    router.push(`/jobs?${params.toString()}`);
  };

  const dropdown = isOpen ? (
    <div
      ref={dropdownRef}
      style={style}
      className="bg-white border border-slate-100 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-1.5 overflow-hidden"
    >
      {options.map((opt) => {
        const isSelected = opt.id === selected.id;
        return (
          <button
            key={opt.id || "all"}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setSelected(opt);
              setIsOpen(false);
            }}
            className={[
              "w-full flex items-center justify-between px-5 py-2.5 text-[13px] font-medium text-left border-0 outline-none cursor-pointer transition-colors duration-100",
              isSelected
                ? "bg-amber-50 text-amber-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            ].join(" ")}
          >
            <span>{opt.name}</span>
            {isSelected && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
          </button>
        );
      })}
    </div>
  ) : null;

  const suggestDropdown = showSuggestions && (suggestions.length > 0 || isSuggestLoading) ? (
    <div
      ref={suggestDropdownRef}
      style={suggestStyle}
      className="bg-white border border-slate-100 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.16)] py-2 overflow-hidden max-h-80 overflow-y-auto"
    >
      {isSuggestLoading ? (
        <div className="px-5 py-3 text-xs text-slate-400 flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Đang tìm kiếm gợi ý việc làm...</span>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="px-5 py-3 text-xs text-slate-400">Không tìm thấy việc làm phù hợp</div>
      ) : (
        <>
          <div className="px-5 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60 border-b border-slate-100">
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
                  const params = new URLSearchParams();
                  params.set("search", job.title);
                  if (selected.slug) params.set("ward", selected.slug);
                  router.push(`/jobs?${params.toString()}`);
                }}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-amber-50/70 text-left transition-colors cursor-pointer group border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Search className="w-4 h-4 text-slate-400 group-hover:text-amber-500 shrink-0 transition-colors" />
                  <span className="text-[13.5px] font-medium text-slate-700 group-hover:text-amber-600 truncate">
                    {job.title}
                  </span>
                </div>
                {job.companyName && (
                  <span className="text-[11.5px] font-normal text-slate-400 group-hover:text-amber-700/60 shrink-0 ml-3 truncate max-w-[180px]">
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
    <div ref={searchBarRef} className="bg-white p-2 rounded-2xl md:rounded-full shadow-2xl flex flex-col md:flex-row items-center max-w-4xl mx-auto w-full relative z-30">
      {/* Keyword Input */}
      <div className="flex-1 flex items-center pl-4 md:pl-6 pr-4 w-full relative">
        <Search className="w-5 h-5 text-slate-400 mr-2 md:mr-3 shrink-0" />
        <input
          type="text"
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
          placeholder="Tên công việc, kỹ năng..."
          className="w-full bg-transparent text-[14px] text-slate-700 outline-none py-3 placeholder:text-slate-400"
        />
      </div>

      {/* Divider */}
      <div className="hidden md:block h-8 w-[1px] bg-slate-200 shrink-0" />

      {/* Location trigger */}
      <div className="w-full md:w-[240px] shrink-0 border-t border-slate-100 md:border-t-0">
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggle}
          className="w-full flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 text-[14px] bg-transparent border-0 outline-none cursor-pointer text-left"
        >
          <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
          <span className="flex-1 truncate text-slate-700">{selected.name}</span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Dropdowns via portals */}
      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
      {typeof window !== "undefined" && createPortal(suggestDropdown, document.body)}

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="w-full md:w-auto bg-[#F59E0B] hover:bg-[#D97706] text-white px-8 py-3.5 md:py-3 rounded-xl md:rounded-full text-[14px] font-bold transition-colors shadow-md flex items-center justify-center gap-2 shrink-0 border-0 cursor-pointer md:ml-2"
      >
        <Search className="w-4 h-4" />
        Tìm kiếm
      </button>
    </div>
  );
}


