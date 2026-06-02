"use client";

import React from 'react';
import { MapPin, Bookmark } from 'lucide-react';
import Link from 'next/link';

interface JobCardProps {
    job: {
        id: string;
        title: string;
        slug: string;
        companyLogo: string;
        companyName: string;
        companySlug: string;
        categorySlug: string;
        categoryName?: string;
        categoryIcon?: string;
        location: string;
        uiTagText: string;
        uiTagStyle: string;
        uiLogoBg: string;
        labels: string[];
        CreateAt?: string;
    };
}

export default function JobCard({ job }: JobCardProps) {
    // Hàm xử lý riêng khi bấm nút bookmark, ngăn hành vi nhảy trang của thẻ <Link> cha
    const handleBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Logic xử lý lưu việc làm ở đây (ví dụ: gọi API hoặc toast thông báo)
        console.log("Đã lưu công việc:", job.id);
    };

    return (
        <Link
            href={`/candidate/${job.categorySlug}/${job.slug}`}
            className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-[#0891b2]/40 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between group"
        >
            <div>
                <div className="flex justify-between items-center">
                    <div className={`w-9 h-9 rounded-lg ${job.uiLogoBg} flex items-center justify-center text-[12px] font-bold`}>
                        <img src={job.companyLogo} alt={job.companyName} className='w-full h-full object-cover' />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${job.uiTagStyle}`}>
                            {job.uiTagText}
                        </span>
                        {/* Fix lồng thẻ bấm bằng e.stopPropagation */}
                        <button
                            onClick={handleBookmark}
                            className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-md hover:bg-slate-50 relative z-10"
                        >
                            <Bookmark className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <h4 className="font-bold text-slate-800 text-[14px] mt-4 line-clamp-2 leading-snug group-hover:text-[#0891b2] transition-colors min-h-[40px]">
                    {job.title}
                </h4>

                <p className="text-slate-500 text-[12px] mt-1.5">{job.companyName}</p>

                <div className="flex flex-col gap-1 mt-1">
                    <p className="text-slate-400 text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job.location}
                    </p>

                    {job.CreateAt && (
                        <p className="text-slate-400 text-[10px]">
                            Đăng ngày: {new Date(job.CreateAt).toLocaleDateString('vi-VN')}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-slate-100">
                {job.labels.map((lbl, idx) => (
                    <span
                        key={idx}
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md ${idx === 0 ? 'bg-emerald-50 text-emerald-600' :
                            idx === 1 ? 'bg-cyan-50 text-cyan-600' :
                                'bg-slate-100 text-slate-600'
                            }`}
                    >
                        {lbl}
                    </span>
                ))}
            </div>
        </Link>
    );
}