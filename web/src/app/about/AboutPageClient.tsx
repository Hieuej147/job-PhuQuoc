"use client";

import { useEffect, useRef } from "react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

function useScrollFadeUp() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const elements = containerRef.current?.querySelectorAll(".fade-up");
        if (!elements) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                    }
                });
            },
            { threshold: 0.1 }
        );

        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return containerRef;
}

interface AboutPageClientProps {
    companiesTotal: number;
    jobsTotal: number;
}

export default function AboutPageClient({ companiesTotal, jobsTotal }: AboutPageClientProps) {
    const containerRef = useScrollFadeUp();

    return (
        <div
            ref={containerRef}
            className="bg-[#f7f9ff] dark:bg-[#071e2e] text-[#001e30] dark:text-[#E0F2FE] antialiased overflow-x-hidden"
        >
            <Header />

            {/* HERO SECTION */}
            <section className="pt-28 pb-16 bg-gradient-to-br from-[#0E7490] via-[#0D9488] to-[#005a71] text-white relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle at 20% 50%, #67e8f9 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fcd34d 0%, transparent 40%)",
                    }}
                />
                <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 fade-up">Về PQJobs</h1>
                    <p className="text-lg max-w-2xl mx-auto opacity-90 fade-up stagger-1">
                        Nền tảng tuyển dụng chuyên biệt dành riêng cho đảo ngọc Phú Quốc. Chúng tôi kết nối nhân tài bản địa
                        và ứng viên chất lượng cao với các cơ hội việc làm tốt nhất tại các resort và doanh nghiệp hàng đầu.
                    </p>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="-mt-8 max-w-5xl mx-auto px-4 relative z-20">
                <div className="bg-white dark:bg-[#0F3347] rounded-3xl border border-[#E0F5FB] dark:border-[#1E5F74] shadow-xl p-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                    <div className="fade-up stagger-1">
                        <p className="text-3xl md:text-5xl font-black text-[#F59E0B] dark:text-[#FCD34D]">
                            {companiesTotal > 0 ? `${companiesTotal}+` : "—"}
                        </p>
                        <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] font-bold uppercase tracking-wider mt-1">
                            Đối tác doanh nghiệp
                        </p>
                    </div>
                    <div className="border-t sm:border-t-0 sm:border-x border-[#bec8cd]/20 py-4 sm:py-0 fade-up stagger-2">
                        <p className="text-3xl md:text-5xl font-black text-[#005a71] dark:text-[#67E8F9]">5,000+</p>
                        <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] font-bold uppercase tracking-wider mt-1">
                            Ứng viên đăng ký
                        </p>
                    </div>
                    <div className="fade-up stagger-3">
                        <p className="text-3xl md:text-5xl font-black text-[#0D9488]">
                            {jobsTotal > 0 ? `${jobsTotal}+` : "—"}
                        </p>
                        <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] font-bold uppercase tracking-wider mt-1">
                            Việc làm đã kết nối
                        </p>
                    </div>
                </div>
            </section>

            {/* CORE MISSION & VISION */}
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-16 space-y-20">

                {/* Story Section */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 fade-up">
                        <h2 className="text-3xl font-bold text-[#005a71] dark:text-[#67E8F9]">Sứ mệnh của chúng tôi</h2>
                        <p className="text-[#3f484c] dark:text-[#CBD5E1] leading-relaxed">
                            Phú Quốc đang vươn mình mạnh mẽ để trở thành trung tâm du lịch nghỉ dưỡng mang tầm quốc tế. Đi đôi
                            với sự phát triển thần tốc của cơ sở hạ tầng và dịch vụ là nhu cầu khổng lồ về nhân sự chất lượng
                            cao, đặc biệt là trong ngành Hospitality (Resort, Khách sạn, Nhà hàng).
                        </p>
                        <p className="text-[#3f484c] dark:text-[#CBD5E1] leading-relaxed">
                            Được thành lập với tầm nhìn giải quyết bài toán nhân sự tại địa phương, <strong>PQJobs</strong> đóng
                            vai trò cầu nối chuyên nghiệp giúp các resort 5 sao và doanh nghiệp tiếp cận nguồn nhân lực phù hợp
                            một cách nhanh chóng, đồng thời giúp các bạn trẻ xây dựng sự nghiệp vững chắc ngay trên đảo Ngọc.
                        </p>
                    </div>
                    <div className="bg-gradient-to-tr from-[#005a71]/10 to-[#0D9488]/15 rounded-3xl p-8 border border-[#005a71]/10 flex flex-col justify-center gap-6 min-h-[300px] shadow-sm fade-up stagger-1">
                        <div className="flex items-start gap-4">
                            <span className="material-symbols-outlined text-3xl text-[#F59E0B] p-3 bg-white dark:bg-[#0C2231] rounded-2xl shadow-sm">
                                verified
                            </span>
                            <div>
                                <h3 className="font-bold text-lg text-[#005a71] dark:text-[#67E8F9] mb-1">Chất lượng hàng đầu</h3>
                                <p className="text-sm text-[#3f484c] dark:text-[#94A3B8]">
                                    Mọi tin tuyển dụng và hồ sơ ứng viên đều được đội ngũ kiểm duyệt kỹ lưỡng để đảm bảo tính xác thực.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <span className="material-symbols-outlined text-3xl text-[#005a71] dark:text-[#67E8F9] p-3 bg-white dark:bg-[#0C2231] rounded-2xl shadow-sm">
                                local_mall
                            </span>
                            <div>
                                <h3 className="font-bold text-lg text-[#005a71] dark:text-[#67E8F9] mb-1">Am hiểu bản địa</h3>
                                <p className="text-sm text-[#3f484c] dark:text-[#94A3B8]">
                                    Chúng tôi thấu hiểu đặc thù địa bàn và thói quen tuyển dụng nghỉ dưỡng tại Phú Quốc.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Values Section */}
                <section className="space-y-10">
                    <h2 className="text-3xl font-bold text-center text-[#005a71] dark:text-[#67E8F9] fade-up">Giá trị cốt lõi</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: "favorite", color: "text-[#0D9488]", title: "Tận tâm phục vụ", desc: "Chúng tôi luôn lấy khách hàng (nhà tuyển dụng và ứng viên) làm trọng tâm trong mọi hoạt động.", stagger: "stagger-1" },
                            { icon: "handshake", color: "text-[#F59E0B]", title: "Tin cậy & Minh bạch", desc: "Đảm bảo bảo mật thông tin tối đa và minh bạch trong mọi dịch vụ cung cấp.", stagger: "stagger-2" },
                            { icon: "psychology", color: "text-indigo-500", title: "Không ngừng cải tiến", desc: "Ứng dụng công nghệ thông minh để tối ưu hóa quy trình kết nối và tạo CV online.", stagger: "stagger-3" },
                            { icon: "forest", color: "text-emerald-500", title: "Đồng hành bền vững", desc: "Góp phần thúc đẩy chất lượng nguồn lao động, hướng đến sự phát triển lâu dài của đảo Ngọc.", stagger: "stagger-4" },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className={`bg-white dark:bg-[#0F3347] border border-[#E0F5FB] dark:border-[#1E5F74] rounded-2xl p-6 hover:shadow-md transition-shadow fade-up ${item.stagger}`}
                            >
                                <span className={`material-symbols-outlined text-4xl ${item.color} mb-4`}>{item.icon}</span>
                                <h3 className="font-bold text-base text-[#005a71] dark:text-[#67E8F9] mb-2">{item.title}</h3>
                                <p className="text-xs text-[#3f484c] dark:text-[#94A3B8] leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="rounded-3xl bg-gradient-to-r from-[#0E7490] to-[#0D9488] p-10 flex flex-col md:flex-row items-center justify-between gap-8 fade-up">
                    <div className="text-white text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">Sẵn sàng để bứt phá sự nghiệp?</h2>
                        <p className="text-white/80 max-w-lg">
                            Tạo hồ sơ chuyên nghiệp của bạn hoàn toàn miễn phí và ứng tuyển ngay hôm nay.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                        <a href="/auth/register" className="px-8 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold rounded-full transition-colors shadow-lg text-center">Tạo tài khoản ngay</a>
                        <a href="/jobs" className="px-8 py-3.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-full transition-colors border border-white/30 text-center">Tìm việc làm</a>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}