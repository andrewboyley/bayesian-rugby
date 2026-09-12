## Context

The app is a blank SvelteKit 3 project with no styling system. The build uses Vite 8 and the SvelteKit plugin in vite.config.ts. The page renders only the empty graph viewer frame. The taste design system (OpenCode-design-analysis, attached to this change) defines the visual language the app will use: one monospaced font on a warm cream canvas, ink text, 4px interactive radius, hairline borders, and semantic accent colors. Tailwind CSS v4 uses CSS-first configuration with no tailwind.config.js file. daisyUI 5 requires Tailwind CSS 4 and loads through the @plugin directive.

## Goals / Non-Goals

**Goals:**
- Install Tailwind CSS v4 and daisyUI 5 as devDependencies.
- Register the Tailwind Vite plugin in vite.config.ts.
- Add a global CSS entry with Tailwind, daisyUI, and taste design tokens.
- Define the taste tokens as CSS variables, including a monospaced font stack and the canvas background color.
- Override the daisyUI light theme so component colors match the taste palette.
- Keep the graph page blank.

**Non-Goals:**
- No graph UI, components, or pages are built in this change.
- No web font is downloaded or bundled. The font token uses installed faces and a fallback chain.
- No dark mode or theme switcher.
- No change to how the sigma graph renders.

## Decisions

### 1. Use the @tailwindcss/vite plugin, not PostCSS
Tailwind CSS v4 recommends the first-party Vite plugin for faster builds and automatic content detection. The plugin compiles the CSS directly during the SvelteKit build. PostCSS setup would add a config file and an extra pipeline step. The plugin is added to the plugins array before the SvelteKit plugin in vite.config.ts.

### 2. Configure tokens and daisyUI in CSS, not in a config file
Tailwind v4 deprecates tailwind.config.js. Tokens are declared as CSS variables inside an @theme block in the stylesheet. daisyUI loads with `@plugin "daisyui"` and the light theme is overridden with `@plugin "daisyui/theme"` so component colors resolve to the taste palette. No config file is created.

### 3. Add a single global stylesheet entry at src/app.css
The stylesheet holds the Tailwind import, the daisyUI plugin import, a base-layer rule for the body background, and all taste tokens. +layout.svelte imports the stylesheet, which is how SvelteKit wires global CSS without touching app.html.

### 4. Use the taste color and type tokens verbatim
The token values come from the taste system unchanged: canvas #fdfcfc, ink #201d1d, ink-deep #0f0000, charcoal #302c2c, body #424245, mute #646262, stone #6e6e73, ash #9a9898, surface-soft #f8f7f7, surface-card #f1eeee, hairline rgba(15,0,0,0.12), hairline-strong #646262, and the semantic ramp (accent #007aff, warning #ff9f0a, danger #ff3b30, success #30d158). The font stack leads with Berkeley Mono and falls back through JetBrains Mono, IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, and Courier New. The interactive radius is 4px.

### 5. Move the body background from app.html into the stylesheet
app.html keeps the html/body height sizing, which the project convention reserves for it. The inline background color #f4f4f6 moves out and the base layer sets the body to the taste canvas color #fdfcfc. The page stays visually blank, since a background color alone does not create a contentful paint.

## Risks / Trade-offs

[The Vite plugin could conflict with the SvelteKit plugin order] -> Register the Tailwind plugin first and run `just build` early to confirm both compile together.

[daisyUI 5 may not match a rose Tailwind 4 version] -> Pin both packages to known current versions and record them in package.json.

[The taste font is a paid commercial font] -> The font token uses a documented fallback chain, so any monospaced face renders acceptably until a web font is added later.

[Token overrides could miss daisyUI variables] -> The theme override maps every brand-facing daisyUI variable the taste palette names, and the just build step compiles the result.

## Migration Plan

1. Save rollback copies of the files this change will touch.
2. Install tailwindcss, @tailwindcss/vite, and daisyui as devDependencies.
3. Register the Tailwind plugin in vite.config.ts.
4. Create src/app.css with imports, tokens, and the body background rule.
5. Import the stylesheet from +layout.svelte and remove the inline body background from app.html.
6. Update AGENTS.md so the Code layout section names the stylesheet and the tokens.
7. Run `just check`, `just lint`, and `just build`.
8. Start the dev server and confirm the blank page loads without console errors.

To roll back, restore the saved copies, uninstall the three packages, and rerun the quality commands.

## Open Questions

None that change the specs, the approach, or the tasks.