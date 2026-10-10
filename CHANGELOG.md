# Changelog

All notable changes to Molecular Studio are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed

- `BondDetails` called a store hook after an early return (rules-of-hooks
  violation) — hooks now run unconditionally at the top of the component.
- Atom dragging no longer mutates the `OrbitControls` instance from an event
  handler. Drag state lives in the zustand store (`dragging`) and the canvas
  disables controls declaratively via `enabled={!dragging}`.
- Removed dead first-mount branch in `CameraRig` — framing runs uniformly on
  mount, preset load, and empty scene.

### Changed

- Editor centroid math consolidated into a single `centerOf` helper backed by
  `chemistry.centroid` (was copy-pasted in two click handlers).
- Prettier enforced repo-wide (`singleQuote`, `printWidth: 120`,
  `bun run format`); fixed `ReactNode` type import and stable formula keys in
  the top bar.

## [1.0.0] — 2026-10-10

Vibe code jam release.

### Added

- Real-time 3D visualization (React Three Fiber): orbit / zoom / pan, damped
  controls, auto-rotate showcase, studio lighting with local Lightformers
  (no external HDR), starfield, soft contact shadows.
- Three display modes: Ball & Stick, Space Fill (van der Waals radii),
  Wireframe; adjustable atom size and bond thickness; atom labels.
- Interactive editor: Select (drag atoms on a camera-facing plane), Add Atom
  (auto-bonds at real covalent lengths), Bond (two-click gesture), Delete.
- 13-element palette with true CPK colors, undo/redo across 50 steps.
- Bond order cycling Single / Double / Triple; geometric auto-bond detection
  (`1.35×` covalent radii sum).
- Inspector panel: Hill-notation formula with subscripts, molar mass, element
  composition bars, atomic data (Z, mass, electronegativity, radii, electron
  configuration), bond analysis (length, ΔEN, polarity class), bond angles,
  net dipole estimate with 3D arrow, radius of gyration.
- 13-molecule preset library (water to C60 buckyball with generated
  truncated-icosahedron geometry), surprise-me random loader, empty scene.
- Thermal vibration mode with per-atom phase offsets.
- Export XYZ files, snapshot PNGs, URL share links (`#m=` base64 payload
  with strict validation, 500-atom cap).
- Keyboard shortcuts: `V/A/B/D` tools, `Ctrl+Z` undo, `Ctrl+Shift+Z` redo,
  `Esc` deselect / cancel / close. Fullscreen mode.
- App icon set + cover art, animated SVG demo, OG/Twitter meta tags.
