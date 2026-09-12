## Purpose

Defines the shared styling foundation of the app. The app builds its styles with Tailwind CSS v4 and daisyUI 5, and carries the design tokens from the taste design system (OpenCode-design-analysis). One design language applies to every future interface.

## ADDED Requirements

### Requirement: The app compiles styles through Tailwind CSS
The system SHALL compile component styles through Tailwind CSS v4, loaded by the Vite plugin, and extend those styles with the daisyUI component classes.

#### Scenario: Built CSS contains Tailwind output
- **WHEN** the project builds
- **THEN** the built CSS bundle contains generated Tailwind rules

#### Scenario: Built CSS contains daisyUI output
- **WHEN** the project builds
- **THEN** the built CSS bundle contains daisyUI component styles

### Requirement: The app exposes design tokens from the design system
The system SHALL define the taste design tokens as CSS variables in the global stylesheet. The tokens cover the canvas and ink colors, the surface and hairline colors, the monospaced font stack, the 4px interactive radius, and the spacing scale.

#### Scenario: Canvas background renders
- **WHEN** the browser paints the page background
- **THEN** the background computes to the canvas color #fdfcfc

#### Scenario: Font stack is monospaced
- **WHEN** the browser reads the base font family
- **THEN** the font family lists a monospaced face before any generic fallback

### Requirement: daisyUI components use the taste theme
The system SHALL map the daisyUI component colors to the taste palette through a light theme override.

#### Scenario: Primary button color matches ink
- **WHEN** a component uses the daisyUI btn class
- **THEN** the button background uses the ink token instead of the daisyUI default

### Requirement: The styling setup does not change the visible page
The system SHALL keep the home page blank after the styling foundation is enabled.

#### Scenario: Blank graph viewer renders
- **WHEN** the dev server serves the home page
- **THEN** the graph viewer frame renders without console errors