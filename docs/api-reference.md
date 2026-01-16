# API Reference

Since Radius Visualizer is a client-side application, its "API" consists primarily of the Zustand store actions and utility functions.

## 💾 Zustand Store (`useStore`)

### `AppState` Interface

```typescript
interface Radius {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  color: string;
  opacity: number;
  visible: boolean;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  fill: boolean;
}
```

### Actions

| Action | Parameters | Description |
| :--- | :--- | :--- |
| `addRadius` | `lat: number, lng: number` | Adds a new radius at the given coordinates. |
| `updateRadius` | `id: string, updates: Partial<Radius>` | Merges updates into an existing radius point. |
| `removeRadius` | `id: string` | Deletes a radius point from the state. |
| `selectRadius` | `id: string \| null` | Sets the currently active radius for editing. |
| `setMapCenter` | `lat: number, lng: number` | Pans the map to the target coordinates. |
| `toggleSidebar` | None | Toggles the sidebar visibility. |

## 🛠 Utility Functions

### `formatRadius(meters: number): string`
Converts meters into a human-readable string (Miles and Feet).
*   **Threshold:** If < 0.25 miles, returns feet (e.g., `500 ft`).
*   **Formatting:** Returns `mi` and `ft` for larger distances (e.g., `5 mi 1,200 ft`).

## 🗺 Map Integration

The `MapComponent` uses the `@vis.gl/react-google-maps` library.
*   **Map ID:** Required for Advanced Markers (`mapId={'b2599d1eb55f8174'}`).
*   **Libraries:** Uses the `maps` library for imperative Circle drawing.
