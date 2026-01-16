# Radius Visualizer

This project is a "Radius Visualizer" application, designed to visualize geographic radii on an interactive map. It is web app only at present moment. The application allows users to draw customizable circular radii around multiple locations, analyze and visualize overlapping areas, and export the data. It also includes features for collaboration, cloud synchronization, and offline use.

## Features

- **Multi-Location Radius Drawing**: Draw customizable circular radii around multiple locations.
- **Overlap Analysis & Visualization**: Highlight overlapping areas with distinct color-coding and transparency layers.
- **Interactive Map Interface**: Integrate with Google Maps API for smooth zooming, panning, and search functionality.
- **Data Export & Sharing**: Export radius data in KML, GeoJSON, or CSV formats and generate shareable links.
- **Advanced Customization**: Adjust radius opacity, border styles, and fill colors.
- **Collaboration & Cloud Sync**: Save and sync radius configurations across devices with optional user accounts.
- **Offline Functionality**: Cache map tiles and user-generated radii for limited offline use.
- **Performance Optimization**: Efficiently handle large datasets (e.g., 100+ radii) without lag.

# Radius Map Application - UI Frontend 

Build a clean, intuitive mapping interface that feels familiar but powerful. Think Google Maps simplicity meets advanced spatial tools.

## Core Interface

**Map Canvas**
- Full-screen interactive map as the primary workspace
- Minimal chrome—let the map breathe
- Floating controls that don't obstruct the view
- Smooth animations for radius creation/deletion

**Primary Actions (Floating Toolbar - Bottom Left)**
- Single "+" button to add new radius point
  - Click map to place, then adjust size with slider or input
- List icon to show all active radii (expandable drawer)
- Layers icon for overlap visualization controls
- Share/Export icon (one-tap access)

**Radius Controls (Side Panel - Slides in from right)**
- Clean card-based design for each radius
- Quick visual: mini map preview, location name, radius size
- Tap card to focus/edit that radius on map
- Swipe to delete (with undo)
- Drag handle to reorder

## Smart Interactions

**Creating Radii**
- Search bar floats at top (Google-style)
- Type location OR click map to place pin
- Radius size picker appears immediately:
  - Visual slider (0.5 to 50 miles/km)
  - Quick presets: 5mi, 10mi, 25mi
  - Manual input for precise control
- Auto-assign distinct colors (cycle through palette)

**Overlap Detection**
- Automatic when 2+ radii intersect
- Overlaps get crosshatch pattern or gradient fill
- Tap overlap area to see which radii intersect
- Toggle "Show Overlaps Only" mode

**Visual Customization (Per Radius)**
- Color picker (preset palette + custom)
- Opacity slider (30-100%)
- Border style: solid, dashed, dotted
- Fill toggle on/off

## Map Controls

**Standard Navigation**
- Zoom buttons (bottom right)
- Current location button
- Map type switcher (road/satellite/terrain)

**View Modes**
- "Focus Mode": Dims everything except selected radius
- "Overlap Mode": Highlights only intersection areas
- "Heatmap Mode": Visualize density of overlapping coverage

## Data Management

**Save/Load (Top Right Menu)**
- Save current configuration with name
- Load saved configurations (grid view with thumbnails)
- Auto-save drafts every 30 seconds
- Cloud sync indicator (green dot when synced)

**Export Options (Simple Modal)**
- Format selector: KML, GeoJSON, CSV, PNG image
- "Copy Link" for sharing (generates URL with map state)
- QR code option for mobile handoff

## Mobile Optimizations

- Bottom sheet for radius list (thumb-friendly)
- Gesture controls: pinch radius to resize, long-press to edit
- Simplified toolbar with essential actions only
- Collapsible search bar (expands on tap)

## Performance UI

**Large Dataset Handling**
- Show "Loading radii..." with count (50/200 loaded)
- Option to "Show/Hide All" for performance
- Cluster nearby pins at far zoom levels
- "Simplify View" mode for 100+ radii (reduces detail)

## Visual Design Guidelines

**Color Palette**
- Clean whites/light grays for panels
- Vibrant but distinct colors for radii (10-color cycle)
- Subtle shadows for depth (no heavy borders)
- Icons: outlined style, single color

**Typography**
- Clean sans-serif (Inter, SF Pro, or Roboto)
- Location names: medium weight, 16px
- Radius measurements: regular weight, 14px
- UI labels: 12px uppercase with letter-spacing

**Spacing & Layout**
- 16px base unit for padding/margins
- Cards: 8px radius corners
- Floating elements: 16px from screen edges
- Panel width: 360px max on desktop

## Empty States

**No Radii Yet**
- Center illustration (simple pin graphic)
- "Add your first location" text
- Large "+" button with "Get Started" label

**No Overlaps**
- Friendly message: "Add more radii to see overlaps"
- Suggested action: "Try adding locations nearby"

## Error Handling

- Inline validation (red underline for invalid input)
- Toast notifications for actions (bottom center, 3sec)
- Graceful offline mode indicator (top banner)

## Accessibility

- Keyboard navigation for all controls
- Screen reader labels on all interactive elements
- High contrast mode support
- Focus indicators (visible outline)

---

**Tech Stack Suggestions**
- React/Vue/Svelte + TypeScript
- Mapbox GL JS or Google Maps JavaScript API
- Tailwind CSS for styling
- Zustand/Pinia for state management
- React Query for data fetching/caching