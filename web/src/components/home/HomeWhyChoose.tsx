"use client";

import React from "react";
import { Target, Zap, Bell } from "lucide-react";

export default function HomeWhyChoose() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-r from-[#0E7490] to-[#0D9488]" />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white,transparent)]" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center text-white">
          <div className="fade-up stagger-1">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <Target className="w-7 h-7 text-[#FCD34D]" />
            </div>
            <h3 className="text-[20px] font-bold mb-3">
              Việc làm địa phương chính xác
            </h3>
            <p className="text-white/85 text-[15px] leading-relaxed">
              Hệ thống tập trung 100% vào thị trường việc làm tại Phú Quốc,
              mang đến cơ hội sát thực tế nhất.
            </p>
          </div>
          <div className="fade-up stagger-2">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <Zap className="w-7 h-7 text-[#FCD34D]" />
            </div>
            <h3 className="text-[20px] font-bold mb-3">
              Ứng tuyển nhanh trong 1 phút
            </h3>
            <p className="text-white/85 text-[15px] leading-relaxed">
              Tạo hồ sơ trực tuyến đơn giản và gửi đến nhà tuyển dụng chỉ với
              một cú click chuột.
            </p>
          </div>
          <div className="fade-up stagger-3">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <Bell className="w-7 h-7 text-[#FCD34D]" />
            </div>
            <h3 className="text-[20px] font-bold mb-3">
              Thông báo việc làm mới
            </h3>
            <p className="text-white/85 text-[15px] leading-relaxed">
              Nhận thông báo ngay lập tức qua email/Zalo khi có công việc phù
              hợp với tiêu chí của bạn.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
