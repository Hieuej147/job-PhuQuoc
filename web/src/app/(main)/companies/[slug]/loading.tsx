import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="bg-[#f7f9ff] dark:bg-[#0a1929] min-h-screen">
      {/* HERO BANNER SKELETON */}
      <div>
        <div className="h-52 md:h-64 relative overflow-hidden bg-gradient-to-br from-[#0E7490] to-[#0D9488] opacity-80 animate-pulse">
          <div className="absolute top-4 left-4 md:left-8 flex items-center gap-2 text-xs text-white/50">
            <Skeleton className="h-3 w-12 bg-white/20" /><span>›</span>
            <Skeleton className="h-3 w-12 bg-white/20" /><span>›</span>
            <Skeleton className="h-3 w-20 bg-white/20" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f7f9ff] dark:from-[#0a1929] to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-end gap-4">
              {/* Logo */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-xl border-2 border-white dark:border-[#1e3a4f] bg-white dark:bg-[#0f2436] shrink-0 p-1 flex items-center justify-center">
                <Skeleton className="w-full h-full rounded-xl" />
              </div>
              <div className="pb-1 space-y-2">
                <Skeleton className="h-7 w-48 md:w-64" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#0f2436] border border-[#E0F5FB] dark:border-[#1e3a4f] rounded-[0.875rem] p-5 flex flex-col items-center justify-center space-y-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-2 pb-1">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>
      </div>

      {/* CONTENT SKELETON */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-[#0f2436] border border-[#E0F5FB] dark:border-[#1e3a4f] rounded-2xl p-6 space-y-4">
              <Skeleton className="h-6 w-36" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-5">
            <div className="bg-white dark:bg-[#0f2436] border border-[#E0F5FB] dark:border-[#1e3a4f] rounded-2xl p-5 space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-5 h-5 rounded-full mt-0.5" />
                    <div className="space-y-1.5 flex-grow">
                      <Skeleton className="h-2 w-10" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
