import { CopilotRuntime } from "@copilotkit/runtime";
import { createCopilotHonoHandler } from "@copilotkit/runtime/v2/hono";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";
import { handle } from "hono/vercel";
import { NextRequest } from "next/server";

const agentUrl = process.env.AGENT_URL || "http://localhost:8125";

const runtime = new CopilotRuntime({
  agents: {
    default: new LangGraphHttpAgent({ url: agentUrl }),
    candidate: new LangGraphHttpAgent({ url: `${agentUrl}/candidate` }),
    recruiter: new LangGraphHttpAgent({ url: `${agentUrl}/recruiter` }),
  },
});

const app = createCopilotHonoHandler({
  runtime: runtime.instance,
  basePath: "/api/copilotkit",
  cors: {
    origin: "*",
    credentials: true,
  },
  hooks: {
    onRequest: async ({ request }) => {
      const cookie = request.headers.get("cookie");

      if (!cookie || request.method !== "POST") return request;

      try {
        const body = await request.clone().json();

        // CopilotKit v2 sends forwardedProps directly in body
        if (body.forwardedProps !== undefined || body.tools !== undefined) {
          body.forwardedProps = {
            ...body.forwardedProps,
            cookie,
          };

          return new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(body),
          });
        }
      } catch {
        // ignore parse errors
      }
      return request;
    },
  },
});

const handler = handle(app);

export const POST = async (req: NextRequest) => handler(req);
export const GET = async (req: NextRequest) => handler(req);
