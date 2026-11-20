# AGENTS.md

Guidance for AI coding agents working on **Fauxpoint**. Read this before making changes.

## Project

Fauxpoint is a developer-focused HTTP mock API platform. Developers create mock endpoints through an authenticated management API, and anyone can call them through workspace-specific public URLs:

```
GET https://api.fauxpoint.dev/m/my-workspace/users/123
```

The endpoint returns whatever response its owner configured (status, JSON body, headers, artificial delay).

The target is **v1.0.0 (MVP)**: an API-first backend. There is **no frontend** in scope.

## Current state

The repo is at the scaffold stage — most of the stack below is **planned, not yet implemented**:

- `src/app.ts` — Elysia app composition; currently only `GET /` and `GET /health`. Exports `default app` and `type App`.
- `src/index.ts` — server entry point: mounts `@elysia/openapi` and calls `.listen(3000)`.
- `test/app.test.ts` — one health-check test using `@elysia/eden` treaty.
- Not yet present: `env.ts`, database client, auth, routes, plugins, `bunfig.toml`, Drizzle/Bun-Postgres/Better Auth dependencies.

When you add infrastructure, follow the structure below rather than inventing new locations.

## Tech stack

| Concern          | Choice                                      | Status  |
| ---------------- | ------------------------------------------- | ------- |
| Runtime          | Bun                                         | adopted |
| Language         | TypeScript (strict, `verbatimModuleSyntax`) | adopted |
| HTTP framework   | Elysia                                      | adopted |
| API docs         | Elysia OpenAPI (`@elysia/openapi`)          | adopted |
| Client types     | Eden Treaty (`@elysia/eden`)                | adopted |
| Lint / format    | Oxlint and Oxfmt (via `bun fmt`)            | adopted |
| Testing          | Bun Test                                    | adopted |
| Database         | PostgreSQL                                  | planned |
| ORM / migrations | Drizzle ORM                                 | planned |
| Authentication   | Better Auth (email/password, session-based) | planned |
| Validation       | Elysia TypeBox (`t`) via Standard Schema    | planned |
| Containers       | Docker / Docker Compose                     | planned |

**Do not introduce** ArkType, Zod, Prisma, Express, Redis, Prettier, ESLint, Vitest, or any other framework or tool without explicit approval. Adding a new dependency requires asking first.

## Project structure

Feature-based Elysia architecture (target layout — create folders as features land):

```
src/
  index.ts        # server entry point: mounts plugins (e.g. OpenAPI) and calls .listen()
  app.ts          # Elysia app composition (exports default app and `type App`)
  env.ts          # validated environment configuration
  libs/
    auth/         # Better Auth config + generated auth schema
    db/           # Drizzle client + application schemas
  plugins/        # reusable Elysia plugins (auth, errors, etc.)
  routes/
    <feature>/
      index.ts    # HTTP routes and controller logic
      service.ts  # business logic and database access
      model.ts    # TypeBox request/response schemas + inferred types
test/             # unit and integration tests (*.test.ts)
```

Rules:

- `app.ts` must **never** call `.listen()`. Only `index.ts` starts the server, so tests can import the app without opening a port. Request-scoped plugins like OpenAPI may be mounted in `index.ts`.
- Keep pure utilities inside the feature that owns them. Move them to a shared location only when a second feature genuinely needs them.
- Do **not** add repository, factory, or dependency-injection layers without a concrete requirement.
- Better Auth owns the auth tables (users, sessions, accounts, verifications). Fauxpoint owns its application tables. Do not hand-edit generated auth schema; regenerate it.

## Code conventions

- Compose Elysia with **method chaining** (`new Elysia().get(...).post(...)`) so types flow to `typeof app` and Eden. Do not split routes into separate `app.get(...)` statements.
- Validate every request body, query, params, and response with TypeBox schemas defined in the feature's `model.ts`. Derive TS types from the schemas (`typeof Model.static`) instead of duplicating them.
- Controllers (`index.ts`) stay thin: parse, call the service, shape the response. Services hold business logic and Drizzle queries and should not depend on Elysia's request context.
- Give reusable plugins a `name` so Elysia deduplicates them.
- Errors go through the global error handler and return a consistent JSON shape. Do not return ad-hoc error formats.
- Use `import type` for type-only imports (`verbatimModuleSyntax` is on). Use ESM only; import local files with the `.ts` extension (see `src/index.ts`).
- Prefer small, focused functions and explicit return types on exported functions.
- Never commit secrets. All configuration goes through `src/env.ts`; do not read `process.env` / `Bun.env` anywhere else.

## Commands

```bash
bun install --frozen-lockfile   # install deps (CI uses the frozen lockfile)
bun run dev                     # dev server with --watch on port 3000
bun test                        # run the test suite
bun run verify                  # bun fmt --check && oxlint --type-aware && bun check (must pass before a PR)
bun run build && bun run start  # production build/run via dist/
```

