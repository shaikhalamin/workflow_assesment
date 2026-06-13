# Root Docker Compose Design

## Goal

Run the existing backend and frontend together from the repository root with one command:

```bash
docker compose up -d
```

The default setup should preserve the current development workflow: backend on host port `8870`, frontend Vite dev server on host port `5173`, Postgres on host port `5438`, and Redis on host port `6385`.

## Architecture

The repository root owns orchestration. A new root `docker-compose.yml` defines `backend`, `frontend`, `postgres`, and `redis` services on the same Compose network.

The backend keeps its existing NestJS development container behavior. It builds from `workflow_be/Dockerfile`, runs `pnpm dev`, mounts `workflow_be` into `/app`, and stores container dependencies in a named `backend_node_modules` volume.

The frontend runs Vite dev mode in a Node container. It builds from a new `workflow_fe/Dockerfile`, runs `npm run dev -- --host 0.0.0.0`, mounts `workflow_fe` into `/app`, and stores container dependencies in a named `frontend_node_modules` volume.

## Data Flow

Browser traffic goes to:

- Frontend UI: `http://localhost:5173`
- Backend API: proxied through frontend dev server from `/api` to `http://backend:8870`
- Socket.IO: proxied through frontend dev server from `/socket.io` to `http://backend:8870`

The backend connects to:

- Postgres through `postgres:5432`
- Redis through `redis:6379`

Host access remains available through the existing local ports.

## Environment

Root Compose provides backend defaults equivalent to the previous backend Compose file:

- `NODE_ENV=development`
- `PORT=8870`
- `DATABASE_URL=postgres://postgres:postgres@postgres:5432/workflowbe`
- `REDIS_URL=redis://redis:6379`
- `FRONTEND_ORIGIN=http://localhost:5173`

The root `.env.example` documents the same default values for users who want to override ports or credentials.

## Frontend Proxy

`workflow_fe/vite.config.ts` should resolve the backend proxy target from `VITE_BACKEND_PROXY_TARGET`, defaulting to `http://127.0.0.1:8870` for local non-Docker development. Root Compose sets `VITE_BACKEND_PROXY_TARGET=http://backend:8870` inside the frontend container.

## Repository Shape

The parent directory is not currently a git repository, while `workflow_be` and `workflow_fe` each have their own `.git` directories. Docker Compose does not require changing that. The Compose restructuring should not delete nested git metadata automatically.

## Verification

Verification should confirm:

- `docker compose config` succeeds from the root.
- `docker compose up -d --build` starts all services.
- `docker compose ps` shows frontend, backend, Postgres, and Redis running or healthy.
- `curl http://127.0.0.1:5173` returns the Vite app HTML.
- `curl http://127.0.0.1:8870` reaches the backend.
