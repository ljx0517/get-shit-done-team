# Instructions for GSDT

- Use the gsdt skill when the user asks for GSDT or uses a `gsdt:*` / `gsdt-*` command (older installs may still show legacy `gsd:*` / `gsd-*`; treat those the same).
- Treat `/gsdt-...` or `gsdt-...` as command invocations and load the matching file from `.github/skills/gsdt-*`.
- When a command says to spawn a subagent, prefer a matching custom agent from `.github/agents`.
- Do not apply GSDT workflows unless the user explicitly asks for them.
- After completing any `gsdt-*` command (or any deliverable it triggers: feature, bug fix, tests, docs, etc.), ALWAYS: (1) offer the user the next step by prompting via `ask_user`; repeat this feedback loop until the user explicitly indicates they are done.
