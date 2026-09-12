# Project Stack

## Purpose

Defines the Svelte and SvelteKit toolchain that the project must run on. The project builds and runs on the SvelteKit 3 release candidate with Svelte 5.

## ADDED Requirements

### Requirement: Project runs on the SvelteKit 3 toolchain
The project MUST build and run with SvelteKit 3 release candidate, Svelte 5.57 or newer, adapter-auto 8, and vite-plugin-svelte 7. A release candidate is a near-final build for testing.

#### Scenario: Development server starts
- **WHEN** the developer starts the dev server
- **THEN** the server runs without a version error

#### Scenario: Production build passes
- **WHEN** the developer builds the project
- **THEN** the build completes without errors

### Requirement: Project source uses runes style
The project source code MUST use runes. Runes are the Svelte syntax for reactive state. The vite plugin MUST force runes for project files.

#### Scenario: Runes compile in components
- **WHEN** a component file uses `$state` or `$props`
- **THEN** the type check accepts the file

### Requirement: TypeScript uses the SvelteKit configuration
The `tsconfig.json` file MUST extend the type configuration that SvelteKit 3 generates.

#### Scenario: Type check reads the configuration
- **WHEN** the developer runs the type check
- **THEN** the check uses the SvelteKit 3 type configuration

### Requirement: src/lib imports use the hashtag shortcut
Code MUST import from `src/lib` with the `#lib` shortcut. `$lib` is the shortcut for `src/lib` in SvelteKit 2. `#lib` is the subpath import in SvelteKit 3.

#### Scenario: Layout imports the favicon
- **WHEN** the type check resolves the favicon import in `+layout.svelte`
- **THEN** the import resolves to `src/lib/assets/favicon.svg`

### Requirement: Quality commands pass
The type check, lint, and build commands MUST finish with a zero exit code.

#### Scenario: All commands pass
- **WHEN** the developer runs the type check, lint, and build commands
- **THEN** each command finishes with a zero exit code