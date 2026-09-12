## Why

The app shell never uses daisyUI classes. Every style runs through the taste tokens in `src/app.css`. daisyUI adds a component layer, a theme override, and a bundle cost that the interface never touches. One styling source is enough: Tailwind CSS v4 built from the tokens in `DESIGN.md`.

## What Changes

- Remove the daisyui devDependency. The project styles everything with Tailwind utilities. **BREAKING** for any future use of daisyUI classes.
- Remove the two daisyUI plugin blocks from `src/app.css`: `@plugin "daisyui"` and `@plugin "daisyui/theme"`.
- Remove `data-theme="light"` from `src/app.html`. The attribute only has meaning for daisyUI.
- Complete the Tailwind theme token set so every token in `DESIGN.md` generates a utility class. Add the `primary` color. Add the type scale sub-keys (font weight, line height, letter spacing) for each text token.
- Rewrite the scoped style blocks in `src/routes/+page.svelte` and `src/lib/components/GraphViewer.svelte` as Tailwind utility classes. Each class maps to a `DESIGN.md` token.
- Update the Visual System spec so it requires Tailwind utilities and no daisyUI.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `visual-system`: The spec changes so styles compile through Tailwind only, every design token generates a utility class, and the home page renders the DESIGN.md app shell.

## Impact

- `package.json` and `package-lock.json`: drop `daisyui`.
- `src/app.css`: delete daisyUI plugins, add `--color-primary` and the type sub-keys.
- `src/app.html`: drop `data-theme="light"`.
- `src/routes/+page.svelte` and `src/lib/components/GraphViewer.svelte`: replace scoped styles with Tailwind utilities. The visible page stays the same.
- `AGENTS.md`: the Code layout section no longer names daisyUI.
- `openspec/changes/add-tailwind-daisyui`: the stale active change is synced into the main specs and archived before this change applies.
- `openspec/specs/visual-system/spec.md`: the main spec records the Tailwind-only foundation.