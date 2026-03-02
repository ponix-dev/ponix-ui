# Roadmap: Entity Management → Knowledge & Downlinks → Agentic Workflows

This roadmap mirrors the [ponix-rs backend roadmap](../ponix-rs/ROADMAP.md), covering the UI features required to expose each backend phase's capabilities.

---

## Phase 1 — Foundation & Uplink Contracts

Harden the existing entity management UI and align with backend payload contract changes.

- [x] #3 — Update DataStreamDefinition UI for multi-protocol payload contracts
- [x] #4 — Add Playwright E2E testing infrastructure
- [x] #22 — Rename End Device to Data Stream across UI
- [ ] #5 — Gateway config form updates for deployer abstraction

## Phase 2 — Collaborative Document Editor & Versioning

Real-time collaborative document editing using Plate + Yjs/Yrs, with version history.

- [ ] #25 — Plate + Yjs collaborative editor component
- [ ] #26 — Document management page
- [ ] #27 — Document association UI
- [ ] #28 — Version history UI

## Phase 3 — Document Comments

Threaded comments anchored to document positions, with resolution workflow.

- [ ] #29 — Threaded comments with anchor positions
- [ ] #30 — Comment resolution workflow

## Phase 4 — Downlink UI

Enable sending commands to devices and tracking their lifecycle.

- [ ] #10 — Downlink command form on data stream detail
- [ ] #11 — Command history view with lifecycle status

## Phase 5 — Workspace MCP & Agent Config UI

Workspace-level settings and MCP server management.

- [ ] #12 — Workspace settings/config page
- [ ] #13 — MCP server registry UI

## Phase 6 — Workflow Management UI

CRUD, trigger configuration, and observability for automated workflows.

- [ ] #14 — Workflow CRUD UI
- [ ] #15 — Trigger configuration UI (CEL + cron)
- [ ] #16 — Workflow run history and audit viewer

## Phase 7 — LoRaWAN / ChirpStack UI

Specialized UI for LoRaWAN device onboarding and downlink configuration.

- [ ] #17 — ChirpStack data stream definition wizard
- [ ] #18 — LoRaWAN downlink configuration UI

---

## Next Steps (future, no issues yet)

- Raw event log viewer
- Team invites and role management
- Embedded data visualization

## Open Questions

- **Plate plugin selection** — Which Plate plugins are needed beyond the base editor?
- **Workspace settings scope** — What belongs beyond MCP registry?
- **CEL trigger editor** — How much investment in a dedicated editor?
