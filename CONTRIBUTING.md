# Contributing to LinkVault

Thanks for considering a contribution. This is a small, personal-scale project, so the process is lightweight — no CLA, no formal RFC process, just fork, branch, PR.

## Before you start

Skim these so your PR fits how the project already thinks about itself:

- [`README.md`](README.md) — what the app does and how to run it
- [`docs/features.md`](docs/features.md) — what's actually built, feature by feature, and where the code lives
- [`docs/tech-stack.md`](docs/tech-stack.md) — why each piece of the stack was chosen
- [`docs/execution-plan.md`](docs/execution-plan.md) — build history, and the "v2 (later, not now)" list of things intentionally deferred

If what you want to build is already in the "Not built (explicitly out of scope so far)" table in `docs/features.md` or the "v2" list in `docs/execution-plan.md`, it's not that nobody thought of it — open an issue first to discuss scope before writing code, since some of those are deferred for specific reasons (e.g. no vision-capable model available).

### A note if you're using an AI coding assistant

This repo runs on a Next.js version with breaking changes from most assistants' training data — `middleware.ts` is renamed to `proxy.ts`, `params`/`searchParams` are async, and so on. Point your assistant at `node_modules/next/dist/docs/` before it writes code, or it will confidently write code for a Next.js that doesn't exist here.

## Setup

Requires Node 20+.

```bash
git clone https://github.com/<you>/LinkVault.git
cd LinkVault
npm install
cp .env.local.example .env.local
```

Fill in `.env.local` with your own Supabase project and Groq API key — see the [Getting started](README.md#getting-started) section of the README for where to find each value. You'll need your own free Supabase project (run `supabase/schema.sql` in its SQL Editor) since this app is multi-tenant by user, not by deployment; there's no shared dev backend to point at.

```bash
npm run dev
```

## Making a change

1. Create a branch off `main`: `git checkout -b your-feature-name`.
2. Make your change. Keep it scoped — this codebase favors small, focused diffs over drive-by refactors of unrelated code.
3. If you touch a feature, update [`docs/features.md`](docs/features.md) alongside it — that file is meant to stay accurate as the source of truth, not be reconciled after the fact.
4. Before opening a PR, run:
   ```bash
   npm run lint
   npm run build
   ```
   Both should pass clean. There's no test suite yet — `npm run build` (which runs `tsc` as part of the Next.js build) is the main correctness check.
5. Open a PR against `main` with a description of *why*, not just *what* — the diff already shows what changed.

## Code conventions

- TypeScript throughout; avoid `any` — the codebase currently has none.
- Server Actions for mutations from the app itself (`src/app/actions/`); the one exception is `/api/save` (`src/app/api/save/route.ts`), which exists specifically because the iOS Shortcut and the browser extension have no browser session to carry a Server Action's cookies.
- Comments explain *why*, not *what* — if a comment just restates the code, it's cut in review.
- No new dependencies for something a few lines of code can do — see `src/lib/safe-fetch.ts` for the house style on this (a from-scratch SSRF-safe fetch instead of pulling in a library).

## Reporting bugs

Open a GitHub issue with steps to reproduce. For anything security-related (auth bypass, data leaking across users, SSRF-style issues, etc.), please use GitHub's **Security Advisories** (repo → Security tab → "Report a vulnerability") instead of a public issue, so it can be fixed before it's public.

## License

By contributing, you agree your contribution is licensed under this repo's [MIT license](LICENSE).
