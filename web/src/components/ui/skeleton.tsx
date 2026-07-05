import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: { className?: string; [key: string]: unknown }) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-800/70", className)}
      {...(props as React.HTMLAttributes<HTMLDivElement>)}
    />
  )
}

export { Skeleton }
