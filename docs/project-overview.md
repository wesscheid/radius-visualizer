# Project Overview

Radius Visualizer is a specialized geospatial tool designed to allow users to create, visualize, and manage proximity radii on an interactive map. It is built for speed and precision, using real-time state synchronization between React and the Google Maps API.

## 🎯 Core Objectives

1.  **Precision Visualization:** Accurately render circular radii based on real-world coordinates and measurements.
2.  **Interactive Editing:** Provide a "no-latency" feel when dragging points or resizing radii directly on the map.
3.  **Clean UI:** A minimal, non-intrusive interface that focuses on the map data.

## ✨ Key Features

*   **Interactive Map:** Powered by `@vis.gl/react-google-maps`.
*   **Radius Creation:** Add points by clicking the map or searching for specific addresses.
*   **Real-time Synchronization:** Radius updates (drag/resize) reflect instantly in the sidebar and state.
*   **Zustand State Management:** High-performance, reactive state that avoids unnecessary re-renders.
*   **Geocoding:** Integrated Google Maps Geocoder for location search.

## 🗺 Roadmap

| Feature | Status | Priority |
| :--- | :--- | :--- |
| **Radius Management** | ✅ Complete | High |
| **Search/Geocoding** | ✅ Complete | High |
| **Overlap Detection** | ⏳ Planned | Medium |
| **Units Toggle (mi/km)**| ⏳ Planned | Medium |
| **Persistence (Firebase)**| ⏳ Planned | Low |
| **Export (KML/CSV)** | ⏳ Planned | Low |

## 🛠 Tech Stack

*   **Frontend:** React 18, TypeScript
*   **Styling:** Tailwind CSS, Lucide Icons
*   **Maps:** Google Maps Platform (`@vis.gl/react-google-maps`)
*   **State:** Zustand
*   **Build Tool:** Create React App (CRA) / Webpack
