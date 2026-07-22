# PQJobs Backend Reverse Proxy

This document records the current local reverse proxy target for PQJobs after moving backend API traffic out of Next.js API proxy routes.

## Current Local Topology

- Frontend: `http://localhost:3001`
- Nginx backend reverse proxy: `http://localhost`
- NestJS backend: `http://localhost:3006`

The browser should open the frontend on port `3001`. Frontend code calls backend API/Auth/Socket.IO through port `80`.

## Route Map

| Public path | Proxy target | Owner | Notes |
| --- | --- | --- | --- |
| `/api/v1/*` | `http://127.0.0.1:3006/api/v1/*` | NestJS | Normal REST API. Nest global prefix is `api/v1`. |
| `/api/auth/*` | `http://127.0.0.1:3006/api/auth/*` | Better Auth on NestJS | Excluded from Nest global prefix in `backend/src/main.ts`. |
| `/socket.io/*` | `http://127.0.0.1:3006/socket.io/*` | NestJS Socket.IO gateway | Requires WebSocket upgrade headers. |
| `/api/agent/*` | Next.js route | Next.js / FastAPI agent bridge | Not routed through this Nginx backend proxy. |
| `/api/copilotkit/*` | Next.js route | Next.js CopilotKit runtime | Not routed through this Nginx backend proxy. |

## Nginx Config

The repo source of truth is:

```text
deploy/nginx/pqjobs-backend.local.conf
```

On Arch/CachyOS, install and start Nginx:

```bash
sudo pacman -S nginx
sudo systemctl enable --now nginx
```

Include the repo config from the `http { ... }` block in `/etc/nginx/nginx.conf`:

```nginx
http {
    include /mnt/disk2/job-PhuQuoc/deploy/nginx/pqjobs-backend.local.conf;
}
```

Then validate and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

The included file contains a `map` directive, so it must be included in the `http` context, not inside a `server` block.

## Default Local Startup

PQJobs now uses the default HTTP port `80`, so the recommended local path is the system Nginx service:

```bash
sudo systemctl start nginx
```

or after config changes:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

The old standalone local instance file `deploy/nginx/pqjobs-local-main.conf` is kept only as a troubleshooting wrapper. It is no longer the default development path because port `80` is owned by the system Nginx service.

## Frontend Environment

Recommended local values:

```env
BACKEND_URL=http://localhost:3006
NEXT_PUBLIC_API_URL=http://localhost
NEXT_PUBLIC_REALTIME_URL=http://localhost
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

`BACKEND_URL` remains useful for server-side rendering and internal server calls. `NEXT_PUBLIC_API_URL` is used by browser-side REST/Auth requests. `NEXT_PUBLIC_REALTIME_URL` is used by Socket.IO.

## Why Not Next.js API Proxy For Backend

Next.js API routes are still valid for BFF-owned behavior, such as CopilotKit and agent bridging. They are no longer used as a generic reverse proxy for NestJS `/api/v1/*` and `/api/auth/*` because Nginx now owns that edge routing concern.

This is a reverse proxy, not a full API Gateway. A future API Gateway layer may add centralized auth policy, rate limiting, request signing, API key handling, observability, version routing, and service discovery when the backend is split into services.
