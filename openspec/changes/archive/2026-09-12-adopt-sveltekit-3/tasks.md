# Tasks: Adopt SvelteKit 3

## 1. Baseline

- [x] 1.1 Save a rollback copy of `package.json`, `tsconfig.json`, and `+layout.svelte`.
- [x] 1.2 Record the current dependency versions from `package.json`.

## 2. Dependency upgrade

- [x] 2.1 Run the command `npx sv@next migrate sveltekit-3` in the project root.
- [x] 2.2 Make sure that `package.json` has the target versions from `design.md`.
- [x] 2.3 Run `npm install` to apply the new versions.

## 3. Configuration migration

- [x] 3.1 Point `tsconfig.json` at the type configuration that SvelteKit 3 generates.
- [x] 3.2 Remove the compiler options that the generated configuration covers.
- [x] 3.3 Add the `#lib` subpath import to `package.json`.
- [x] 3.4 Make sure that no `svelte.config.js` file exists.

## 4. Source migration

- [x] 4.1 Change the favicon import in `+layout.svelte` to the `#lib` shortcut.
- [x] 4.2 Search the source for removed patterns: `$lib`, `$app/stores`, `$env`, and `$service-worker`. Fix every hit.

## 5. Verification

- [x] 5.1 Run `just check` and fix any diagnostics.
- [x] 5.2 Run `just lint` and fix any findings.
- [x] 5.3 Run `just build` and make sure that the build succeeds.
- [x] 5.4 Start the dev server. Confirm that the page loads with no console errors.