# Changelog

All notable changes to the Radius Visualizer project will be documented in this file.

## [Unreleased]

### Added
- **Initial Setup:** React 18 boilerplate with TypeScript.
- **Interactive Map:** Google Maps integration with `@vis.gl/react-google-maps`.
- **Radius Store:** Zustand-based state management for radii points.
- **Dynamic Circles:** Imperative Google Maps Circle synchronization with React state.
- **Geocoding:** Address search bar that pans map and adds points.
- **Sidebar:** Initial management panel for listing and deleting radii.
- **Utility:** Meter-to-Mile/Feet formatter for accurate distance display.

### Changed
- Refactored `MapComponent` to handle imperative circle lifecycles more cleanly using `useEffect`.

### Fixed
- Fixed z-index issue where selected circles were hidden behind unselected markers.
