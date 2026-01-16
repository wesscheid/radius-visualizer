# Codebase Summary

This document provides a structural overview of the Radius Visualizer project to help developers navigate the codebase efficiently.

## 📂 Directory Structure

```text
web/
├── public/              # Static assets and index.html
├── src/
│   ├── components/      # UI components and Map logic
│   ├── store/           # Zustand store definition
│   ├── utils/           # Formatting and math utilities
│   ├── App.tsx          # Main layout and Search logic
│   └── index.tsx        # Application entry point
├── .env                 # Environment variables (API Keys)
└── tailwind.config.js   # Style configuration
```

## 🧩 Core Components

### `App.tsx`
The root component that coordinates the layout. It contains the Search Bar and wraps the `MapComponent`, `Sidebar`, and `Toolbar`.

### `components/MapComponent.tsx`
The primary interface with Google Maps. 
*   Uses `Map` from `@vis.gl/react-google-maps`.
*   Contains the `RadiusCircle` sub-component which handles the imperative `google.maps.Circle` lifecycle.
*   Listens for `click`, `dragend`, and `radius_changed` events to sync back to the global store.

### `components/Sidebar.tsx`
The management panel for existing radii.
*   Lists all active radius points.
*   Allows renaming, changing colors, and deleting points.
*   Controls visibility and selection state.

### `components/Toolbar.tsx`
Floating actions (bottom-left) for quick map controls and future features like "Clear All" or "Export".

## 💾 State Management

### `store/useStore.ts`
The single source of truth for the application. 
*   **State:** `radii`, `selectedRadiusId`, `mapCenter`, `mapZoom`, `sidebarOpen`.
*   **Actions:** `addRadius`, `updateRadius`, `removeRadius`, `selectRadius`, etc.
*   Uses `uuid` for unique identifier generation.
