# Settings Panel Specification

## Purpose

Defines which settings the app shows in the settings panel. The panel offers the adjustments that a person who uses the graph can understand. It hides values that only a developer or a test needs.

## Requirements

### Requirement: The settings panel shows only user-facing settings

The system SHALL show in the settings panel only the settings that a user of the graph can adjust. The system SHALL keep renderer tuning values and fixed constants out of the settings panel.

#### Scenario: Renderer tuning values stay hidden

- **WHEN** a user opens the settings panel
- **THEN** the panel does not show the coarse picking, normal picking, or golden angle fields

#### Scenario: User settings stay visible

- **WHEN** a user opens the settings panel
- **THEN** the panel shows camera framing settings, rendering appearance settings, and layout rate settings