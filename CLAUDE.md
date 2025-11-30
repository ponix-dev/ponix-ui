# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ponix UI is a web interface for the Ponix IoT platform, managing organizations, gateways, and end devices. It communicates with a Rust backend (`../ponix-rs`) via gRPC-Web.

## Commands

```bash
# Install dependencies
bun install

# Development (local only, no backend)
bun run dev

# Development with full backend stack (via Tilt)
tilt up

# Stop all Tilt services
tilt down

# Type check all packages
bun run typecheck

# Build production assets
bun run build

# Add shadcn components
cd apps/web && bunx shadcn@latest add <component>
```

## Architecture

### Monorepo Structure

This is a Bun workspace monorepo designed to support multiple platforms (web now, React Native later):

- `apps/web` - React + Vite web application (`@ponix/web`)
- `packages/shared` - Shared types and utilities (`@ponix/shared`)

### Tech Stack

- **Runtime**: Bun
- **Framework**: React 19 + Vite 7
- **Styling**: Tailwind CSS v4 + shadcn/ui (New York style)
- **Icons**: Lucide React
- **Planned**: TanStack Query for state, @connectrpc/connect-web for gRPC

### Path Aliases

The web app uses `@/` as an alias to `./src/`:
```typescript
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

### Shared Types

Domain types in `packages/shared/src/types/index.ts`:
- `Organization` - Multi-tenant organization entity
- `Gateway` - IoT gateway configuration (EMQX type)
- `EndDevice` - End device with CEL payload conversion

Import with: `import { Organization } from "@ponix/shared"`

### Docker & Deployment

The Dockerfile (`apps/web/Dockerfile`) has three targets:
- `builder` - Builds static assets and compiles Bun server to binary
- `production` - Minimal image with standalone `ponix-web` executable
- `development` - Hot reload with Vite dev server

Production builds to a single executable using `bun build --compile`.

### Tilt Integration

The Tiltfile includes the backend from `../ponix-rs/Tiltfile`, starting:
- All backend services (NATS, Postgres, ClickHouse, EMQX, OTEL)
- The `ponix-all-in-one` backend service on port 50051
- The web UI on port 5173 (dev) or 3000 (prod)

Services communicate via the `ponix` Docker network.

### Environment Variables

- `VITE_API_URL` - Backend gRPC-Web endpoint (default: `http://ponix-all-in-one:50051`)

Access in code: `import.meta.env.VITE_API_URL`

## Development Notes

- Plans and requirements are documented in `.thoughts/ui/`
- shadcn components go in `apps/web/src/components/ui/`
- The `cn()` utility in `@/lib/utils` merges Tailwind classes
