import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { getServerAuthUser } from "@/lib/server-auth";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#005a71",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "PQJobs | Tuyển Dụng & Việc Làm Phú Quốc Lương Cao 2026",
    template: "%s | PQJobs Phú Quốc",
  },
  description: "Nền tảng tìm việc làm hàng đầu tại đảo ngọc Phú Quốc. Hàng trăm việc làm resort 5 sao, nhà hàng, F&B, khách sạn du lịch tuyển dụng nhanh, ứng tuyển dễ dàng.",
  keywords: ["việc làm Phú Quốc", "tuyển dụng Phú Quốc", "tìm việc Phú Quốc", "resort Phú Quốc tuyển dụng", "khách sạn Phú Quốc tuyển dụng", "PQJobs"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pqjobs.vn"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "PQJobs | Tuyển Dụng & Việc Làm Phú Quốc Lương Cao 2026",
    description: "Nền tảng tìm việc làm hàng đầu tại Phú Quốc. Resort, khách sạn, nhà hàng tuyển dụng liên tục.",
    url: "/",
    siteName: "PQJobs Phú Quốc",
    images: [{ url: "https://images.unsplash.com/photo-1540206395-68808572332f?w=1200", width: 1200, height: 630, alt: "PQJobs Phú Quốc" }],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PQJobs | Tuyển Dụng & Việc Làm Phú Quốc Lương Cao 2026",
    description: "Tìm việc làm resort, nhà hàng, khách sạn uy tín lương cao tại Phú Quốc.",
    images: ["https://images.unsplash.com/photo-1540206395-68808572332f?w=1200"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
};

import HeaderGate from "@/components/common/HeaderGate";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const initialUser = await getServerAuthUser();

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary font-body">
        <Providers initialUser={initialUser} header={<HeaderGate />}>
          {children}
        </Providers>
      </body>
    </html>
  );
}