import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f7f9ff] text-[#001e30] dark:bg-[#071a2b] dark:text-[#e0f2fe] font-sans antialiased overflow-x-hidden pb-16">
      {/* HERO BANNER SKELETON */}
      <div className="bg-gradient-to-br from-[#004d62] via-[#0e7490] to-[#0d9488] dark:from-[#001522] dark:via-[#00293a] dark:to-[#002e2a] py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-3 space-y-6">
              {/* Breadcrumb Skeleton */}
              <div className="flex gap-2">
                <Skeleton className="h-4 w-16 bg-white/20" />
                <Skeleton className="h-4 w-12 bg-white/20" />
                <Skeleton className="h-4 w-24 bg-white/20" />
              </div>

              {/* Category Badge Skeleton */}
              <Skeleton className="h-7 w-28 rounded-full bg-white/20" />

              {/* Title Skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-10 w-full md:w-3/4 bg-white/20" />
                <Skeleton className="h-10 w-2/3 bg-white/20" />
              </div>

              {/* Excerpt Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full md:w-1/2 bg-white/20" />
                <Skeleton className="h-4 w-5/6 md:w-1/3 bg-white/20" />
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full bg-white/20" />
                <Skeleton className="h-4 w-24 bg-white/20" />
                <Skeleton className="h-4 w-24 bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SKELETON */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
          {/* LEFT: Article Body Skeleton (3/4 width) */}
          <div className="lg:col-span-3 space-y-8">
            <article className="space-y-6">
              {/* Paragraph 1 */}
              <div className="space-y-3">
                <Skeleton className="h-7 w-2/5" />
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>

              {/* Paragraph 2 */}
              <div className="space-y-3">
                <Skeleton className="h-7 w-1/3" />
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>

              {/* Paragraph 3 */}
              <div className="space-y-3">
                <Skeleton className="h-7 w-1/2" />
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </article>

            {/* Related Blogs Skeleton */}
            <div className="mt-12 pt-6 border-t border-[#e0f5fb] dark:border-[#1a3d5c]">
              <Skeleton className="h-6 w-48 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="border border-[#e0f5fb] dark:border-[#1a3d5c] bg-white dark:bg-[#0d2137] rounded-2xl overflow-hidden shadow-sm">
                    <Skeleton className="h-36 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Article Sidebar Skeleton (1/4 width) */}
          <div className="space-y-5 lg:col-span-1">
            {/* TOC Skeleton */}
            <div className="bg-white dark:bg-[#0d2137] rounded-2xl border border-[#e0f5fb] dark:border-[#1a3d5c] p-5 shadow-sm space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="border-t border-[#e0f5fb] dark:border-[#1a3d5c] pt-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>

            {/* CTA Find Jobs Skeleton */}
            <div className="bg-gradient-to-br from-[#004d62] to-[#0d9488] dark:from-[#001522] dark:to-[#002e2a] rounded-2xl p-5 shadow-sm flex flex-col items-center space-y-3">
              <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
              <Skeleton className="h-4 w-36 bg-white/20" />
              <Skeleton className="h-3 w-28 bg-white/20" />
              <Skeleton className="h-9 w-full bg-white/20 rounded-xl" />
            </div>

            {/* Newsletter Skeleton */}
            <div className="bg-white dark:bg-[#0d2137] border border-[#e0f5fb] dark:border-[#1a3d5c] rounded-2xl p-5 shadow-sm space-y-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

