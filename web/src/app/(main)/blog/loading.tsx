import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
      {/* 1. HERO FEATURED POST SKELETON */}
      <section className="bg-slate-50 dark:bg-[#0C2231] border-b border-[#E0F5FB] dark:border-[#1E5F74] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Image area */}
            <div className="lg:col-span-7 rounded-3xl overflow-hidden aspect-video relative">
              <Skeleton className="absolute inset-0 w-full h-full" />
            </div>
            {/* Text area */}
            <div className="lg:col-span-5 space-y-4">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex items-center gap-3 pt-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Filter Bar Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="overflow-x-auto w-full md:w-auto pb-2 scrollbar-hide">
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto shrink-0">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT: Blog Cards Grid Skeleton */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#0F3347] rounded-2xl border border-[#E0F5FB] dark:border-[#1E5F74] shadow-sm p-5 space-y-4 overflow-hidden flex flex-col h-full"
              >
                {/* Thumbnail area skeleton */}
                <div className="-mx-5 -mt-5 h-48 relative bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
                
                {/* Content */}
                <div className="space-y-3 flex-grow">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-5/6" />
                  <div className="space-y-1 pt-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                </div>

                {/* Meta bottom */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-7 h-7 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-2 w-12" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Sidebar Skeleton */}
          <aside className="w-full lg:w-72 shrink-0 space-y-6">
            {/* 1. Search block */}
            <div className="bg-white dark:bg-[#0F3347] rounded-2xl border border-[#E0F5FB] dark:border-[#1E5F74] p-5 space-y-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>

            {/* 2. Popular posts */}
            <div className="bg-white dark:bg-[#0F3347] rounded-2xl border border-[#E0F5FB] dark:border-[#1E5F74] p-5 space-y-4">
              <Skeleton className="h-5 w-36" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                  <div className="space-y-2 flex-grow">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>

            {/* 3. Categories list */}
            <div className="bg-white dark:bg-[#0F3347] rounded-2xl border border-[#E0F5FB] dark:border-[#1E5F74] p-5 space-y-3">
              <Skeleton className="h-5 w-24" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-8 rounded-full" />
                </div>
              ))}
            </div>

            {/* 4. Newsletter */}
            <div className="bg-white dark:bg-[#0F3347] rounded-2xl border border-[#E0F5FB] dark:border-[#1E5F74] p-5 space-y-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
