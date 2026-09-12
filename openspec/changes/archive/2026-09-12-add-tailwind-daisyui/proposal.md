## Why

The project has no styling system. The graph viewer will need a shared visual language for fonts, colors, spacing, and controls. Tailwind CSS v4 and daisyUI 5 provide that base with little configuration. The taste skill (OpenCode-design-analysis) defines the design tokens, and the new styling setup must carry those tokens.

## What Changes

- Add tailwindcss and @tailwindcss/vite as devDependencies.
- Add daisyui as a devDependency.
- Register the Tailwind Vite plugin in vite.config.ts.
- Add src/app.css. It imports Tailwind CSS, loads daisyUI, and defines the design tokens.
- Import src/app.css from +layout.svelte.
- Change the page background from #f4f4f6 to the canvas color #fdfcfc.
- Update AGENTS.md to describe the styling setup.
- Keep the graph page blank. This change wires up styling only.

## Capabilities

### New Capabilities
- `visual-system`: Provides the styling foundation of the app. The app compiles styles with Tailwind CSS v4 and daisyUI 5, and carries the taste design tokens.

### Modified Capabilities
- none

## Impact

- package.json: new devDependencies tailwindcss, @tailwindcss/vite, daisyui.
- vite.config.ts: add the Tailwind plugin.
- src/app.css: new file with Tailwind, daisyUI, and tokens.
- src/routes/+layout.svelte: import the stylesheet.
- src/app.html: page background moves from inline style to the stylesheet.
- AGENTS.md: code layout notes change.