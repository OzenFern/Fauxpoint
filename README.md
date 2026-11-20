# Fauxpoint

A developer-focused HTTP mock API platform. Create mock endpoints via an authenticated management API and call them through workspace-specific public URLs:

```
GET https://api.fauxpoint.dev/m/my-workspace/users/123
```

API-first backend — no frontend in v1.0.

## Stack

Bun · TypeScript · Elysia · PostgreSQL · Drizzle ORM · Better Auth · Bun Test

## Getting started

```bash
bun install
bun run dev
```

Server runs on http://localhost:3000 — OpenAPI docs at `/openapi`.

## Commands

```bash
bun test          # run tests
bun run verify    # fmt check + lint + typecheck
```
