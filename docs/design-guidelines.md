# Design Guidelines

The Radius Visualizer UI is designed to be modern, professional, and accessible.

## 🎨 Color Palette

We use a standard set of TailWind colors for consistency across the application.

*   **Primary Action:** `blue-600` (#2563EB)
*   **Danger/Delete:** `red-500` (#EF4444)
*   **Background (Map UI):** `white` with `shadow-md` and `bg-gray-100` for the page background.
*   **Text:** `gray-900` for headings, `gray-600` for body/secondary text.

### Radius Colors
The application rotates through a default palette for new locations:
`Red`, `Orange`, `Amber`, `Emerald`, `Blue`, `Indigo`, `Violet`, `Pink`.

## 📐 Layout & Spacing

*   **Sidebar:** Fixed width (approx. 320px) on the left or right, floating with `z-10`.
*   **Search Bar:** Centered at the top, `max-w-md`, with subtle transparency.
*   **Toolbar:** Bottom-left floating container for global actions.

## 🖱 Interactions

*   **Selection:** Selecting a radius in the sidebar should highlight it on the map and make it "Editable/Draggable".
*   **Hover States:** All buttons and interactive list items must have a visible `:hover` state (e.g., `hover:bg-gray-50`).
*   **Transitions:** Use `transition-all duration-200` for sidebar toggling and UI fades.

## 🔠 Typography

*   **Font Stack:** Standard Sans-serif (Inter/UI Default via Tailwind).
*   **Hierarchy:**
    *   Titles: `text-lg font-bold`
    *   Subtitles/Labels: `text-sm font-medium`
    *   Metadata: `text-xs text-gray-400`
