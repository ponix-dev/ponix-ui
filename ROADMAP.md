# Roadmap: Entity Management → Knowledge & Downlinks → Agentic Workflows

This roadmap mirrors the [ponix-rs backend roadmap](../ponix-rs/ROADMAP.md), covering the UI features required to expose each backend phase's capabilities.

---

## Phase 1 — Foundation & Uplink Contracts

Harden the existing entity management UI and align with backend payload contract changes.

- [x] #3 — Update DataStreamDefinition UI for multi-protocol payload contracts
- [x] #4 — Add Playwright E2E testing infrastructure
- [x] #22 — Rename End Device to Data Stream across UI
- [ ] #5 — Gateway config form updates for deployer abstraction

## Phase 2 — Knowledge Layer UI

Surface the backend's document and knowledge management capabilities.

- [ ] #6 — Document management page
- [ ] #7 — Document attachment on data stream detail
- [ ] #8 — Entity relationship management UI
- [ ] #9 — Document upload integration

## Phase 3 — Downlink UI

Enable sending commands to devices and tracking their lifecycle.

- [ ] #10 — Downlink command form on data stream detail
- [ ] #11 — Command history view with lifecycle status

## Phase 4 — Workspace MCP & Agent Config UI

Workspace-level settings and MCP server management.

- [ ] #12 — Workspace settings/config page
- [ ] #13 — MCP server registry UI

## Phase 5 — Workflow Management UI

CRUD, trigger configuration, and observability for automated workflows.

- [ ] #14 — Workflow CRUD UI
- [ ] #15 — Trigger configuration UI (CEL + cron)
- [ ] #16 — Workflow run history and audit viewer

## Phase 6 — LoRaWAN / ChirpStack UI

Specialized UI for LoRaWAN device onboarding and downlink configuration.

- [ ] #17 — ChirpStack data stream definition wizard
- [ ] #18 — LoRaWAN downlink configuration UI

---

## Next Steps (future, no issues yet)

- Raw event log viewer
- Team invites and role management
- Embedded data visualization

## Open Questions

- **Document upload method** — HTTP multipart vs gRPC stream?
- **Workspace settings scope** — What belongs beyond MCP registry?
- **CEL trigger editor** — How much investment in a dedicated editor?
