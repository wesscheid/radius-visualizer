import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export interface Radius {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  color: string;
  opacity: number;
  visible: boolean;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  fill: boolean;
  userId?: string;
}

interface AppState {
  radii: Radius[];
  selectedRadiusId: string | null;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  sidebarOpen: boolean;
  loading: boolean;

  // Actions
  setRadii: (radii: Radius[]) => void;
  addRadius: (lat: number, lng: number, userId?: string) => Promise<void>;
  updateRadius: (id: string, updates: Partial<Radius>) => Promise<void>;
  removeRadius: (id: string) => Promise<void>;
  selectRadius: (id: string | null) => void;
  setMapCenter: (lat: number, lng: number) => void;
  setMapZoom: (zoom: number) => void;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
}

const DEFAULT_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];

export const useStore = create<AppState>((set, get) => ({
  radii: [],
  selectedRadiusId: null,
  mapCenter: { lat: 29.9511, lng: -90.0715 },
  mapZoom: 10,
  sidebarOpen: true,
  loading: false,

  setRadii: (radii) => set({ radii }),
  setLoading: (loading) => set({ loading }),

  addRadius: async (lat, lng, userId) => {
    const { radii } = get();
    const newColor = DEFAULT_COLORS[radii.length % DEFAULT_COLORS.length];
    const id = uuidv4();
    const newRadius: Radius = {
      id,
      name: `Location ${radii.length + 1}`,
      lat,
      lng,
      radius: 8046.72,
      color: newColor,
      opacity: 0.3,
      visible: true,
      borderStyle: 'solid',
      fill: true,
      userId
    };

    if (userId) {
      await setDoc(doc(db, 'radii', id), newRadius);
    } else {
      set((state) => ({ radii: [...state.radii, newRadius], selectedRadiusId: id }));
    }
  },

  updateRadius: async (id, updates) => {
    const radius = get().radii.find(r => r.id === id);
    if (radius?.userId) {
      await setDoc(doc(db, 'radii', id), { ...radius, ...updates });
    } else {
      set((state) => ({
        radii: state.radii.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      }));
    }
  },

  removeRadius: async (id) => {
    const radius = get().radii.find(r => r.id === id);
    if (radius?.userId) {
      await deleteDoc(doc(db, 'radii', id));
    } else {
      set((state) => ({
        radii: state.radii.filter((r) => r.id !== id),
        selectedRadiusId: state.selectedRadiusId === id ? null : state.selectedRadiusId,
      }));
    }
  },

  selectRadius: (id) => set({ selectedRadiusId: id }),
  setMapCenter: (lat, lng) => set({ mapCenter: { lat, lng } }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));