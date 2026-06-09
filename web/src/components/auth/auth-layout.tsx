"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import Header from "@/components/common/Header";

interface AuthLayoutProps {
  children: React.ReactNode;
  breadcrumb: { label: string; href?: string }[];
  maxWidth?: "md" | "lg";
  stepsGuide?: { n: number; label: string; sub: string }[];
  currentStep?: number;
}

export function AuthLayout({
  children,
  breadcrumb,
  maxWidth = "md",
  stepsGuide,
  currentStep,
}: AuthLayoutProps) {
  return (
    <>
      <Header />
      <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
        {/* LEFT: Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-10 overflow-y-auto">
          <div
            className={`w-full ${maxWidth === "lg" ? "max-w-lg" : "max-w-md"} flex flex-col gap-5`}
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground animate-in">
              {breadcrumb.map((item, i) => (
                <span key={i} className="contents">
                  {i > 0 && <span>›</span>}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-primary font-semibold">
                      {item.label}
                    </span>
                  )}
                </span>
              ))}
            </div>

            {children}
          </div>
        </div>

        {/* RIGHT: Decorative */}
        <DecorativeSidebar stepsGuide={stepsGuide} currentStep={currentStep} />
      </div>
    </>
  );
}

interface DecorativeSidebarProps {
  stats?: { value: string; label: string }[];
  features?: { title: string; sub: string }[];
  testimonial?: { quote: string; name: string; role: string; avatar: string };
  stepsGuide?: { n: number; label: string; sub: string }[];
  currentStep?: number;
}

export function DecorativeSidebar({
  stats,
  features,
  testimonial,
  stepsGuide,
  currentStep,
}: DecorativeSidebarProps) {
  const defaultStats = [
    { value: "1.2k+", label: "Việc làm" },
    { value: "300+", label: "Công ty" },
    { value: "5k+", label: "Ứng viên" },
  ];

  const defaultFeatures = [
    {
      title: "Việc làm địa phương Phú Quốc",
      sub: "100% việc làm tại đảo, cập nhật hàng ngày",
    },
    {
      title: "Ứng tuyển nhanh trong 1 phút",
      sub: "Tạo CV online, gửi đơn chỉ 1 click",
    },
    {
      title: "Thông báo việc mới qua Zalo/Email",
      sub: "Không bỏ lỡ cơ hội phù hợp với bạn",
    },
  ];

  const defaultTestimonial = {
    quote:
      "Nhờ PQJobs tôi tìm được việc lễ tân resort 5 sao chỉ sau 3 ngày đăng ký!",
    name: "Thanh Hà",
    role: "Lễ tân • Vinpearl Resort",
    avatar: "TH",
  };

  const statsData = stats || defaultStats;
  const featuresData = features || defaultFeatures;
  const testimonialData = testimonial || defaultTestimonial;

  return (
    <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden bg-gradient-to-br from-[#0E7490] via-[#0D9488] to-[#005a71] items-center justify-center">
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="grid-decor"
              x="0"
              y="0"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-decor)" />
        </svg>
      </div>
      <div className="absolute -top-32 -right-32 size-96 rounded-full bg-white/5" />
      <div className="absolute -bottom-24 -left-24 size-80 rounded-full bg-white/5" />
      <div className="relative z-10 text-white px-12 max-w-sm text-center flex flex-col gap-6">
        <div>
          <div className="text-5xl font-black mb-2">
            <span className="text-[#F59E0B]">PQ</span>Jobs
          </div>
          <p className="text-white/70 text-sm">Việc làm đảo ngọc Phú Quốc</p>
        </div>

        {/* Steps Guide (for register) */}
        {stepsGuide && (
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
            <p className="text-sm font-bold mb-4 text-[#F59E0B]">
              Đăng ký chỉ {stepsGuide.length} bước đơn giản
            </p>
            <div className="flex flex-col gap-3">
              {stepsGuide.map((s) => (
                <div key={s.n} className="flex items-center gap-3">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${s.n <= (currentStep || 0) ? "bg-[#F59E0B] text-[#0C2231]" : "bg-white/20 text-white"}`}
                  >
                    {s.n}
                  </div>
                  <div className="text-left">
                    <p
                      className={`text-sm font-semibold ${s.n <= (currentStep || 0) ? "text-white" : "text-white/70"}`}
                    >
                      {s.label}
                    </p>
                    <p
                      className={`text-xs ${s.n <= (currentStep || 0) ? "text-white/80" : "text-white/40"}`}
                    >
                      {s.sub}
                    </p>
                  </div>
                  <span
                    className={`ml-auto text-[18px] ${s.n < (currentStep || 0) ? "text-[#F59E0B]" : s.n === currentStep ? "text-[#F59E0B]" : "text-white/30"}`}
                  >
                    {s.n < (currentStep || 0)
                      ? "✓"
                      : s.n === currentStep
                        ? "◉"
                        : "○"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {statsData.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/20"
            >
              <p className="text-xl font-black text-[#F59E0B]">{stat.value}</p>
              <p className="text-xs text-white/70 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        {!stepsGuide && (
          <div className="flex flex-col gap-4 text-left">
            {featuresData.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="size-8 rounded-xl bg-[#F59E0B]/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="size-4 text-[#F59E0B]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-white/60 text-xs mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Testimonial */}
        {!stepsGuide && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 text-left">
            <p className="text-sm text-white/90 italic leading-relaxed mb-3">
              &ldquo;{testimonialData.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-[#F59E0B] flex items-center justify-center text-[#0C2231] font-black text-xs">
                {testimonialData.avatar}
              </div>
              <div>
                <p className="text-white text-xs font-semibold">
                  {testimonialData.name}
                </p>
                <p className="text-white/60 text-[11px]">
                  {testimonialData.role}
                </p>
              </div>
              <span className="ml-auto text-[#F59E0B] text-sm">★★★★★</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
