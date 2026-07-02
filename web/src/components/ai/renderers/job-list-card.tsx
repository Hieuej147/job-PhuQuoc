"use client";

import Link from "next/link";
import { Briefcase, MapPin, DollarSign, Clock } from "lucide-react";

interface Job {
  id: string;
  slug: string;
  title: string;
  company: string;
  salary: string;
  location?: string;
  type?: string;
}

interface JobListCardProps {
  jobs: Job[];
  total: number;
}

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  REMOTE: "Remote",
  CONTRACT: "Hợp đồng",
  INTERNSHIP: "Thực tập",
  FREELANCE: "Freelance",
};

export function JobListCard({ jobs, total }: JobListCardProps) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="my-3 p-4 bg-muted/50 rounded-xl border">
        <p className="text-sm text-muted-foreground">Không tìm thấy việc làm phù hợp.</p>
      </div>
    );
  }

  return (
    <div className="my-3 space-y-2">
      <p className="text-xs text-muted-foreground px-1">
        Tìm thấy <span className="font-semibold text-foreground">{total}</span> việc làm
      </p>
      {jobs.map((job) => (
        <Link
          key={job.id}
          href={`/jobs/${job.slug || job.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{job.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
            </div>
            {job.type && (
              <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {TYPE_LABELS[job.type] || job.type}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {job.salary && job.salary !== "?-?" && (
              <span className="flex items-center gap-1">
                <DollarSign className="size-3" />
                {job.salary}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {job.location}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
