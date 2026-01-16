# Radius Visualizer - Project Status & Roadmap

## 🧠 Learnings & Actions

*   **Structural Refactoring (2026-01-15):** Consolidated the project from a nested `web/` directory to the root level. All configuration files (`package.json`, `tailwind.config.js`, etc.) and the `google-cloud-sdk` are now in the root to ensure standard React and CLI tool compatibility.
*   **Documentation Initialization:** Created a comprehensive documentation suite in `./docs/` covering architecture, standards, and deployment.
*   **Operational Mode:** Activated "Proactive Mode"—I will autonomously leverage `gcloud`, extensions, and MCP tools to resolve tasks, noting significant actions here for persistence.
*   **CLI Environment:** Verified `gcloud CLI (552.0.0)` is functional and accessible.

---

## 🚀 Status Dashboard

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **Interactive Map** | ✅ Active | Powered by `@vis.gl/react-google-maps` |
| **Radius Creation** | ✅ Active | Click map or Search to add points |
| **Search & Geocoding** | ✅ Active | Google Maps Geocoder integration |
| **Radius Management** | ✅ Active | Sidebar for list view and individual controls |
| **Real-time Editing** | ✅ Active | Drag & Resize directly on map (when selected) |
| **State Management** | ✅ Active | Powered by `Zustand` for high performance |
| **Overlap Detection** | ⏳ Planned | Visual crosshatch for intersections |
| **Data Persistence** | ⏳ Planned | Firebase/Firestore integration |
| **Export (KML/CSV)** | ⏳ Planned | Modal for file generation |

---

## 🛠 Current Tech Stack

*   **Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Mapping:** [@vis.gl/react-google-maps](https://visgl.github.io/react-google-maps/) (Official React components for Google Maps)
*   **State:** [Zustand](https://zustand-demo.pmnd.rs/) (Lightweight, robust state management)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Utilities:** `uuid` for unique identifiers, `clsx` & `tailwind-merge` for dynamic classes.

---

## 🏗 Project Structure

```text
web/
├── src/
│   ├── components/      # MapComponent, Sidebar, Toolbar
│   ├── store/           # useStore.ts (Zustand store)
│   ├── utils/           # formatters (e.g., meters to miles)
│   └── App.tsx          # Main layout & Search logic
└── tailwind.config.js   # Custom styling configuration
```

---

## 🗺 Implementation Details

### State Management (`zustand`)
We use a centralized store in `web/src/store/useStore.ts` to manage:
*   `radii`: List of all active radius points.
*   `selectedRadiusId`: Currently active point for editing/focus.
*   `mapCenter`/`zoom`: Synchronized map state.

### Map Interaction
*   **Adding Points:** Clicking anywhere on the map triggers `addRadius` at that coordinate.
*   **Editing:** When a radius is selected, it becomes `editable` and `draggable`. Google Maps handles the imperative updates, which we sync back to Zustand via event listeners (`radius_changed`, `dragend`).

---

## 📝 Roadmap & Next Steps

1.  **Overlap Logic:** Implement a calculation to detect intersecting circles and apply a custom SVG pattern or highlight.
2.  **Units Toggle:** Add ability to switch between Miles and Kilometers.
3.  **Persistence:** Connect to Firebase to allow saving "Sessions" or "Projects".
4.  **UI Polish:** Implement the "Floating Toolbar" from the original design prompt (Bottom Left actions).

---

## 💻 Development Guide

### Prerequisites
*   Node.js (LTS recommended)
*   Google Maps API Key (configured in `.env`)

### Running the Web App
1.  Navigate to the web directory:
    ```bash
    cd web
    ```
2.  Install dependencies (Critical if you see 'react-scripts not found'):
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm start
    ```

### Troubleshooting
*   **'react-scripts' is not recognized:** Ensure you have run `npm install` inside the `web/` directory. If using WSL, ensure your node environment is properly synced.
*   **Map not loading:** Check the `.env` file for a valid `REACT_APP_GOOGLE_MAPS_API_KEY`.
