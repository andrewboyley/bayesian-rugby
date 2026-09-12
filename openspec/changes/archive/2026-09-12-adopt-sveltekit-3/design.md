# Design: Adopt SvelteKit 3

## Context

The project is a new SvelteKit app with a blank page. Sigma and graphology are installed but unused. The vite configuration already passes adapter and compiler options to the SvelteKit plugin. No `svelte.config.js` file exists. The source has three components. Only one import uses the `$lib` shortcut. See `proposal.md` for the motivation.

## Goals / Non-Goals

**Goals:**

- Move the project to the SvelteKit 3 release candidate era with a small diff.
- Keep the page blank and the app behavior unchanged.
- Keep the runes setting until Svelte 6 removes the need for it.

**Non-Goals:**

- Install Svelte 6. Svelte 6 is not published yet.
- Load the graph or wire sigma into the page.
- Change the adapter from adapter-auto.

## Decisions

1. Use the official migrator first. The command `npx sv@next migrate sveltekit-3` handles the automatic parts of the move. It rewrites imports, the TypeScript configuration, and the package aliases. The alternative was to edit every file by hand. Hand edits risk missing a moved type or import location.

2. Set the target versions in `package.json`: `svelte` ^5.57.0, `@sveltejs/kit` 3.0.0-next.27, `@sveltejs/adapter-auto` 8.0.0-next.4, `@sveltejs/vite-plugin-svelte` ^7.3.0. These versions clear all SvelteKit 3 minimums. The alternative was to stay on SvelteKit 2. The user chose the release candidate era instead.

3. Define the `#lib` shortcut with subpath imports in `package.json`. SvelteKit 3 does not generate `$lib` as an alias. Subpath imports work in Vite and TypeScript. The alternative was a tsconfig path alias, which SvelteKit 3 does not use.

4. Keep the runes option in `vite.config.ts`. Svelte 5 does not default to runes mode. The comment in the config says Svelte 6 makes runes the default. The option comes out when the project moves to Svelte 6.

5. Point `tsconfig.json` at the type configuration that SvelteKit 3 generates. The generated configuration adds the recommended compiler options. We then remove the compiler options that the generated configuration covers.

## Risks / Trade-offs

- [The next-tag versions move often] -> Record the chosen versions in the proposal. Fix the exact version during apply.
- [The migrator rewrites more than we want] -> Review the diff after the migrator runs. Keep the change small.
- [The generated TypeScript configuration changes strictness] -> Run the type check after the move. Fix any new diagnostics.
- [SvelteKit 3 moves import names we do not use yet] -> The source is tiny. Grep the source for the removed patterns named in the migration guide.

## Migration Plan

1. Run `npx sv@next migrate sveltekit-3` in the project root.
2. Fix what the migrator leaves: the `#lib` subpath imports in `package.json`, the favicon import in `+layout.svelte`, and the `tsconfig.json` source of truth.
3. Run the type check, lint, and build commands. Fix any diagnostics they report.
4. Start the dev server. Confirm the page loads with no console errors.
5. Rollback if the quality commands fail: restore `package.json`, `tsconfig.json`, and `+layout.svelte` from the pre-change state.

## Open Questions

- The exact path that `tsconfig.json` will extend after the migrator runs. The migrator writes it. The path does not change the spec or the tasks.