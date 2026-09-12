## Context

See proposal.md - Why. The app shell renders from `src/app.css` tokens: `@theme` holds the taste colors, the Berkeley Mono font stack, the 4px radius, the type scale, and the spacing scale. The page uses scoped style blocks that reference `var(--color-*)`, `var(--text-*)`, and `var(--spacing-*)`. No markup uses a daisyUI class. The dirty parts to remove are `@plugin "daisyui"`, the `@plugin "daisyui/theme"` block, the `data-theme="light"` attribute, and the `daisyui` devDependency.

## Goals / Non-Goals

- Goal: zero daisyUI in the dependency set and in the built CSS.
- Goal: every token in `DESIGN.md` exists in `@theme` and generates a Tailwind utility class.
- Goal: the visible page keeps its current look, verified by computed styles.
- Non-Goal: no new components, no sigma wiring, no new dependencies.
- Non-Goal: no dark-mode switching. The page stays light, exactly as `DESIGN.md` describes.

## Decisions

1. **Remove daisyUI by uninstalling, not by masking.** `npm rm daisyui` updates `package.json` and `package-lock.json`. Alternative: just dropping the plugin kept a dead dependency. Uninstalling is the honest state.
2. **Keep the Tailwind tokens in `@theme`, extend the missing keys.** The tokens already exist. The additions are `--color-primary` (the brand fill, present in `DESIGN.md` but absent from `@theme`) and the type sub-keys. Tailwind v4 reads sub-keys such as `--text-headline-lg--font-weight`, `--text-headline-lg--line-height`, and `--text-headline-lg--letter-spacing` from version 4.1. We run 4.3.3, so the full type scale maps. Classes like `text-caption` then carry font size, weight, line height, and letter spacing together, matching `DESIGN.md` typography.
3. **Drop `data-theme="light"` from `app.html`.** The attribute is a daisyUI hook. Without daisyUI it has no effect. The light look stays because `@theme` tokens and the `@layer base` body rule define it.
4. **Convert components to Tailwind utilities.** `+page.svelte` and `GraphViewer.svelte` drop their `<style>` blocks for utility classes that resolve to tokens (`bg-canvas`, `text-mute`, `border-hairline-strong`, `gap-md`, `px-md`, `text-label-md`, `rounded-sm`). This makes the tokens the single styling source, per the taste skill. Alternative: keeping scoped style blocks works, but utilities prove the token-to-class mapping and remove duplicated CSS.
5. **Page height uses `min-h-dvh`.** `DESIGN.md` Layout says full-height screens use `min-height: 100dvh`. The current `.page` uses `height: 100%`. The shell becomes `min-h-dvh w-full max-w-[1400px]`, a centered column with a 16px gutter, matching `DESIGN.md` Layout.

## Risks / Trade-offs

- [Utility name collisions with Tailwind defaults] -> Confirm each class compiles. Names like `rounded-sm`, `text-md`, and `spacing-gutter` are overrides of v4 theme keys, which is the supported mechanism.
- [Removing the daisyUI theme changes `color-scheme` behavior] -> The daisyUI theme pinned light color-scheme. Without it the browser follows `prefers-color-scheme`, but only for the default form controls, never for the app's own colors. The page palette is fixed by tokens.
- [Visual drift during the rewrite] -> Verify computed styles in the browser against the recorded values (canvas #fdfcfc, ink #201d1d, hairline borders, panel radius 4px, surface-dark viewer).

## Migration Plan

1. Sync the `add-tailwind-daisyui` delta specs into the main specs and archive that change. It is the active change that introduced daisyUI, and its delta is the source of the `visual-system` main spec.
2. Save rollback copies of every touched file under `.agent/rollback-remove-daisyui/`.
3. Run `npm rm daisyui`.
4. Edit `src/app.css`: delete the daisyUI plugin lines, add `--color-primary` and the type sub-keys.
5. Edit `src/app.html`: delete `data-theme="light"`.
6. Rewrite the two components with Tailwind utilities.
7. Run `just check`, `just lint`, `just build`, and verify the browser shell.
8. Sync the `remove-daisyui` delta into the main specs and archive the change.

Rollback: restore the files from `.agent/rollback-remove-daisyui/` and run `npm install` to bring back `daisyui`.

## Open Questions

None.