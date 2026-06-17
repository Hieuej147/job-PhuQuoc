"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import BlogCard from "@/components/common/BlogCard";

interface HomeBlogsProps {
  blogs: any[];
}

export default function HomeBlogs({ blogs = [] }: HomeBlogsProps) {
  return (
    <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="flex items-end justify-between mb-10 fade-up">
        <div>
          <h2 className="text-[28px] md:text-[32px] font-bold text-primary">
            Cẩm nang nghề nghiệp
          </h2>
          <p className="text-secondary-foreground text-[13px] mt-1.5">
            Kinh nghiệm, bí quyết xin việc tại Phú Quốc
          </p>
        </div>
        <Link
          href="/blog"
          className="hidden md:flex items-center gap-1 text-[13px] font-bold text-[#005a71] hover:opacity-75 transition-opacity"
        >
          Xem tất cả bài viết <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((item, index) => (
          <div key={item.id} className={`fade-up stagger-${(index % 3) + 1}`}>
            <BlogCard blog={item} />
          </div>
        ))}
      </div>
      <div className="mt-8 text-center md:hidden fade-up">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-[#005a71] text-[13px] font-bold border border-[#005a71]/50 px-6 py-3 rounded-full hover:bg-[#005a71]/5 transition-colors"
        >
          Xem tất cả bài viết <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
