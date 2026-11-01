# ShalaTrack design contract

Approved by the owner: minimalism, light purple/lavender, restrained glassmorphism, React + TypeScript, fictional interactive data. Reference: compact navigation, quiet white workspace and direct module links. Keep the ShalaTrack name. Do not copy Horizon's business modules or branding.

## Source precedence

Owner instructions > project AGENTS instructions > this approved contract > generated component defaults. The owner explicitly requested a redesign and lavender accents; do not restore the old blue palette or old card layout just because an extractor suggests retaining existing styling.

## Foundations

- Light theme only. Primary `oklch(0.5501 0.1337 292.43)`, dark action/text variant `oklch(0.4427 0.1227 294.65)`.
- Tokens originate in `src/styles/tokens.css`; application glass and semantic status roles extend them in `src/styles/app.css`.
- Inter, self-hosted with `@fontsource/inter`. The stack includes system fallbacks.
- Iconoir icons only in imported application components. Owned static SVG React components are in `src/components/icons`; no runtime icon CDN.
- Sidebar, Button, Input, StatCard, Card, Table, Select, Dialog, DropdownMenu, Command, Tabs, Notification and Popover use the installed primitives.
- Lavender is for actions and selection. Present/absent/pending use semantic colors with text. Never encode status only through color.
- Glass is a translucent shell or login preview layer; records and form controls use solid readable surfaces. No decorative heavy blur behind data tables.

## Review contract

The owner explicitly waived Better Design verification on 1 November 2026 after its review quota was exhausted. Continue with local build, interaction, accessibility and responsive checks. No successful MCP verification is claimed; no public deployment is needed for the waived review gate.

Additional local checks: build, domain tests, route inventory, original-file hash comparison, no external data connections, keyboard/focus/labels, reduced motion, loaded font, no horizontal overflow and working interactions at desktop and phone sizes.

## Milestone boundary

The first milestone established shared navigation, login and administrator overview. Following the owner's instruction to continue, implement all 39 route checklists plus per-period attendance, QR, corrections and academic-year workflows with isolated sample data. Backend-dependent verification and actual provider delivery remain simulations.