Notes:

- A `.githooks/pre-commit` hook (enabled via the `prepare` script) runs `bun fmt --staged`, `bun oxlint --type-aware`, and `bun check`.
- If `package.json` defines a script named `fmt` or `lint`, Bun runs that script instead of its built-in `bun fmt` / `bun lint`. Keep script names and their contents in sync with the tooling above (Oxlint / Oxfmt).
- Database migrations are generated and applied with Drizzle. Never edit an already-applied migration; add a new one.

## Testing

- Use `bun:test`. Test files live in `test/` and are named `*.test.ts`.
- Test HTTP behavior in-process: `await app.handle(new Request("http://localhost/..."))` or via Eden treaty (`treaty<App>(app)`). Import the app from `src/app`, not from the server entry.
- Cover, at minimum: the path matcher (unit), authentication and ownership, mock CRUD, runtime matching/precedence/CORS/delay, request logging, and limits.
- Tests that touch the database must use an isolated test database and clean up after themselves. Never run tests against a real or production database.
- New behavior needs tests. A bug fix needs a regression test.

## Domain rules (v1.0 goals)

**Workspaces**

- One personal workspace per user, identified by a unique slug.
- Every management query is scoped to the authenticated user's workspace. Enforce ownership on every read and write.

**Mocks**

- Support GET, POST, PUT, PATCH, DELETE and other standard methods.
- Configurable status, JSON body, headers, content type, and artificial delay.
- Method + path must be unique within a workspace. Return a clear conflict error on duplicates.
- Disabled mocks must never execute at runtime.
- List endpoints use **cursor-based pagination**.

**Runtime engine** (public, mounted under `/m/:workspace/*`)

- Match by workspace, HTTP method, and path.
- Support static segments and `:param` segments. **Static routes win over parameterized routes.**
- Path params are for matching only. **No response templating in v1.0.**
- Artificial delay must be non-blocking (`await` a timer; never busy-wait).
- Handle CORS and `OPTIONS` preflight.
- Unmatched requests return a helpful JSON 404.

**Request logs**

- Record matched and unmatched requests: method, path, query, safe headers, truncated body, response status, duration, timestamp.
- Never log `Authorization` headers, cookies, session tokens, or other secrets.
- Logs are retrievable globally and per mock, paginated, with a retention policy.

**Limits and safety**

- Runtime rate limiting (in-process, no Redis).
- Max response body size, max logged request body size, max artificial delay, max mocks per workspace.
- Reject reserved response headers (e.g. hop-by-hop and security-sensitive headers).

## Roadmap

Six milestones under v1.0.0:

1. **M1** Foundation & Infrastructure
2. **M2** Authentication & Workspaces
3. **M3** Mock Management API
4. **M4** Mock Runtime Engine
5. **M5** Request Logs & Protection
6. **M6** Testing, Documentation & Release

## GitHub workflow

- Issues need a clear title, description, implementation notes, an acceptance-criteria checklist, dependencies, labels, and a milestone. No due dates and no assignees unless asked.
- Labels: `type:` (feature, bug, chore, test, documentation, security), `priority:` (high, medium, low), `area:` (infrastructure, auth, database, api, runtime, logging, security, testing, deployment).
- Before creating issues, milestones, or labels, check for existing ones to avoid duplicates.
- CI (`.github/workflows/ci.yml`) runs on PRs and pushes to `main` (markdown-only changes ignored): `bun install --frozen-lockfile`, `bun test`, `bun run verify`.
- Keep commits focused and descriptive. Keep PRs scoped to one issue.

## Out of scope for v1.0

Do not implement or create MVP work for: response rotation/sequences, dynamic templates, conditional matching, failure-rate simulation, latency distributions, OpenAPI import/export, WebSocket/SSE live streams, multiple projects per workspace, team collaboration, a CLI, record/proxy mode, a frontend dashboard, custom domains, billing or plans. These are future-roadmap items. If a task seems to need one, stop and ask.

## Agent boundaries

**Do**

- Read the relevant feature folder and existing tests before editing.
- Follow the structure and conventions above and match the surrounding code style.
- Run `bun test` and `bun run verify` before declaring work done.
- State assumptions and open questions in your final message.

**Ask first**

- Adding or upgrading dependencies.
- Changing the architecture, folder structure, or database schema in a non-additive way.
- Anything that touches authentication, session handling, or secrets handling.
- Anything on the "out of scope" list.

**Never**

- Commit secrets, `.env` files, or real credentials.
- Log sensitive request data (tokens, cookies, auth headers).
- Disable lint rules, skip tests, or weaken validation or limits to make a change pass.
- Run destructive database commands against anything other than a local or test database.
- Rewrite git history on shared branches.
