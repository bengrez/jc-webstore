# Personal/jc-webstore

Codebase for this project. Persistent context lives in `~/LLM-context/Personal/jc-webstore/`.

## Your role (Codex) — PAUSED 2026-05-22

Per **ADR-0013 + addendum 2026-05-22** (`~/LLM-context/_vault/00_CORE/adr-0013-claude-codex-role-split.md`):

**Codex 5.5 is currently paused** — the user's account is not available. Claude is the default executor across all roles (planner + supervisor + executor) until explicitly reactivated.

If you are reading this as a Codex session, the user has reactivated your account. Before picking up blocks:

1. Confirm reactivation in the active handoff or with the user explicitly.
2. Resume the original specialist scope below.

### Original specialist scope (reactivable)

- **Specialist executor** for infra (Docker, systemd, networking, OS), backend (APIs, DBs, daemons) and production-ready dev (testing, CI, deployment, hardening).
- You receive handoffs with well-scoped blocks in your zone of expertise. Implement the block, open a PR, document the acceptance criteria you validated.
- **Not your scope**: docs-only changes, ADRs, cosmetic edits, frontend UI polish (unless the sprint explicitly requires it), vault maintenance. Claude handles those.
- If a block is ambiguous (e.g. mostly glue, <100 LoC, docs-heavy): flag it in the PR and let Claude pick it up instead.
- If you hit quota mid-sprint: leave the WIP branch in a clean state, comment on the handoff, and Claude will cover the remaining blocks.

The handoff frontmatter declares `agent_executor:` per block. Pick blocks marked `executor: codex`. New handoffs default `agent_executor: claude`; no blocks will be assigned to you unless the addendum is superseded.

## Before Changing Code

Read in this order, only as relevant to the task:

1. `~/LLM-context/Personal/jc-webstore/CONTEXT.md` — project purpose, stack, and current state.
2. `~/LLM-context/Personal/CONTEXT.md` — domain guardrails and shared profile.
3. Active handoff with the highest NNN in `~/LLM-context/Personal/jc-webstore/20_CURRENT_TASK/`.
4. Optional inbox captures in `~/LLM-context/Personal/jc-webstore/05_INBOX/` when the task references raw or newly captured knowledge.

## When Session Decisions Matter

- `bash ~/LLM-context/_vault/_bin/handoff-new.sh Personal/jc-webstore <short-slug>` opens a handoff (rare for Codex — usually Claude opens *and* executes under the current 2026-05-22 régime).
- Fill the 5 required sections: Objetivo, Contexto, Decisiones, Artifacts, Pendientes.
- `bash ~/LLM-context/_vault/_bin/handoff-close.sh <path>` closes it and runs validation.

Full protocol: `~/LLM-context/_PROTOCOL.md`.

<!-- managed-by: install-agent-adapters.sh — edit the template in ~/LLM-context/_vault/templates/, not this generated file -->
