# Redesign notes — index

Second-brain structure for the overnight autonomous redesign session (started 2026-09-05, user stepped away and granted full autonomy with one hard rule: don't damage the laptop). Read this file first; it links to everything else.

## What's happening

The HireSignal frontend is being redesigned in **5 parallel visual directions**, each on its own git branch, built by a different tool:

| # | Branch | Built by | Direction | Status |
|---|--------|----------|-----------|--------|
| 1 | `redesign/claude-teal` | Me (this session) | Light-default, teal accent, real dark mode toggle | ✅ Done, on `main`, all screens converted + responsive — see [variants/01-claude-teal.md](variants/01-claude-teal.md) |
| 2 | `redesign/opencode-bigpickle` | `opencode` CLI, free `big-pickle` model | Bold dark-first "Signal" — radar-orange + carbon | ✅ Done (`3506f44`) — see [variants/02-opencode-bigpickle.md](variants/02-opencode-bigpickle.md) |
| 3 | `redesign/cursor-agent` | `cursor-agent` CLI | Warm editorial/print-magazine — oxblood + Fraunces | ✅ Done (`8f248b9`) — see [variants/03-cursor-agent.md](variants/03-cursor-agent.md) |
| 4 | `redesign/agy-antigravity` | `agy` (Antigravity) CLI | Dense data-forward "cockpit" — cyan + JetBrains Mono | ✅ Done (`6795ce6`) — see [variants/04-agy-antigravity.md](variants/04-agy-antigravity.md) |
| 5 | `redesign/ollama-local` | Me, direction proposed by local `deepseek-r1:8b` | "Confident Architecture" — trust-blue, sharp corners | ✅ Done (`4191f12`) — see [variants/05-ollama-local.md](variants/05-ollama-local.md) |

**All 5 variants complete.** Each lives in its own [git worktree](https://git-scm.com/docs/git-worktree) under `../hiresignal-worktrees/<name>/`, isolated from this main checkout and from each other — 3 tools ran concurrently (safe: they're cloud-backed, no local GPU/CPU load) without touching the same files. Every variant builds cleanly (`npm run build`); the teal and ollama-local ones were also spot-checked live in a browser.

## If you want to compare them

From the main repo (not a worktree), `git log --all --oneline --graph` shows all 5 branch tips. To actually run one: `cd ../hiresignal-worktrees/<name>/frontend && npm run dev` (each worktree already has `node_modules` installed) — or `git worktree list` from the main repo to see all paths. None of the 5 have been merged into `main` or pushed anywhere; that's a decision for you to make once you've looked at them.

## Why this structure exists

The user explicitly asked for everything logged and documented (they're not available to check in live), and specifically asked for organized files-in-folders rather than one giant markdown file. Structure:

- **`decisions/`** — one file per significant judgment call, dated, with reasoning. Read these to understand *why*, not just *what*.
- **`variants/`** — one file per UI variant, updated as each build completes: brief given, what the tool actually produced, how it was verified, any issues found.
- **`research/`** — any external research consulted (web searches, the `ui-ux-pro-max` skill's data lookups) that informed a decision, kept separate from the decisions themselves so a decision file stays short and a research trail stays inspectable.

## Frontend v2 — 18-variant round — 2026-09-06

All 18 variants from
[decisions/2026-09-06-frontend-v2-multi-variant-plan.md](decisions/2026-09-06-frontend-v2-multi-variant-plan.md)
are built, committed, and documented in `variants/v2-*.md`. Each lives in
its own worktree under `../hiresignal-worktrees-v2/<name>/` on branch
`frontend-v2/<name>`, off `main`, touching only the visual/component
layer of 4 representative screens (Auth, a dashboard, PostJobView,
Match/Pipeline) against the real, unmodified backend. None merged into
`main` — that's a decision for the user once they've compared them.

To run one: `cd ../hiresignal-worktrees-v2/<name>/frontend && npm run dev`.

## New-feature phases (F1-F4) — 2026-09-06

With the visual redesign (R1-R5) done on the `claude-teal` variant now
living on `main`, the session moved to the new-features track from the
original redesign plan: resume library, pipeline stage-advance,
recruiter analytics, and self-service account deletion. All four
built, tested (backend Jest + frontend Vitest), and verified live
against a real MongoDB. Full writeup:
[decisions/2026-09-06-phases-f1-f4-features.md](decisions/2026-09-06-phases-f1-f4-features.md).

## Hardware safety (standing constraint for this whole session)

Checked before touching any local tool: AMD Ryzen AI 9 365 (10c/20t), 32GB RAM (11.6GB free at session start), NVIDIA RTX 5060 Laptop (8GB VRAM). Rule adopted and followed throughout: **only one local (GPU-resident) model loaded at a time, ever** — cloud-backed CLI tools (opencode, cursor-agent, agy) may run concurrently since their inference happens on remote servers, not this laptop. Full reasoning in [decisions/2026-09-05-five-variant-plan.md](decisions/2026-09-05-five-variant-plan.md).
