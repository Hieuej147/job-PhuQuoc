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
      // Khi đang chạy → ẩn hoàn toàn (AgentProgressBubble đã handle rồi)
      if (status === "inProgress") {
        return <></>;
      }

      // Khi xong → hiện JobListCard
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