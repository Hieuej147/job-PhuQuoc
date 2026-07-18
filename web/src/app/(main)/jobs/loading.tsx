import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="bg-linear-to-b from-[#0E7490] to-[#0D9488] dark:from-[#002d3d] dark:to-[#003d38]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
          <Skeleton className="mx-auto h-8 w-72 bg-white/20" />
          <Skeleton className="mx-auto mt-3 h-5 w-96 bg-white/20" />

          <div className="mx-auto mt-6 flex max-w-5xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl md:flex-row">
            <Skeleton className="h-14 flex-1 rounded-xl bg-slate-100 dark:bg-slate-800/80" />
            <Skeleton className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/80 md:w-48" />
            <Skeleton className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/80 md:w-44" />
            <Skeleton className="h-14 rounded-xl bg-[#F59E0B]/40 md:w-32" />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Skeleton className="h-9 w-28 rounded-full bg-white/20" />
            <Skeleton className="h-9 w-28 rounded-full bg-white/20" />
            <Skeleton className="h-9 w-28 rounded-full bg-white/20" />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-14 rounded-2xl" />

          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
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
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
