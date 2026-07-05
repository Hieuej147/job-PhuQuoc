import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f7f9ff] text-[#001e30] dark:bg-[#071a2b] dark:text-[#e0f2fe] font-sans antialiased overflow-x-hidden pb-16">
      {/* HERO BANNER SKELETON */}
      <div className="bg-gradient-to-br from-[#004d62] via-[#0e7490] to-[#0d9488] dark:from-[#001522] dark:via-[#00293a] dark:to-[#002e2a] py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
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

      {/* CONTENT SKELETON */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: TOC Sidebar Skeleton */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </aside>

          {/* MIDDLE: Article content mock */}
          <article className="lg:col-span-6 bg-white dark:bg-[#0F3347] rounded-3xl p-6 md:p-8 border border-[#E0F5FB] dark:border-[#1E5F74] space-y-6">
            {/* Thumbnail skeleton */}
            <Skeleton className="w-full aspect-video rounded-2xl" />

            {/* Paragraph lines */}
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Skeleton className="h-6 w-2/3" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </article>

          {/* RIGHT: Article Sidebar Skeleton */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-[#0F3347] rounded-2xl p-5 border border-[#E0F5FB] dark:border-[#1E5F74] space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                    <div className="space-y-2 flex-grow">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
