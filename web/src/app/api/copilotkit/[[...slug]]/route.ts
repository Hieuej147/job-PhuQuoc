import { CopilotKitIntelligence, CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotHonoHandler } from "@copilotkit/runtime/v2/hono";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";
import { handle } from "hono/vercel";
import { NextRequest } from "next/server";
import type { AuthUser } from "@/lib/auth";

const agentUrl = process.env.AGENT_URL || "http://localhost:8125";
const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

const intelligence =
  process.env.COPILOTKIT_INTELLIGENCE_API_KEY &&
    process.env.COPILOTKIT_INTELLIGENCE_API_URL &&
    process.env.COPILOTKIT_INTELLIGENCE_WS_URL
    ? new CopilotKitIntelligence({
      apiKey: process.env.COPILOTKIT_INTELLIGENCE_API_KEY,
      apiUrl: process.env.COPILOTKIT_INTELLIGENCE_API_URL,
      wsUrl: process.env.COPILOTKIT_INTELLIGENCE_WS_URL,
    })
    : undefined;

async function getUserFromCookie(cookie: string | null): Promise<AuthUser | null> {
  if (!cookie) return null;

  const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const payload = await response.json().catch(() => null);
  return payload?.data?.user || payload?.user || null;
}

const agents = {
  default: new LangGraphHttpAgent({ url: agentUrl }),
  candidate: new LangGraphHttpAgent({ url: `${agentUrl}/candidate` }),
  "candidate-job-agent": new LangGraphHttpAgent({ url: `${agentUrl}/candidate/job` }),
  "candidate-cv-agent": new LangGraphHttpAgent({ url: `${agentUrl}/candidate/cv` }),
  "candidate-advisor-agent": new LangGraphHttpAgent({ url: `${agentUrl}/candidate/advisor` }),
  recruiter: new LangGraphHttpAgent({ url: `${agentUrl}/recruiter` }),
};

const runtime = intelligence
  ? new CopilotRuntime({
    agents,
    intelligence,
    identifyUser: async (request: Request) => {
      const user = await getUserFromCookie(request.headers.get("cookie"));

      if (!user) {
        throw new Response("Unauthorized", { status: 401 });
      }

      return { id: user.id, name: user.name };
    },
  })
  : new CopilotRuntime({ agents });

const app = createCopilotHonoHandler({
  runtime,
  basePath: "/api/copilotkit",
  cors: {
    origin: "*",
    credentials: true,
  },
  hooks: {
    onBeforeHandler: async ({ request, route }) => {
      if (!intelligence || route.method === "info" || route.method === "cpk-debug-events") return;

      const user = await getUserFromCookie(request.headers.get("cookie"));
      if (!user) {
        throw new Response("Unauthorized", { status: 401 });
      }
    },
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
