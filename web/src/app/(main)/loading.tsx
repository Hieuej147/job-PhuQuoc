import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="bg-linear-to-br from-[#0E7490] via-[#0D9488] to-[#005a71]">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Skeleton className="mb-3 h-12 w-3/4 bg-white/20 md:w-1/2" />
            <Skeleton className="h-6 w-1/2 bg-white/20 md:w-1/3" />
          </div>

          <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl md:flex-row">
            <Skeleton className="h-14 flex-1 rounded-xl bg-slate-100 dark:bg-slate-800/80" />
            <Skeleton className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/80 md:w-48" />
            <Skeleton className="h-14 rounded-xl bg-[#F59E0B]/40 md:w-32" />
          </div>

          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-3">
            <Skeleton className="h-9 w-28 rounded-full bg-white/20" />
            <Skeleton className="h-9 w-28 rounded-full bg-white/20" />
            <Skeleton className="h-9 w-24 rounded-full bg-white/20" />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-6">
            <Skeleton className="h-11 w-full rounded-2xl" />

            <div className="flex gap-2 overflow-hidden">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-24 rounded-full" />
              ))}
            </div>

            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[#E0F5FB] bg-white p-5 shadow-sm dark:border-[#1a3d5c] dark:bg-[#0d2137]"
                >
                  <div className="flex gap-4">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </aside>
        </div>
      </main>
    </div>
  );
}
