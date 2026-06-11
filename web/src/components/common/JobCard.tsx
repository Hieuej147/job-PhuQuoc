"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface JobCardProps {
    job: {
        id: string;
        title: string;
        slug: string;
        companyLogo: string;
        companyName: string;
        companySlug: string;
        companyInitials?: string;
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

let savedJobIdsPromise: Promise<string[]> | null = null;

async function fetchSavedJobIds(): Promise<string[]> {
    if (savedJobIdsPromise) return savedJobIdsPromise;

    savedJobIdsPromise = (async () => {
        try {
            const meRes = await fetch("/api/v1/auth/me", { credentials: "include" });
            if (!meRes.ok) return [];

            const res = await fetch("/api/v1/saved/jobs?limit=100", { credentials: "include" });
            if (!res.ok) return [];
            const data = await res.json();
            const items = data.data?.items || data.items || [];
            return items.map((item: any) => item.jobId);
        } catch {
            return [];
        }
    })();

    return savedJobIdsPromise;
}

export default function JobCard({ job }: JobCardProps) {
    const router = useRouter();
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        let active = true;
        fetchSavedJobIds().then((ids) => {
            if (active && ids.includes(job.id)) {
                setIsSaved(true);
            }
        });
        return () => {
            active = false;
        };
    }, [job.id]);

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const res = await fetch("/api/v1/auth/me", { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                const user = data.data?.user || data.data;
                if (user) {
                    // Call API to toggle save/unsave job
                    const saveRes = await fetch(`/api/v1/saved/jobs/${job.id}`, {
                        method: "POST",
                        credentials: "include"
                    });
                    if (saveRes.ok) {
                        setIsSaved(!isSaved);
                        toast.success(!isSaved ? "Đã lưu công việc thành công!" : "Đã bỏ lưu công việc!");
                    } else {
                        toast.error("Không thể lưu công việc. Vui lòng thử lại!");
                    }
                    return;
                }
            }
            router.push(`/auth/login?redirect=/jobs/${job.slug}`);
        } catch {
            router.push(`/auth/login?redirect=/jobs/${job.slug}`);
        }
    };

    const handleApplyClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const res = await fetch("/api/v1/auth/me", { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                const user = data.data?.user || data.data;
                if (user) {
                    router.push(`/jobs/${job.slug}`);
                    return;
                }
            }
            router.push(`/auth/login?redirect=/jobs/${job.slug}`);
        } catch {
            router.push(`/auth/login?redirect=/jobs/${job.slug}`);
        }
    };

    return (
        <Link
            href={`/jobs/${job.slug}`}
            className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-[#0891b2]/40 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between group overflow-hidden"
        >
            <div>
                <div className="flex justify-between items-center">
                    <div className={`w-9 h-9 rounded-lg ${job.uiLogoBg} flex items-center justify-center text-[12px] font-bold`}>
                        {job.companyLogo ? (
                            <img src={job.companyLogo} alt={job.companyName} className='w-full h-full object-cover' />
                        ) : (
                            <span className="text-xs font-bold">{job.companyInitials || "?"}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${job.uiTagStyle}`}>
                            {job.uiTagText}
                        </span>
                        {/* Fix lồng thẻ bấm bằng e.stopPropagation */}
                        <button
                            onClick={handleBookmark}
                            className={`${isSaved ? 'text-rose-500' : 'text-slate-300'} hover:text-rose-500 transition-colors p-1 rounded-md hover:bg-slate-50 relative z-10`}
                        >
                            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-rose-500' : ''}`} />
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

            {/* Hover Slide-up Overlay Button */}
            <div className="absolute bottom-0 left-0 w-full p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center border-t border-slate-100/50 z-20">
                <button
                    onClick={handleApplyClick}
                    className="w-full text-center bg-[#005a71] text-white text-[13px] font-bold py-2.5 rounded-xl hover:bg-[#004d62] transition-colors shadow-md block cursor-pointer"
                >
                    Ứng tuyển ngay
                </button>
            </div>
        </Link>
    );
}