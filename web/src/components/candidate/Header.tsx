"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, X, Moon, Info, RefreshCw, CheckCircle, Clock, ShieldAlert, MessageSquare } from "lucide-react";
import { mockHomeNotifications } from "@/mocks/mockData";

export default function Header() {
    const [isOpenMenu, setIsOpenMenu] = useState(false);
    const [showNoti, setShowNoti] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { label: "Trang chủ", href: "/Candidate" },
        { label: "Việc làm", href: "#" },
        { label: "Công ty", href: "##" },
        { label: "Blog", href: "/blog" },
    ];

    const unreadNotifications = mockHomeNotifications.filter(n => !n.isRead);
    const unreadCount = unreadNotifications.length;

    const renderNotiIcon = (iconName: string) => {
        switch (iconName) {
            case "description":
                return <RefreshCw className="w-4 h-4 text-blue-600" />;
            case "assignment_turned_in":
            case "verified":
            case "domain_verification":
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case "alarm":
                return <Clock className="w-4 h-4 text-rose-600" />;
            case "chat":
                return <MessageSquare className="w-4 h-4 text-amber-600" />;
            case "settings_suggest":
                return <Info className="w-4 h-4 text-slate-600" />;
            default:
                return <ShieldAlert className="w-4 h-4 text-indigo-600" />;
        }
    };

    return (
        <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between relative">

                {/* LOGO */}
                <Link href="/Candidate" className="flex items-center gap-0.5 text-[22px] font-black tracking-tight select-none">
                    <span className="text-[#f59e0b]">PQ</span>
                    <span className="text-[#0891b2]">Jobs</span>
                </Link>

                {/* MENU TRÊN PC */}
                <nav className="hidden md:flex items-center gap-8 text-[14px] font-semibold text-slate-600 h-full">
                    {navItems.map((item) => {
                        const isActive = item.href === "/Candidate"
                            ? pathname === "/Candidate"
                            : pathname.startsWith(item.href) && item.href !== "#" && item.href !== "##";

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`h-full flex items-center border-b-2 transition-all duration-150 ${isActive
                                    ? "text-[#0891b2] border-[#0891b2]"
                                    : "text-slate-600 border-transparent hover:text-[#0891b2]"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* ICON ĐIỀU KHIỂN & ĐĂNG NHẬP */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Chế độ tối */}
                    <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <Moon className="w-[18px] h-[18px]" />
                    </button>

                    {/* Chuông thông báo */}
                    <button
                        onClick={() => setShowNoti(!showNoti)}
                        className={`p-2 rounded-full transition-colors relative ${showNoti ? 'bg-slate-100 text-[#0891b2]' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <Bell className="w-[18px] h-[18px]" />
                        {unreadCount > 0 && (
                            <span className="absolute top-[9px] right-[9px] w-[7px] h-[7px] bg-[#ef4444] rounded-full border border-white animate-pulse" />
                        )}
                    </button>

                    {/* 🌟 FIX 1: Thay đổi nút Đăng nhập / Đăng ký trên PC sang thẻ Link nguyên bản thay vì bọc ngoài nút button */}
                    <div className="hidden md:flex items-center gap-2 text-[14px] font-semibold ml-1">
                        <Link href="/login" className="px-4 py-1.5 text-slate-700 hover:text-[#0891b2] border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all">
                            Đăng nhập
                        </Link>
                        <Link href="/register" className="px-[18px] py-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-white rounded-lg shadow-sm transition-colors">
                            Đăng ký
                        </Link>
                    </div>

                    {/* NÚT MENU HAMBURGER (Mobile) */}
                    <button
                        onClick={() => setIsOpenMenu(!isOpenMenu)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden transition-colors"
                    >
                        {isOpenMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    {/* DROPDOWN THÔNG BÁO */}
                    {showNoti && (
                        <div className="absolute right-2 sm:right-0 top-[52px] w-[calc(100vw-16px)] sm:w-[380px] bg-white rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.12)] border border-slate-100 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-[14px]">Thông báo</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{unreadCount} chưa đọc</p>
                                </div>
                                <button className="text-[11px] font-semibold text-[#0891b2] hover:underline">Đọc tất cả</button>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100/60">
                                {mockHomeNotifications.length === 0 ? (
                                    <div className="p-6 text-center text-[12px] text-slate-400">Không có thông báo nào</div>
                                ) : (
                                    mockHomeNotifications.map((noti) => (
                                        /* 🌟 FIX 2: Đổi thẻ <a> trong list thông báo sang dùng <Link> đúng chuẩn Next.js */
                                        <Link
                                            key={noti.id}
                                            href={noti.linkHref}
                                            onClick={() => setShowNoti(false)}
                                            className={`p-4 flex gap-3 items-start transition-colors cursor-pointer text-left ${!noti.isRead ? 'bg-[#f0f7ff]' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-[34px] h-[34px] rounded-full ${noti.uiColorClass} flex items-center justify-center shrink-0 mt-0.5`}>
                                                {renderNotiIcon(noti.uiIcon)}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <h5 className={`text-slate-800 text-[12px] leading-tight ${!noti.isRead ? 'font-bold' : 'font-semibold'}`}>
                                                    {noti.title}
                                                </h5>
                                                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal line-clamp-2">
                                                    {noti.content}
                                                </p>
                                                <span className="text-[10px] text-slate-400 mt-1 block">{noti.date}</span>
                                            </div>
                                            {!noti.isRead && (
                                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 self-center" />
                                            )}
                                        </Link>
                                    ))
                                )}
                            </div>

                            <div className="p-3 bg-white border-t border-slate-100 text-center">
                                <Link href="/notifications" onClick={() => setShowNoti(false)} className="text-[12px] font-bold text-[#0891b2] hover:text-[#06b6d4] transition-colors block w-full">
                                    Xem tất cả thông báo →
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MENU XỔ XUỐNG TRÊN MOBILE */}
            {isOpenMenu && (
                <div className="md:hidden bg-[#f8fafc] border-t border-slate-100 px-5 py-4 flex flex-col gap-4 shadow-inner">
                    <nav className="flex flex-col gap-2 text-[15px] font-semibold text-slate-600">
                        {navItems.map((item) => {
                            const isActive = item.href === "/Candidate"
                                ? pathname === "/Candidate"
                                : pathname.startsWith(item.href) && item.href !== "#" && item.href !== "##";

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpenMenu(false)} // Tự đóng menu khi bấm chuyển trang con
                                    className={`px-3 py-2 rounded-lg transition-colors ${isActive
                                        ? "text-[#025a70] bg-cyan-50/60"
                                        : "hover:text-[#0891b2] hover:bg-slate-100"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* 🌟 FIX 3: Loại bỏ hoàn toàn bọc <div> thừa thãi bên trong thẻ <Link>. Biến thẳng <Link> thành nút bấm bằng class CSS */}
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-200/60 w-full">
                        <Link
                            href="/login"
                            onClick={() => setIsOpenMenu(false)}
                            className="flex-1 text-center py-2.5 text-[14px] font-bold text-[#025a70] border-2 border-[#0891b2]/40 rounded-full bg-white hover:bg-slate-50 transition-all block"
                        >
                            Đăng nhập
                        </Link>

                        <Link
                            href="/register"
                            onClick={() => setIsOpenMenu(false)}
                            className="flex-1 text-center py-2.5 text-[14px] font-bold bg-[#f59e0b] text-white rounded-full hover:bg-[#d97706] shadow-sm transition-all block"
                        >
                            Đăng ký
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}