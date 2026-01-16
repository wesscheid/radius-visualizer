import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Radius {
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

interface AppState {
  radii: Radius[];
  selectedRadiusId: string | null;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  sidebarOpen: boolean;

  // Actions
  addRadius: (lat: number, lng: number) => void;
  updateRadius: (id: string, updates: Partial<Radius>) => void;
  removeRadius: (id: string) => void;
  selectRadius: (id: string | null) => void;
  setMapCenter: (lat: number, lng: number) => void;
  setMapZoom: (zoom: number) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const DEFAULT_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
];

export const useStore = create<AppState>((set) => ({
  radii: [],
  selectedRadiusId: null,
  mapCenter: { lat: 29.9511, lng: -90.0715 }, // Default: New Orleans, LA
  mapZoom: 10,
  sidebarOpen: true,

  addRadius: (lat, lng) => set((state) => {
    const newColor = DEFAULT_COLORS[state.radii.length % DEFAULT_COLORS.length];
    const newRadius: Radius = {
      id: uuidv4(),
      name: `Location ${state.radii.length + 1}`,
      lat,
      lng,
      radius: 8046.72, // 5 miles in meters
      color: newColor,
      opacity: 0.3,
      visible: true,
      borderStyle: 'solid',
      fill: true,
    };
    return { 
      radii: [...state.radii, newRadius],
      selectedRadiusId: newRadius.id,
      sidebarOpen: true 
    };
  }),

  updateRadius: (id, updates) => set((state) => ({
    radii: state.radii.map((r) => (r.id === id ? { ...r, ...updates } : r)),
  })),

  removeRadius: (id) => set((state) => ({
    radii: state.radii.filter((r) => r.id !== id),
    selectedRadiusId: state.selectedRadiusId === id ? null : state.selectedRadiusId,
  })),

  selectRadius: (id) => set({ selectedRadiusId: id }),
  setMapCenter: (lat, lng) => set({ mapCenter: { lat, lng } }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
