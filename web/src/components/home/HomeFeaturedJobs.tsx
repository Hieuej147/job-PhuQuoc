"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import JobCard, { HomeJobItem } from "@/components/common/JobCard";

interface HomeFeaturedJobsProps {
  jobs: HomeJobItem[];
}

export default function HomeFeaturedJobs({ jobs = [] }: HomeFeaturedJobsProps) {
  if (jobs.length === 0) {
    return (
      <section className="py-6 pb-24 bg-primary-foreground border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-10 pt-10">
            <div>
              <h2 className="text-[28px] md:text-[32px] font-bold text-[#005a71]">
                Việc làm nổi bật hôm nay
              </h2>
              <p className="text-slate-400 text-[13px] mt-1.5">
                Cơ hội tốt nhất vừa được cập nhật
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 px-6 py-10 text-center text-sm text-slate-500">
            Hiện chưa có việc làm nổi bật nào được cập nhật.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 pb-24 bg-primary-foreground border-y border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-10 pt-10 fade-up">
          <div>
            <h2 className="text-[28px] md:text-[32px] font-bold text-[#005a71]">
              Việc làm nổi bật hôm nay
            </h2>
            <p className="text-slate-400 text-[13px] mt-1.5">
              Cơ hội tốt nhất vừa được cập nhật
            </p>
          </div>
          <Link
            href="/jobs"
            className="hidden md:flex items-center gap-1 text-[13px] font-bold text-[#005a71] hover:opacity-75 transition-opacity"
          >
            Xem tất cả việc làm <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job, index) => (
            <div
              key={job.id}
              className={`fade-up stagger-${(index % 3) + 1}`}
            >
              <JobCard job={job} />
            </div>
          ))}
        </div>
        <div className="mt-8 text-center md:hidden fade-up">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-[#005a71] text-[13px] font-bold border border-[#005a71]/50 px-6 py-3 rounded-full hover:bg-[#005a71]/5 transition-colors"
          >
            Xem tất cả việc làm <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
