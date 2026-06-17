"use client";

import React from "react";
import { Briefcase, Building, Users } from "lucide-react";
import SearchBar from "@/components/common/SearchBar";

export default function HomeHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-x-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYSU3FOe5mZrMKWgfR44oj-alWSbbAxfoAopzwGpoOarw-9SlxelIdcsiyAdR4h9GsPw8BNgmp2T3uWGwD2a8zDm3csY4PbhC_-e8Ho-zZ-joRZcT_L8YMsNAFA3GD3XTEIaH-xLV3XZqX_0vReIlroKLFM1SRDQM-z6A6MtULtKZ9-Pts-HDGmgNtdNVB1SNaikJSv7puiBuNLCwlpqa9NRrFzMA3QbSirWSZ_R7A74OH_zrHTA-TPI4us9uGOeHfyr2idHaiP_Y"
          alt="Tropical island resort"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-[#0C2231]/75 via-[#0C2231]/55 to-[#0C2231]/45" />
      </div>
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 md:px-8 text-center mt-8">
        <h1 className="text-[28px] md:text-[48px] font-bold text-white mb-5 drop-shadow-lg leading-tight tracking-tight fade-up">
          Tìm việc làm tại đảo ngọc Phú Quốc
        </h1>
        <p className="text-[15px] md:text-[18px] font-normal text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-md fade-up stagger-1">
          Hàng trăm cơ hội tại resort, nhà hàng, du lịch &amp; nhiều lĩnh vực
          khác
        </p>
        <div className="w-full fade-up stagger-2">
          <SearchBar />
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-white fade-up stagger-3">
          <div className="flex items-center gap-2 bg-black/25 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-[13px] font-medium">
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <span>1,200+ Việc làm</span>
          </div>
          <div className="flex items-center gap-2 bg-black/25 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-[13px] font-medium">
            <Building className="w-4 h-4 text-cyan-400" />
            <span>300+ Công ty</span>
          </div>
          <div className="flex items-center gap-2 bg-black/25 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-[13px] font-medium">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>5,000+ Ứng viên</span>
          </div>
        </div>
      </div>
    </section>
  );
}
