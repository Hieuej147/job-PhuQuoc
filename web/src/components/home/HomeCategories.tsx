"use client";

import React from "react";

interface HomeCategoriesProps {
  categories: {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
  }[];
}

export default function HomeCategories({ categories = [] }: HomeCategoriesProps) {
  if (categories.length === 0) {
    return (
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-[28px] md:text-[32px] font-bold text-[#005a71]">
            Khám phá theo ngành nghề
          </h2>
          <p className="text-slate-500 text-[15px] mt-3 max-w-2xl mx-auto">
            Tìm kiếm cơ hội phù hợp nhất với kỹ năng và đam mê của bạn tại Phú Quốc.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="text-center mb-12 fade-up">
        <h2 className="text-[28px] md:text-[32px] font-bold text-[#005a71]">
          Khám phá theo ngành nghề
        </h2>
        <p className="text-slate-500 text-[15px] mt-3 max-w-2xl mx-auto">
          Tìm kiếm cơ hội phù hợp nhất với kỹ năng và đam mê của bạn tại Phú
          Quốc.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {categories.slice(0, 8).map((cat, index) => (
          <a
            key={cat.id}
            href={`/jobs?category=${cat.slug}`}
            className={`bg-primary-foreground p-5 sm:p-6 rounded-2xl border border-primary shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group fade-up stagger-${(index % 4) + 1}`}
          >
            <div className="w-16 h-16 bg-secondary group-hover:bg-[#005a71]/20 rounded-full flex items-center justify-center mb-4 transition-colors">
              <span className="text-[2.25rem]">{cat.icon || "💼"}</span>
            </div>
            <h3 className="font-bold text-primary text-[13px] sm:text-[14px] mb-1 line-clamp-1">
              {cat.name}
            </h3>
          </a>
        ))}
      </div>
    </section>
  );
}
