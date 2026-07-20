# AGENTS.md

## Commands

- Use `npm` in this repo; `package-lock.json` is the lockfile.
- Use Node `22.12.0` from `.nvmrc`.
- Start dev server: `npm run dev` (`astro dev`, default port 4321).
- Full local verification: `npm run verify` runs `format:check -> lint -> test -> check -> build`.
- Focused checks: `npm run test -- src/lib/env.test.ts`, `npm run lint`, `npm run check`, `npm run build`.
- Formatting is Prettier with Astro and Tailwind plugins: `npm run format` or `npm run format:check`.

## App Shape

- This is an Astro SSR app (`output: "server"`) deployed on a VPS with Dokploy using the `@astrojs/node` adapter in `standalone` mode; the `Dockerfile` builds with `npm run build` and runs `dist/server/entry.mjs`.
- The page entrypoint is `src/pages/index.astro`, which hydrates the React dashboard via `DashboardTabs client:load`.
- API routes live under `src/pages/api/**`; they are not prerendered and query Postgres directly through `src/lib/db.ts`.
- The dashboard manages two database environments via `?env=dev|prod`; omitted `env` defaults to `dev`, and invalid values return 400.

## Auth (Logto)

- Authentication uses a self-hosted Logto (OIDC, "Traditional web" application) via `@logto/node`; there is no Astro SDK, so the integration lives in `src/lib/logto.ts`.
- `src/middleware.ts` hydrates the session on every request (except static assets) and exposes `locals.auth()` (`{ userId }`) and `locals.user` (`{ name, picture } | null`); `src/env.d.ts` declares these `App.Locals` types. Pages/API routes keep using `locals.auth()` for authorization.
- Session persistence: Logto tokens are stored in encrypted (AES-256-GCM) httpOnly cookies by `src/lib/logto-session.ts`; expired tokens are refreshed transparently in `getAuthSession`.
- Auth routes are endpoints (not pages): `src/pages/sign-in.ts` redirects to Logto, `src/pages/callback.ts` handles the OIDC callback, `src/pages/sign-out.ts` signs out via Logto. The redirect URI `<base>/callback` and post-logout `<base>` must be registered in the Logto Console.
- Required env vars (read lazily with `astro:env/server` in `src/lib/logto.ts`): `LOGTO_ENDPOINT`, `LOGTO_APP_ID`, `LOGTO_APP_SECRET`, `LOGTO_BASE_URL` (public URL of this app, used for redirect URIs and cookie `secure` flag), and `LOGTO_COOKIE_SECRET` (cookie encryption key).
- Invitation-only registration is handled by the independent Node service in `services/logto-invitations`; it uses a Logto M2M app plus Resend, and sends links to the public `src/pages/invitacion.ts` landing page. The main dashboard does not expose invitation administration.

## Data And Env

- Database credentials are read with `astro:env/server` at module import time in `src/lib/db.ts`; builds/API routes need `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, and `DB_DATABASE_PROD`; `DB_PORT` defaults to `5432`.
- `prod` in the UI/API targets the production database (`DB_DATABASE_PROD`); preserve the existing confirmation flow (`confirmProductionEnv` in `src/utils/production.ts`, SweetAlert2) before changing production-affecting behavior.
- Date inputs are shown in `Europe/Madrid`, converted to UTC before API submission, and DB timestamp text is normalized by `dbDateToUtc`; keep related tests in `src/utils/dates.test.ts` updated when touching this flow.

## Testing Notes

- Tests are Vitest unit tests colocated in `src/**/*.test.ts`; there is no Vitest config file.
- Current tests cover env parsing, input validation, date conversion, and the Logto cookie session layer (`src/lib/logto-session.test.ts`). Add focused unit coverage there when changing those utilities or schemas.
- `src/lib/logto-session.ts` is deliberately free of `astro:env` imports so it stays unit-testable; keep crypto/storage logic there and env-dependent wiring in `src/lib/logto.ts`.

## API Route Conventions

- Each API route under `src/pages/api/**` declares `export const prerender = false` explicitly, even though `output: "server"` is set globally.
- Standard flow: `parseEnv(url)` → return 400 on `null`, `getDb(env)` for the connection, validate body with schemas from `src/lib/validation.ts`, respond via `json()` from `src/lib/http.ts`, and normalize DB timestamp text with `dbDateToUtc` before returning dates. See `src/pages/api/formaciones/index.ts` as the reference implementation.

## Config Notes

- TypeScript extends `astro/tsconfigs/strict`; React JSX is configured in `tsconfig.json`.
- ESLint uses flat config for JS, TypeScript, Astro, React, and React Hooks; `react-hooks/set-state-in-effect` is intentionally disabled.
- Repo-local `opencode.json` enables the Astro docs MCP; prefer it when checking Astro-specific behavior.
