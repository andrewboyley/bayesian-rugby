## 1. Baseline

- [x] 1.1 Save rollback copies of vite.config.ts, src/app.html, and src/routes/+layout.svelte to .agent/rollback-add-tailwind-daisyui/
- [x] 1.2 Record current dependency versions in .agent/rollback-add-tailwind-daisyui/versions.txt

## 2. Install Dependencies

- [x] 2.1 Add tailwindcss, @tailwindcss/vite, and daisyui as devDependencies in package.json
- [x] 2.2 Run npm install and confirm the installed versions

## 3. Configure the Build

- [x] 3.1 Register the Tailwind Vite plugin in vite.config.ts before the SvelteKit plugin
- [x] 3.2 Create src/app.css with the Tailwind import, daisyUI plugin, taste tokens, and body background rule
- [x] 3.3 Override the daisyUI light theme so component colors use the taste palette
- [x] 3.4 Remove the inline body background from src/app.html and keep the height sizing
- [x] 3.5 Import src/app.css from src/routes/+layout.svelte

## 4. Documentation

- [x] 4.1 Update AGENTS.md so the Code layout section names src/app.css and the design tokens

## 5. Verification

- [x] 5.1 Run just check
- [x] 5.2 Run just lint
- [x] 5.3 Run just build and confirm the built CSS contains Tailwind and daisyUI output
- [x] 5.4 Start the dev server and confirm the blank page loads without console errors