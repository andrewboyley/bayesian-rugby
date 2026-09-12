# Visual System Specification

## Purpose

Defines the shared styling foundation of the app. The app builds its styles with Tailwind CSS v4 and carries the design tokens from the taste design system (OpenCode-design-analysis). One design language applies to every future interface.

## Requirements

### Requirement: The app compiles styles through Tailwind CSS only
The system SHALL compile component styles through Tailwind CSS v4, loaded by the Vite plugin. The project MUST NOT depend on the daisyUI component library.

#### Scenario: Built CSS contains Tailwind output
- **WHEN** the project builds
- **THEN** the built CSS bundle contains generated Tailwind rules

#### Scenario: Built CSS contains no daisyUI rules
- **WHEN** the project builds
- **THEN** the built CSS bundle contains no daisyUI component styles

### Requirement: The app exposes design tokens from the design system
The system SHALL define the taste design tokens in the Tailwind theme of the global stylesheet, and each token SHALL generate a Tailwind utility class. The tokens cover the canvas, ink, primary, surface, hairline, accent, and status colors, the monospaced font stack, the type scale with weights and line heights, the 4px interactive radius, and the spacing scale.

#### Scenario: Canvas background renders
- **WHEN** the browser paints the page background
- **THEN** the background computes to the canvas color #fdfcfc

#### Scenario: Font stack is monospaced
- **WHEN** the browser reads the base font family
- **THEN** the font family lists a monospaced face before any generic fallback

#### Scenario: Token utilities resolve
- **WHEN** a component uses a Tailwind utility class such as `bg-canvas` or `text-mute`
- **THEN** the utility resolves to the matching token value

### Requirement: The app shell uses DESIGN.md tokens
The system SHALL render the home page as the DESIGN.md app shell. The shell is built from Tailwind utilities that resolve to the design tokens.

#### Scenario: Graph panel renders
- **WHEN** the dev server serves the home page
- **THEN** the graph panel, the monospaced header, and the status strip render with no console errors

#### Scenario: Dark surface stays on the graph panel
- **WHEN** the browser paints the home page
- **THEN** the dark `surface-dark` color appears only in the graph viewer area