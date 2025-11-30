# Build stage - build static assets and compile server
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock ./

# Copy workspace packages
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Build the static assets
WORKDIR /app/apps/web
RUN bun run build

# Compile the server to a standalone executable
RUN bun build ./server.ts --compile --minify --outfile=ponix-web

# Production stage - minimal image with just the executable
FROM debian:bookworm-slim AS production

# Install ca-certificates for HTTPS support
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the compiled executable
COPY --from=builder /app/apps/web/ponix-web ./ponix-web

# Copy the built static assets
COPY --from=builder /app/apps/web/dist ./dist

ENV PORT=3000
ENV DIST_DIR=/app/dist

EXPOSE 3000

CMD ["./ponix-web"]

# Development stage - hot reload with Vite
FROM oven/bun:1 AS development

WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock ./

# Copy workspace packages
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

WORKDIR /app/apps/web

EXPOSE 5173

CMD ["bun", "run", "dev", "--host", "0.0.0.0"]
