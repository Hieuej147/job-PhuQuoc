import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Hero Skeleton */}
      <section className="pt-16 bg-gradient-to-br from-[#0E7490] via-[#0D9488] to-[#005a71]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="text-center mb-8 flex flex-col items-center">
            {/* Title Skeleton */}
            <Skeleton className="h-10 w-3/4 md:w-1/2 bg-white/20 mb-3" />
            {/* Subtitle Skeleton */}
            <Skeleton className="h-6 w-1/2 md:w-1/3 bg-white/20" />
          </div>

          {/* Search box skeleton */}
          <div className="bg-white dark:bg-[#0f2436] rounded-2xl shadow-xl flex flex-col md:flex-row items-stretch overflow-hidden max-w-3xl mx-auto p-2 gap-2">
            <div className="flex-1 py-3 px-3">
              <Skeleton className="h-8 w-full bg-slate-100 dark:bg-slate-800/80" />
            </div>
            <div className="w-full md:w-48 py-3 px-3">
              <Skeleton className="h-8 w-full bg-slate-100 dark:bg-slate-800/80" />
            </div>
            <div className="py-2 px-2 md:w-32">
              <Skeleton className="h-10 w-full bg-[#F59E0B]/50" />
            </div>
          </div>

          {/* Stats Bar Skeleton */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Skeleton className="h-9 w-28 rounded-full bg-white/20" />
            <Skeleton className="h-9 w-28 rounded-full bg-white/20" />
          </div>
        </div>
        <div className="relative h-10 -mb-1">
          <svg
            viewBox="0 0 1440 40"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full h-full block"
            style={{ transform: "translateY(1px)" }}
          >
            <path
              d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Industry Tabs Skeleton */}
        <div className="overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        </div>

        {/* Sort Bar Skeleton */}
        <div className="bg-white dark:bg-[#0f2436] rounded-2xl border border-[#E0F5FB] dark:border-[#1e3a4f] px-5 py-3 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <Skeleton className="h-5 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </div>

        {/* Grid of Company Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="relative flex flex-col gap-4 bg-white dark:bg-[#0f2436] rounded-2xl border border-[#E0F5FB] dark:border-[#1e3a4f] shadow-sm p-5"
            >
              {/* Cover area skeleton */}
              <Skeleton className="h-20 -mx-5 -mt-5 rounded-t-2xl" />
              
              {/* Logo area */}
              <div className="-mt-12 relative z-10">
                <Skeleton className="w-14 h-14 rounded-xl border-2 border-white dark:border-[#1e3a4f]" />
              </div>

              {/* Title & Industry */}
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>

              {/* Badges */}
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>

              {/* Location and buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#bec8cd]/10">
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-16 rounded-lg" />
                  <Skeleton className="h-7 w-12 rounded-lg bg-[#005a71]/30" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
