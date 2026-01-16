# System Architecture

The Radius Visualizer follows a reactive data flow pattern where the UI and the Map are synchronized via a centralized Zustand store.

## 🏗 Technical Stack

*   **View Layer:** React 18 (Functional Components)
*   **Mapping Engine:** Google Maps JavaScript API (via `@vis.gl` wrapper)
*   **State Orchestration:** Zustand
*   **Styling Engine:** Tailwind CSS

## 🔄 Data Flow Architecture

```ascii
┌────────────────────────────────┐
│         Zustand Store          │
│   (radii, mapState, actions)   │
└───────────────┬────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
┌───────────────┐  ┌───────────────┐
│ React UI      │  │ Google Maps   │
│ (Sidebar/Tool)│  │ (Imperative)  │
└───────┬───────┘  └───────┬───────┘
        │               │
        └───────┬───────┘
                ▼
      [ User Interaction ]
 (Click, Drag, Input, Search)
```

## 🛠 Map Synchronization Logic

A key architectural challenge is syncing React's declarative state with Google Maps' imperative nature.

1.  **State -> Map:** When `radii` state changes in Zustand, the `RadiusCircle` component (using `useEffect`) calls `circle.setOptions()` or `circle.setRadius()` on the underlying Google Maps objects.
2.  **Map -> State:** When a user interacts with the map (e.g., drags a circle), Google Maps fires an event. A listener in the `RadiusCircle` component captures the new coordinates and dispatches an `updateRadius` action to the Zustand store.

## 🌐 Geocoding Flow

1.  User enters address in `App.tsx` search bar.
2.  `handleSearch` uses the `google.maps.Geocoder` service.
3.  On success, `addRadius` is called with the returned Lat/Lng.
4.  The map center is updated via `setMapCenter` to focus on the new result.
