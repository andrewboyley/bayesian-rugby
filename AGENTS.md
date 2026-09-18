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
just format-source       # Format supported source files with Oxfmt
just format-source-check # Check supported source formatting with Oxfmt
just verify              # Run type checks, Oxlint, formatting, and build
```

`scripts/dev-server.sh` manages the background Vite process. It stores the process ID and log in `.agent/`.

DO NOT DEBUG WITH SCREENSHOTS

## Code Layout

- `src/routes/+page.svelte` mounts the application page.
- `src/lib/components/GraphViewer.svelte` builds and renders the graph.
- `src/app.css` defines Tailwind design tokens.
- `public/wikipedia.json` is a static graph asset.
- `vite.config.ts` holds the SvelteKit, Tailwind, and `public` asset configuration.
- `justfile` provides project commands.

Use the `#lib/*` import alias for code in `src/lib`. Use Svelte runes for new component state.

## Checks

Run `just verify` before you finish a code change. It runs Svelte and TypeScript checks, Oxlint, Oxfmt, and a production build.

If you change `justfile`, run `just format-check`. If you change `DESIGN.md`, run `pnpm dlx @google/design.md lint DESIGN.md`.

Use Playwright for browser behavior and performance tests. Add focused tests when you add testable behavior.

## agent-browser Interaction

agent-browser drives the app through the browser for manual checks. Use Playwright for repeatable checks. Start a named session, then open the app:

```sh
export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix rugby)"
agent-browser open http://localhost:5173/
```

Run `agent-browser snapshot` before an interaction. The snapshot lists element refs such as `@e3`. The refs change when the page updates. Take a fresh snapshot after navigation or after any page change. An old ref fails.

Run `agent-browser snapshot -i` to list interactive elements only. The graph canvas appears in the full snapshot, but it has no ref. The canvas captures input through the `.sigma-mouse` overlay. Click, double-click, hover, and drag the overlay, not the canvas element.

These interactions are proven:

1. Click an element with its ref. A single click on empty canvas clears the node selection.
2. Double-click the canvas with `agent-browser dblclick .sigma-mouse`. A double-click on the canvas fits all visible nodes.
3. Pan the view with a drag, for example `agent-browser drag .sigma-mouse @e26`. Use a ref from the current snapshot as the target. The view follows the drag.
4. Hover an element with its ref. The pointer moves to the element center.
5. Zoom through a double-click, because agent-browser has no wheel action. Or call `setCamera` through `agent-browser eval`.

You cannot click a node by ref. Call `window.rugbyGraphSelectionTest.clickNode('name')` or `.doubleClickNode('name')` through `agent-browser eval` instead.

Read state through `agent-browser eval`. Call `snapshot()` on the controller for `primaryNode`, `activeNodes`, and `camera`. The camera animates after a click. Wait for it to settle before you read the camera. Do not read the on-screen "nodes N · edges N" text. It is stale.

Do not dispatch synthetic DOM events, for example `el.dispatchEvent(new MouseEvent(...))`. Sigma ignores them because they are not trusted. Use agent-browser or the controller instead.

## Performance Audits

Run `just performance` before you finish a graph rendering change. It records whether its headless Chromium runner supports a WebGL GPU timer query.

For a GPU performance conclusion, use agent-browser. Open `/?perf=timers`, then run a WebGL2 elapsed-time query through `agent-browser eval`. Do not compare GPU times between different browsers, GPUs, viewports, or graph states.

## Delivery Rules

Do not change the package manager or dependency versions without a task that requires it. Do not edit `public/wikipedia.json` unless the task changes the graph dataset.

Do not commit secrets or `.env` files. The current adapter is `@sveltejs/adapter-auto`; select a deployment adapter only when the deployment target is known.

Only run playwright tests after you have made sure the change works with agent-browser, or when an error appears. DO NOT RUN ANY PLAYWRIGHT TESTS UNLESS YOU HAVE MADE SURE THE CHANGE WORKS WITH AGENT-BROWSER
