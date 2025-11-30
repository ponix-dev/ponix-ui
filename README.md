# Ponix UI

Web interface for the Ponix IoT platform. Manages organizations, gateways, and end devices through a React-based dashboard.

## Prerequisites

- [mise](https://mise.jdx.dev/) (or manually install Bun and Tilt)
- Docker (for running with backend services)

## Quick Start

```bash
# Install tools
mise install

# Install dependencies
bun install

# Start development server (UI only)
bun run dev

# Start full stack with backend (requires ../ponix-rs)
tilt up
```

## Project Structure

```
ponix-ui/
├── apps/
│   └── web/                 # React + Vite web application
│       ├── src/
│       │   ├── components/  # React components
│       │   │   └── ui/      # shadcn/ui components
│       │   ├── lib/         # Utilities
│       │   └── hooks/       # Custom hooks
│       ├── server.ts        # Production server (compiles to binary)
│       └── Dockerfile
├── packages/
│   └── shared/              # Shared types and utilities
│       └── src/types/       # Domain types (Organization, Gateway, EndDevice)
├── docker/                  # Docker Compose files
├── Tiltfile                 # Development orchestration
└── .thoughts/               # Planning documents
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Vite dev server |
| `bun run build` | Build production assets |
| `bun run typecheck` | Type check all packages |
| `bun run lint` | Lint all packages |
| `tilt up` | Start UI + backend services |
| `tilt down` | Stop all services |

## Adding UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) for components:

```bash
cd apps/web
bunx shadcn@latest add button
bunx shadcn@latest add card
bunx shadcn@latest add form
```

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: React 19
- **Build**: Vite 7
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (New York style)
- **Icons**: Lucide React

## Backend Integration

The UI connects to the Ponix backend via gRPC-Web. When running with Tilt, the backend is available at `http://ponix-all-in-one:50051`.

See [backend requirements](.thoughts/ui/backend-requirements.md) for API details.

## Docker

Build and run the production image:

```bash
# Build
docker build -t ponix-web:latest --target production -f apps/web/Dockerfile .

# Run
docker run -p 3000:3000 ponix-web:latest
```

The production image uses a compiled Bun executable (~90MB total).
