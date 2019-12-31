# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

## [0.1.0] - 2020-1-1

### Added

- Non-xdot graph layout algorithm based on following things
  - Optional KamadaKawai initial layout
  - Optional BarnesHut physics layout
  - Optional linear multi-component layout
- Graph type
  - Box shape
  - Xdot for drawing shape according to xdot draw attributes
- Node type
  - Box shape
  - Record shape, which is for record node in Graphviz, an record label
    parser is implemented
  - Table shape, which is for HTML node in Graphviz
  - Xdot for drawing shape according to xdot draw attributes
- Edge type
  - Straight
  - Quadratic
  - Xdot for drawing shape according to xdot draw attributes
- Dot scanner and dot parser (including draw attribute parser)
- Multiple examples
- UI
  - Consists of Main panel and collapsible Side panel
  - Thumbnail
  - Side panel consists of
    - Input panel
    - Settings panel
  - Capable of drag elements and highlight them

[Unreleased]: https://git.tsmart.tech/Tsmart/vfg-visualizer/compare/v0.1.0...HEAD
[0.1.0]: https://git.tsmart.tech/Tsmart/vfg-visualizer/tree/v0.1.0
