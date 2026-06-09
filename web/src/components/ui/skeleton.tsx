import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: { className?: string; [key: string]: unknown }) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-accent", className)}
      {...(props as React.HTMLAttributes<HTMLDivElement>)}
    />
  )
}

export { Skeleton }
