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

export default function SearchBar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(ALL_LOCATION);
  const [keyword, setKeyword] = useState("");
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [wards, setWards] = useState<Ward[]>([]);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close on outside click or scroll
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

  return (
    <div className="bg-white p-2 rounded-2xl md:rounded-full shadow-2xl flex flex-col md:flex-row items-center max-w-4xl mx-auto w-full relative z-30">
      {/* Keyword */}
      <div className="flex-1 flex items-center pl-4 md:pl-6 pr-4 w-full">
        <Search className="w-5 h-5 text-slate-400 mr-2 md:mr-3 shrink-0" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            // enter thì search lun không cần đợi nhắn nút
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

      {/* Dropdown via portal */}
      {typeof window !== "undefined" && createPortal(dropdown, document.body)}

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
