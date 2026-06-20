import { Metadata } from "next";
import { localBusinessJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Liên Hệ | PQJobs",
  description: "Liên hệ với PQJobs để được hỗ trợ tuyển dụng và tìm việc làm tại Phú Quốc.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd()) }}
      />
      <div className="min-h-screen bg-[#f7f9ff] dark:bg-[#071a2b] text-slate-800 dark:text-[#e0f2fe] transition-colors">
        <section className="bg-gradient-to-r from-[#0E7490] to-[#0D9488] py-16 text-white text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Liên Hệ</h1>
          <p className="text-lg opacity-90">Chúng tôi sẵn sàng hỗ trợ bạn</p>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-white dark:bg-[#0F3347] shadow-sm">
                <h3 className="font-bold text-lg mb-2">Địa chỉ</h3>
                <p className="text-gray-600 dark:text-gray-400">Phú Quốc, Kiên Giang, Việt Nam</p>
              </div>
              <div className="p-6 rounded-xl bg-white dark:bg-[#0F3347] shadow-sm">
                <h3 className="font-bold text-lg mb-2">Email</h3>
                <p className="text-gray-600 dark:text-gray-400">contact@phuquoc.jobs</p>
              </div>
              <div className="p-6 rounded-xl bg-white dark:bg-[#0F3347] shadow-sm">
                <h3 className="font-bold text-lg mb-2">Hotline</h3>
                <p className="text-gray-600 dark:text-gray-400">+84 xxx xxx xxx</p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-[#0F3347] shadow-sm">
              <h3 className="font-bold text-lg mb-4">Gửi tin nhắn</h3>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Họ và tên"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:border-[#0E7490]"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:border-[#0E7490]"
                />
                <textarea
                  placeholder="Nội dung"
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:border-[#0E7490]"
                />
                <button
                  type="button"
                  className="w-full bg-[#0E7490] hover:bg-[#005a71] text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Gửi tin nhắn
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
