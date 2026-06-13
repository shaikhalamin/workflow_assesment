# Root Docker Compose Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a root Docker Compose development setup that starts the backend, frontend, Postgres, and Redis with `docker compose up -d`.

**Architecture:** Root Compose owns orchestration. Backend keeps the existing NestJS/pnpm development container flow. Frontend gets a small Vite dev Dockerfile and a configurable Vite proxy target so local development still uses `127.0.0.1:8870` while Docker uses `backend:8870`.

**Tech Stack:** Docker Compose, Node 22 Alpine, NestJS, pnpm, Vite, React, PostgreSQL 16 Alpine, Redis 7 Alpine.

---

### Task 1: Add Frontend Dockerfile

**Files:**
- Create: `workflow_fe/Dockerfile`
- Create: `workflow_fe/.dockerignore`

- [ ] **Step 1: Create `workflow_fe/Dockerfile`**

Use Node 22 Alpine, install frontend dependencies with `npm ci`, expose Vite port `5173`, and run Vite on all interfaces.

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

- [ ] **Step 2: Create `workflow_fe/.dockerignore`**

Keep container build context small and avoid copying host dependencies or build output.

```dockerignore
node_modules
dist
.git
.DS_Store
*.log
```

### Task 2: Make Vite Proxy Target Configurable

**Files:**
- Modify: `workflow_fe/vite.config.ts`

- [ ] **Step 1: Add a backend proxy target constant**

Add this near the logger setup:

```ts
const backendProxyTarget =
  process.env.VITE_BACKEND_PROXY_TARGET ?? 'http://127.0.0.1:8870'
```

- [ ] **Step 2: Use the constant in both proxy entries**

Change both proxy `target` values to:

```ts
target: backendProxyTarget,
```

- [ ] **Step 3: Run the existing Vite config test**

Run:

```bash
npm test -- vite.config.test.ts
```

Expected: Vitest exits successfully.

### Task 3: Add Root Compose and Env Example

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: Create root `docker-compose.yml`**

The root Compose file should define `backend`, `frontend`, `postgres`, and `redis`. Backend values should match the previous backend Compose defaults. Frontend should set `VITE_BACKEND_PROXY_TARGET=http://backend:8870`.

```yaml
services:
  backend:
    build:
      context: ./workflow_be
      dockerfile: Dockerfile
    image: workflow-backend
    container_name: workflow-backend
    restart: unless-stopped
    user: "${UID:-1000}:${GID:-1000}"
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: ${PORT:-8870}
      DATABASE_URL: postgres://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-workflowbe}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-dev-only-jwt-secret-please-rotate-in-prod-32chars}
      COOKIE_DOMAIN: ${COOKIE_DOMAIN:-localhost}
      FRONTEND_ORIGIN: ${FRONTEND_ORIGIN:-http://localhost:5173}
      LOG_LEVEL: ${LOG_LEVEL:-debug}
      MAILER_TRANSPORT: ${MAILER_TRANSPORT:-console}
      RESEND_API_KEY: ${RESEND_API_KEY:-fkodf94i5i459i5j459459j45945u454i5i454509}
      MAILER_FROM: ${MAILER_FROM:-onboarding@resend.dev}
      MAILER_COMPANY_ADDRESS: ${MAILER_COMPANY_ADDRESS:-Fiber@Home Ltd.}
      MAILER_SUPPORT_EMAIL: ${MAILER_SUPPORT_EMAIL:-onboarding@resend.dev}
      CHOKIDAR_USEPOLLING: ${CHOKIDAR_USEPOLLING:-true}
    ports:
      - "${PORT:-8870}:${PORT:-8870}"
    command: pnpm dev
    volumes:
      - ./workflow_be:/app
      - backend_node_modules:/app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "node -e \"fetch('http://127.0.0.1:' + (process.env.PORT || 8870) + '/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))\"",
        ]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 20s

  frontend:
    build:
      context: ./workflow_fe
      dockerfile: Dockerfile
    image: workflow-frontend
    container_name: workflow-frontend
    restart: unless-stopped
    environment:
      VITE_BACKEND_PROXY_TARGET: http://backend:8870
      CHOKIDAR_USEPOLLING: ${CHOKIDAR_USEPOLLING:-true}
    ports:
      - "${FRONTEND_PORT:-5173}:5173"
    command: npm run dev -- --host 0.0.0.0
    volumes:
      - ./workflow_fe:/app
      - frontend_node_modules:/app/node_modules
    depends_on:
      backend:
        condition: service_started

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    container_name: workflow-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-workflowbe}
    ports:
      - "${POSTGRES_HOST_PORT:-5438}:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: workflow-redis
    restart: unless-stopped
    ports:
      - "${REDIS_HOST_PORT:-6385}:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pg_data:
  backend_node_modules:
  frontend_node_modules:
```

- [ ] **Step 2: Create root `.env.example`**

Document the overridable defaults.

```dotenv
NODE_ENV=development
PORT=8870
FRONTEND_PORT=5173

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=workflowbe
POSTGRES_HOST_PORT=5438

REDIS_HOST_PORT=6385

JWT_SECRET=dev-only-jwt-secret-please-rotate-in-prod-32chars
COOKIE_DOMAIN=localhost
FRONTEND_ORIGIN=http://localhost:5173
LOG_LEVEL=debug

MAILER_TRANSPORT=console
RESEND_API_KEY=fkjdkfjkdkfdkfkdfkkdfjkdjfdkfdkfj
MAILER_FROM=onboarding@resend.dev
MAILER_COMPANY_ADDRESS=Fiber@Home Ltd.
MAILER_SUPPORT_EMAIL=onboarding@resend.dev

CHOKIDAR_USEPOLLING=true
```

### Task 4: Add Root Usage Documentation

**Files:**
- Create: `README.md`

- [ ] **Step 1: Add root README**

Document the one-command startup and default URLs.

```markdown
# Workflow Monorepo

## Run with Docker Compose

From the repository root:

```bash
docker compose up -d --build
```

Default URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:8870
- Postgres host port: 5438
- Redis host port: 6385

To stop everything:

```bash
docker compose down
```

To remove database, Redis, and dependency volumes:

```bash
docker compose down -v
```

Copy `.env.example` to `.env` only when you need to override the defaults.
```

### Task 5: Verify Compose Workflow

**Files:**
- Read: `docker-compose.yml`
- Read: `workflow_fe/vite.config.ts`

- [ ] **Step 1: Validate Compose config**

Run:

```bash
docker compose config
```

Expected: Compose renders all four services without errors.

- [ ] **Step 2: Build and start services**

Run:

```bash
docker compose up -d --build
```

Expected: Docker builds `workflow-backend` and `workflow-frontend`, then starts frontend, backend, Postgres, and Redis.

- [ ] **Step 3: Check service state**

Run:

```bash
docker compose ps
```

Expected: Postgres and Redis are healthy. Frontend is running on `0.0.0.0:5173->5173/tcp`. Backend is running on `0.0.0.0:8870->8870/tcp`.

- [ ] **Step 4: Check frontend**

Run:

```bash
curl -fsS http://127.0.0.1:5173 >/tmp/workflow-frontend.html
```

Expected: Command exits successfully.

- [ ] **Step 5: Check backend**

Run:

```bash
curl -fsS http://127.0.0.1:8870 >/tmp/workflow-backend.txt
```

Expected: Command exits successfully.
