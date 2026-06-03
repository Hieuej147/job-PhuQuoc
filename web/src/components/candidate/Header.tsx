"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw, CheckCircle, Clock, ShieldAlert, MessageSquare, Info } from "lucide-react";
import { mockHomeNotifications } from "@/mocks/mockData";

export default function Header() {
    const [isOpenMenu, setIsOpenMenu] = useState(false);
    const [showNoti, setShowNoti] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    // Theo dõi scroll để thêm shadow
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const navItems = [
        { label: "Trang chủ", href: "/Candidate" },
        { label: "Việc làm", href: "/jobs" },
        { label: "Công ty", href: "/companies" },
        { label: "Blog", href: "/blog" },
    ];

    const unreadCount = mockHomeNotifications.filter((n) => !n.isRead).length;

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
        <>
            {/* Font Be Vietnam Pro */}
            <link
                href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
                rel="stylesheet"
            />

            <nav
                id="navbar"
                className={`fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md transition-all duration-300
                    ${scrolled ? "shadow-md shadow-[#005a71]/8 border-b border-slate-200/70" : "border-b border-transparent"}`}
                style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
            >
                <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-7xl mx-auto">

                    {/* LOGO */}
                    <Link href="/Candidate" className="flex items-center gap-0.5 text-[22px] font-bold tracking-tight select-none">
                        <span className="text-[#F59E0B]">PQ</span>
                        <span className="text-[#005a71]">Jobs</span>
                    </Link>

                    {/* NAV DESKTOP */}
                    <div className="hidden md:flex items-center gap-8 h-full">
                        {navItems.map((item) => {
                            const isActive =
                                item.href === "/Candidate"
                                    ? pathname === "/Candidate"
                                    : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`h-16 flex items-center border-b-2 text-[14px] font-semibold transition-all duration-150
                                        ${isActive
                                            ? "text-[#005a71] border-[#005a71] font-bold"
                                            : "text-slate-600 border-transparent hover:text-[#005a71]"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-1.5 relative">

                        {/* Notification bell */}
                        <button
                            id="notif-btn"
                            onClick={() => { setShowNoti(!showNoti); setIsOpenMenu(false); }}
                            title="Thông báo"
                            className={`relative p-2 rounded-full transition-colors
                                ${showNoti
                                    ? "bg-[#005a71]/10 text-[#005a71]"
                                    : "hover:bg-[#005a71]/8 text-slate-600"
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px] leading-none">notifications</span>
                            {unreadCount > 0 && (
                                <span className="absolute top-[9px] right-[9px] w-[7px] h-[7px] bg-red-500 rounded-full border border-white animate-pulse" />
                            )}
                        </button>

                        {/* Login / Register — Desktop */}
                        <div className="hidden md:flex items-center gap-2 ml-2">
                            <Link
                                href="/login"
                                className="px-4 py-[7px] text-[13px] font-semibold text-[#005a71]
                                    border border-[#005a71]/50 rounded-full
                                    hover:bg-[#005a71]/5 transition-colors"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                href="/register"
                                className="px-5 py-[7px] text-[13px] font-semibold bg-[#F59E0B] hover:bg-[#D97706]
                                    text-white rounded-full shadow-md transition-colors"
                            >
                                Đăng ký
                            </Link>
                        </div>

                        {/* Hamburger — Mobile */}
                        <button
                            onClick={() => { setIsOpenMenu(!isOpenMenu); setShowNoti(false); }}
                            className="p-2 md:hidden text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-[22px] leading-none">
                                {isOpenMenu ? "close" : "menu"}
                            </span>
                        </button>

                        {/* DROPDOWN THÔNG BÁO */}
                        {showNoti && (
                            <div className="absolute right-0 top-[52px] w-[calc(100vw-16px)] sm:w-[380px]
                                bg-white rounded-2xl
                                shadow-[0_12px_40px_rgba(0,0,0,0.12)]
                                border border-slate-100 z-50 overflow-hidden flex flex-col
                                animate-in fade-in slide-in-from-top-2 duration-150">

                                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                    <div>
                                        <p className="font-semibold text-slate-900 text-[14px]">Thông báo</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{unreadCount} chưa đọc</p>
                                    </div>
                                    <button className="text-[12px] font-semibold text-[#005a71] hover:opacity-75 transition-opacity">
                                        Đọc tất cả
                                    </button>
                                </div>

                                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100/60">
                                    {mockHomeNotifications.length === 0 ? (
                                        <div className="p-6 text-center text-[12px] text-slate-400">
                                            Không có thông báo nào
                                        </div>
                                    ) : (
                                        mockHomeNotifications.map((noti) => (
                                            <Link
                                                key={noti.id}
                                                href={noti.linkHref}
                                                onClick={() => setShowNoti(false)}
                                                className={`p-4 flex gap-3 items-start transition-colors cursor-pointer text-left
                                                    ${!noti.isRead ? "bg-blue-50/60" : "hover:bg-slate-50"}`}
                                            >
                                                <div className={`w-[34px] h-[34px] rounded-full ${noti.uiColorClass} flex items-center justify-center shrink-0 mt-0.5`}>
                                                    {renderNotiIcon(noti.uiIcon)}
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <h5 className={`text-slate-800 text-[12px] leading-tight ${!noti.isRead ? "font-bold" : "font-semibold"}`}>
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

                                <div className="px-4 py-3 border-t border-slate-100 text-center bg-white">
                                    <Link
                                        href="/notifications"
                                        onClick={() => setShowNoti(false)}
                                        className="text-[12px] font-bold text-[#005a71] hover:opacity-75 transition-opacity"
                                    >
                                        Xem tất cả thông báo →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* MOBILE MENU */}
                {isOpenMenu && (
                    <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 flex flex-col gap-3 shadow-inner">
                        <nav className="flex flex-col gap-1">
                            {navItems.map((item) => {
                                const isActive =
                                    item.href === "/Candidate"
                                        ? pathname === "/Candidate"
                                        : pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpenMenu(false)}
                                        className={`px-3 py-2.5 rounded-lg text-[14px] font-semibold transition-colors
                                            ${isActive
                                                ? "text-[#005a71] bg-[#005a71]/8 font-bold"
                                                : "text-slate-600 hover:text-[#005a71] hover:bg-slate-50"
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="flex gap-3 pt-2 border-t border-slate-200/60 w-full">
                            <Link
                                href="/login"
                                onClick={() => setIsOpenMenu(false)}
                                className="flex-1 text-center py-2.5 text-[14px] font-bold
                                    text-[#005a71] border-2 border-[#005a71]/40
                                    rounded-full hover:bg-slate-50 transition-all"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                href="/register"
                                onClick={() => setIsOpenMenu(false)}
                                className="flex-1 text-center py-2.5 text-[14px] font-bold
                                    bg-[#F59E0B] hover:bg-[#D97706] text-white
                                    rounded-full shadow-sm transition-all"
                            >
                                Đăng ký
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Spacer tránh content bị che bởi fixed header */}
            <div className="h-16" />
        </>
    );
}