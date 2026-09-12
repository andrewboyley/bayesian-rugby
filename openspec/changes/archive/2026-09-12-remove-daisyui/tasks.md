## 1. Baseline

- [ ] 1.1 Save rollback copies of package.json, src/app.css, src/app.html, src/routes/+page.svelte, and src/lib/components/GraphViewer.svelte to .agent/rollback-remove-daisyui/
- [ ] 1.2 Record the current versions in .agent/rollback-remove-daisyui/versions.txt

## 2. OpenSpec Baseline

- [ ] 2.1 Sync the add-tailwind-daisyui delta specs into the main specs
- [ ] 2.2 Archive the add-tailwind-daisyui change

## 3. Remove daisyUI

- [ ] 3.1 Run npm rm daisyui and confirm package.json drops the dependency
- [ ] 3.2 Delete the two daisyUI plugin blocks from src/app.css
- [ ] 3.3 Delete data-theme="light" from src/app.html

## 4. Complete the DESIGN.md Tokens

- [ ] 4.1 Add the --color-primary token to the @theme block in src/app.css
- [ ] 4.2 Add the type scale sub-keys (font weight, line height, letter spacing) for each text token

## 5. Convert Components to Tailwind Utilities

- [ ] 5.1 Rewrite src/routes/+page.svelte with Tailwind utility classes and remove the scoped style block
- [ ] 5.2 Rewrite src/lib/components/GraphViewer.svelte with Tailwind utility classes and remove the scoped style block
- [ ] 5.3 Confirm every utility class used maps to a DESIGN.md token

## 6. Documentation

- [ ] 6.1 Update AGENTS.md so the Code layout section no longer names daisyUI

## 7. Verification

- [ ] 7.1 Run just check
- [ ] 7.2 Run just lint
- [ ] 7.3 Run just build and confirm the layout CSS contains no daisyUI rules
- [ ] 7.4 Load the dev server page in the browser and confirm the shell renders with no console errors
- [ ] 7.5 Confirm the dark surface-dark color appears only in the graph viewer area

## 8. Close the Change

- [ ] 8.1 Sync the remove-daisyui delta specs into the main specs
- [ ] 8.2 Archive the remove-daisyui change