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

## Repository Note

The backend and frontend live in this primary repository as normal tracked
directories. Their previous standalone repository histories were imported under
`workflow_be/` and `workflow_fe/`.
