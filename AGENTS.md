# Rugby Graph Agent Guide

## Project

Rugby Graph is a SvelteKit application that renders an interactive Wikipedia concept network. It uses Svelte 5, SvelteKit 3, Tailwind CSS 4, Graphology, and Sigma 4.

`src/lib/components/GraphViewer.svelte` loads `public/wikipedia.json` at `/wikipedia.json`. The dataset contains the sample graph from the Sigma v4 tutorial.

## Required Skills

Before you change UI code, use the `design-taste-frontend` skill. Read `DESIGN.md` before you make the change. `DESIGN.md` defines the project visual system and takes priority over general design guidance.

The UI uses a terminal-native style. Use the documented mono font stack, cream canvas, hairline borders, ASCII markers, and 4px interactive corners. Do not add shadows, gradients, photography, unrelated icons, or a new type system.

Before you create or edit documentation, use the `simple-english` skill. This rule includes `AGENTS.md`, README files, runbooks, release notes, and code comments that explain a workflow.

## Code Intelligence

Use CodeGraph before you search for or read indexed code. Use it to locate symbols, inspect call paths, and assess the files that a change affects.

Use the `ccc` skill for semantic code search and index management. Refresh the `ccc` index after a significant code change. If the `ccc` project is not initialized, initialize and index it before you search.

## Setup

Use pnpm only. The project rejects npm because `package.json` requires pnpm 11.9.0.

```sh
pnpm install
```

## Development

Use Just for project commands:

```sh
just              # List commands
just dev          # Start Vite at http://localhost:5173
just status       # Show server status
just logs 200     # Print recent server logs
just stop         # Stop the server
just verify       # Run type checks, lint, and build
```

`scripts/dev-server.sh` manages the background Vite process. It stores the process ID and log in `.agent/`.

## Code Layout

- `src/routes/+page.svelte` mounts the application page.
- `src/lib/components/GraphViewer.svelte` builds and renders the graph.
- `src/app.css` defines Tailwind design tokens.
- `public/wikipedia.json` is a static graph asset.
- `vite.config.ts` holds the SvelteKit, Tailwind, and `public` asset configuration.
- `justfile` provides project commands.

Use the `#lib/*` import alias for code in `src/lib`. Use Svelte runes for new component state.

## Checks

Run `just verify` before you finish a code change. It runs Svelte and TypeScript checks, ESLint, and a production build.

If you change `justfile`, run `just format-check`. If you change `DESIGN.md`, run `pnpm dlx @google/design.md lint DESIGN.md`.

Use Playwright for browser behavior and performance tests. Add focused tests when you add testable behavior.

## Performance Audits

Run `just performance` before you finish a graph rendering change. It records whether its headless Chromium runner supports a WebGL GPU timer query.

For a GPU performance conclusion, use Chrome DevTools. Open `/?perf=timers`, then run a WebGL2 elapsed-time query through page script evaluation. Do not compare GPU times between different browsers, GPUs, viewports, or graph states.

## Delivery Rules

Do not change the package manager or dependency versions without a task that requires it. Do not edit `public/wikipedia.json` unless the task changes the graph dataset.

Do not commit secrets or `.env` files. The current adapter is `@sveltejs/adapter-auto`; select a deployment adapter only when the deployment target is known.
