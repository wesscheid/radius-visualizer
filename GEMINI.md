# Radius Visualizer - Project Status & Roadmap

## 🧠 Learnings & Actions

*   **Structural Refactoring (2026-01-15):** Consolidated the project from a nested `web/` directory to the root level. All configuration files (`package.json`, `tailwind.config.js`, etc.) and the `google-cloud-sdk` are now in the root.
*   **Documentation Initialization:** Created a comprehensive documentation suite in `./docs/`.
*   **Data Persistence (2026-01-16):** Implemented Firebase Anonymous Authentication and Firestore synchronization. Data now persists across sessions without requiring a formal login.
*   **Geolocation:** Added "Zoom to Current Location" functionality using the browser's Geolocation API.
*   **Production Deployment:** Successfully deployed to Vercel with automatic CI/CD from the `main` branch.

---

## 🚀 Status Dashboard

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **Interactive Map** | ✅ Active | Powered by `react-leaflet` (OpenStreetMap/CartoDB) |
| **Radius Creation** | ✅ Active | Click map or Toolbar button to add points |
| **Search & Geocoding** | ✅ Active | Integrated with `useStore` |
| **Radius Management** | ✅ Active | Sidebar for list view and individual controls |
| **Real-time Editing** | ✅ Active | Draggable markers with synced state |
| **State Management** | ✅ Active | Powered by `Zustand` with Firestore sync |
| **Data Persistence** | ✅ Active | Firebase Anonymous Auth + Firestore |
| **Geolocation** | ✅ Active | "Locate" button in toolbar |
| **Overlap Detection** | ⏳ Planned | Visual crosshatch for intersections |
| **Export (KML/CSV)** | ⏳ Planned | Modal for file generation |

---

## 🛠 Current Tech Stack

*   **Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Mapping:** [React Leaflet](https://react-leaflet.js.org/) (Leaflet wrapper for React)
*   **Database/Auth:** [Firebase](https://firebase.google.com/) (Firestore & Anonymous Auth)
*   **State:** [Zustand](https://zustand-demo.pmnd.rs/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Deployment:** [Vercel](https://vercel.com/)

---

## 🏗 Project Structure

```text
/
├── src/
│   ├── components/      # MapComponent, Sidebar, Toolbar, AuthGuard
│   ├── store/           # useStore.ts (Zustand + Firestore logic)
│   ├── utils/           # formatters & helpers
│   ├── firebase.ts      # Firebase configuration
│   └── App.tsx          # App Entry & Layout
├── public/              # Static assets
├── tailwind.config.js   # Custom styling configuration
└── firestore.rules      # Database security rules
```

---

## 🗺 Implementation Details

### State & Persistence
We use **Zustand** for local state and **Firestore** for persistence.
- **AuthGuard:** Automatically signs users in anonymously.
- **Real-time Sync:** `onSnapshot` in `AuthGuard` keeps the Zustand store in sync with Firestore.
- **Optimistic Updates:** Store actions update Firestore, and the listener handles the state refresh.

### Map Interaction
- **Leaflet Integration:** Switched from Google Maps to Leaflet/OpenStreetMap for better flexibility and cost-effectiveness.
- **Zoom to Location:** Uses `navigator.geolocation` to set the `mapCenter` in the store.

---

## 📝 Roadmap & Next Steps

1.  **Overlap Logic:** Implement a calculation to detect intersecting circles and apply a custom SVG pattern.
2.  **Units Toggle:** Add ability to switch between Miles and Kilometers.
3.  **Account Upgrading:** Allow anonymous users to link a Google account to keep their data permanently across devices.
4.  **Export:** Add KML/CSV export for GIS compatibility.

---

## 💻 Development Guide

### Prerequisites
*   Node.js (LTS recommended)
*   Firebase Project (configured in `src/firebase.ts`)

### Running the Web App
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm start
    ```

### Deployment
The project is connected to Vercel. Pushing to `main` triggers a production build.
To manually deploy:
```bash
npx vercel --prod
```