# Ponix UI Tiltfile
# This starts the UI and includes the backend services

# Include the backend Tiltfile to start all backend services
include('../ponix-rs/Tiltfile')

# Build the web UI Docker image for development
docker_build(
    'ponix-web:latest',
    context='.',
    dockerfile='./apps/web/Dockerfile',
    target='development',
    live_update=[
        # Sync source files for hot reload
        sync('./apps/web/src', '/app/apps/web/src'),
        sync('./apps/web/index.html', '/app/apps/web/index.html'),
        sync('./apps/web/vite.config.ts', '/app/apps/web/vite.config.ts'),
        sync('./packages/shared/src', '/app/packages/shared/src'),
    ],
    only=[
        './apps/web',
        './packages/shared',
        './package.json',
        './bun.lock',
    ],
    ignore=[
        '**/node_modules',
        '**/dist',
        '**/.vite',
        '**/*.md',
    ]
)

# Run the UI via Docker Compose
docker_compose('./docker/docker-compose.yaml')

# Configure the web UI resource
dc_resource('ponix-web', labels=['ui'])
