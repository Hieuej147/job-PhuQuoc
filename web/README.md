# PQJobs Web

Next.js frontend cho PQJobs, bao gồm public website, candidate/employer dashboard và AI chat/CopilotKit integration.

## Runtime hiện tại

| Thành phần | Vai trò | Local |
|---|---|---|
| Next.js | UI, SSR public pages, dashboard CSR, AI BFF routes | `http://localhost:3001` |
| Nginx | Backend reverse proxy cho browser | `http://localhost` |
| NestJS | REST/Auth/SSE/Socket.IO backend | internal `http://localhost:3006` |
| Python Agent | FastAPI/LangGraph agent | `http://localhost:8125` |

Browser-side REST/Auth/SSE/Socket.IO gọi qua Nginx:

- `/api/v1/*` -> NestJS REST.
- `/api/auth/*` -> Better Auth trên NestJS.
- `/api/v1/realtime/events` -> SSE notification/dashboard.
- `/socket.io/*` -> Socket.IO application chat.

Next.js chỉ giữ server routes cho AI:

- `/api/copilotkit/*`
- `/api/agent/*`

## Frontend structure

```txt
web/src/
  app/                  Next.js App Router pages, layouts, loading states, AI routes
  components/           Shared and legacy domain UI components
  components/ui/        shadcn/ui primitives
  features/             Domain API clients, hooks, types, utils
  lib/                  Core shared helpers such as api-client and auth helpers
  hooks/                Small global/UI hooks
  types/                Shared cross-app types
```

Public `/jobs` and `/companies` use SSR initial data. Search/filter/sort/pagination transitions show shadcn `Skeleton` placeholders and render cards only after the new data is ready.

## Realtime

- `features/realtime/realtime-provider.tsx` opens SSE `GET /api/v1/realtime/events` for notification and dashboard cache updates.
- `features/realtime/use-application-chat-realtime.ts` opens Socket.IO namespace `/realtime` only while an application chat dialog is open.
- REST API and TanStack Query remain the source of truth; realtime events only update or invalidate client cache.

## Commands

```bash
pnpm --dir web dev
pnpm --dir web exec tsc --noEmit
pnpm --dir web build
```

## Environment

Common local values when Nginx listens on port 80:

```env
NEXT_PUBLIC_API_URL=http://localhost
NEXT_PUBLIC_REALTIME_URL=http://localhost
BACKEND_URL=http://localhost:3006
NEXT_PUBLIC_COPILOTKIT_RUNTIME_URL=/api/copilotkit
AGENT_URL=http://localhost:8125
```

