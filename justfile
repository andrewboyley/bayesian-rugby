set dotenv-load
set shell := ["bash", "-euo", "pipefail", "-c"]

alias d := dev
alias r := restart

default: help

# List the available project commands.
[group('general')]
help:
    just --list

# Install dependencies from the lockfile.
[group('general')]
install:
    pnpm install

# Format this justfile.
[group('general')]
format:
    just --fmt

# Verify this justfile is correctly formatted.
[group('general')]
format-check:
    just --fmt --check

# Start the Vite development server in the background.
[group('development')]
dev:
    ./scripts/dev-server.sh start

# Stop the background development server.
[group('development')]
stop:
    ./scripts/dev-server.sh stop

# Restart the background development server.
[group('development')]
restart:
    ./scripts/dev-server.sh restart

# Report whether the background development server is running.
[group('development')]
status:
    ./scripts/dev-server.sh status

# Print recent development-server logs. Override with: just logs 200
[group('development')]
logs lines='100':
    ./scripts/dev-server.sh logs "{{ lines }}"

# Follow development-server logs until interrupted.
[group('development')]
follow:
    ./scripts/dev-server.sh follow

# Run Svelte and TypeScript checks.
[group('quality')]
check:
    pnpm run check

# Run ESLint.
[group('quality')]
lint:
    pnpm run lint

# Produce a production build.
[group('quality')]
build:
    pnpm run build

# Run all project quality gates.
[group('quality')]
verify: check lint build
