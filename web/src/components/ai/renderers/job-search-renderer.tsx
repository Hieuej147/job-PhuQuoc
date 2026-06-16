"use client";

import { useRenderTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { JobListCard } from "./job-list-card";

export function useJobSearchRenderer() {
  useRenderTool({
    name: "search_jobs",
    parameters: z.object({
      keyword: z.string(),
      location: z.string().optional(),
      min_salary: z.number().optional(),
      max_salary: z.number().optional(),
      limit: z.number().optional(),
    }),
    render: ({ status, result }) => {
      if (status === "inProgress") {
        return (
          <div className="my-3 p-4 bg-muted/50 rounded-xl border animate-pulse">
            <div className="flex items-center gap-2">
              <div className="size-4 rounded-full bg-muted-foreground/20 animate-spin border-2 border-muted-foreground/20 border-t-primary" />
              <span className="text-sm text-muted-foreground">Đang tìm việc làm...</span>
            </div>
          </div>
        );
      }
      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          return <JobListCard jobs={data.jobs || []} total={data.total || 0} />;
        } catch {
          return <></>;
        }
      }
      return <></>;
    },
  });
}
