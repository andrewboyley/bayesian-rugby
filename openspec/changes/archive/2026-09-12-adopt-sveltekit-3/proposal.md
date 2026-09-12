# Adopt SvelteKit 3

## Why

The project uses SvelteKit 2. SvelteKit 3 is the release candidate that makes the runes style standard. Runes are the Svelte syntax for reactive state. The project already writes components in runes style, so the move is small now. Moving later costs more when the graph viewer grows.

## What Changes

- Upgrade `svelte` to 5.57. SvelteKit 3 needs 5.56.4 or newer.
- Upgrade `@sveltejs/kit` to 3.0.0-next.27. **BREAKING**: this is a new major version.
- Upgrade `@sveltejs/adapter-auto` to 8.0.0-next.4. **BREAKING**: version 8 needs SvelteKit 3.
- Upgrade `@sveltejs/vite-plugin-svelte` to 7.3.0. Version 7 is the minimum for SvelteKit 3.
- Point `tsconfig.json` at the SvelteKit 3 TypeScript configuration.
- Replace the `$lib` shortcut with the `#lib` subpath import. `$lib` is the shortcut for `src/lib`. **BREAKING**: one import in `+layout.svelte` changes.
- Keep the runes setting in `vite.config.ts`. Svelte 6 will make runes the default, so the setting stays until then.

## Capabilities

### New Capabilities

- `project-stack`: requirements for the Svelte and SvelteKit toolchain, including versions, runes mode, TypeScript configuration, and quality commands.

### Modified Capabilities

- None. No existing spec files exist.

## Impact

The change touches these files:

- `package.json`: dependency versions and the `#lib` subpath import.
- `tsconfig.json`: the configuration it extends.
- `src/routes/+layout.svelte`: the favicon import path.
- `src/lib/assets/favicon.svg`: unchanged target of the import.

It does not touch the graph viewer. Sigma and graphology stay unused. The page stays blank. The dev server, type check, lint, and build must work after the change.