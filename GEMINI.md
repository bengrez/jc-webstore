# Personal/jc-webstore

Codebase for this project. Persistent context lives in `~/LLM-context/Personal/jc-webstore/`.

## Before Changing Code

Read in this order, only as relevant to the task:

1. `~/LLM-context/Personal/jc-webstore/CONTEXT.md` — project purpose, stack, and current state.
   Then `~/LLM-context/Personal/jc-webstore/_meta/memory/MEMORY.md` if it exists — rules learned in session (ADR-0012). Write new memories there, not in `~/.claude`.
2. `~/LLM-context/Personal/CONTEXT.md` — domain guardrails and shared profile.
3. Active handoff with the highest NNN in `~/LLM-context/Personal/jc-webstore/20_CURRENT_TASK/`.
4. Messages addressed to you in `~/LLM-context/Personal/jc-webstore/25_AGENT_COMMS/` — files `msg-NNN-YYYY-MM-DD-<sender>-<you>-*.md` still at `status: sent`. A `subtype: brief` there is a direct request scoped for you; read it before starting. See ADR 0024.
5. Optional inbox captures in `~/LLM-context/Personal/jc-webstore/05_INBOX/` when the task references raw or newly captured knowledge.

## When Session Decisions Matter

- `bash ~/LLM-context/_vault/_bin/handoff-new.sh Personal/jc-webstore <short-slug>` opens a handoff.
- Fill the 5 required sections: Objetivo, Contexto, Decisiones, Artifacts, Pendientes.
- `bash ~/LLM-context/_vault/_bin/handoff-close.sh <path>` closes it and runs validation.
- To hand work to another agent, or to report back on work you were handed: `bash ~/LLM-context/_vault/_bin/agent-msg-new.sh Personal/jc-webstore <short-slug> --to <agent> [--kind brief|report] [--reply-to NNN] [--thread <slug>]`. One file per message; a `brief` must state acceptance criteria, a `report` must state blockers. See ADR 0024.

Full protocol: `~/LLM-context/_PROTOCOL.md`.

<!-- managed-by: install-agent-adapters.sh — edit the template in ~/LLM-context/_vault/templates/, not this generated file -->
