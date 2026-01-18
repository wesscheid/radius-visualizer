import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

export interface Group {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  userId?: string;
}

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
  groupId?: string | null;
  reliability?: number; // 0-100, for weighted trilateration
  notes?: string;
}

export interface IntersectionPoint {
  id: string;
  lat: number;
  lng: number;
  type: '2-circle' | '3-circle' | 'best-fit';
  confidence: number; // 0-1
  errorRadius?: number; // meters
  parents: string[]; // IDs of radii involved
  color?: string;
}

interface AppState {
  radii: Radius[];
  groups: Group[];
  selectedRadiusId: string | null;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  sidebarOpen: boolean;
  loading: boolean;
  
  // Measurement Tool State
  isMeasuring: boolean;
  measurementPoints: { lat: number; lng: number }[];

  // Trilateration State
  intersections: IntersectionPoint[];
  showIntersections: boolean;

  // Actions
  setRadii: (radii: Radius[]) => void;
  setGroups: (groups: Group[]) => void;
  addRadius: (lat: number, lng: number, userId?: string) => Promise<void>;
  updateRadius: (id: string, updates: Partial<Radius>) => Promise<void>;
  removeRadius: (id: string) => Promise<void>;
  
  addGroup: (name: string, color: string, userId?: string) => Promise<void>;
  updateGroup: (id: string, updates: Partial<Group>) => Promise<void>;
  removeGroup: (id: string) => Promise<void>;
  clearAllRadii: () => Promise<void>;
  
  selectRadius: (id: string | null) => void;
  setMapCenter: (lat: number, lng: number) => void;
  setMapZoom: (zoom: number) => void;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;

  // Measurement Actions
  toggleMeasurementMode: () => void;
  addMeasurementPoint: (lat: number, lng: number) => void;
  clearMeasurement: () => void;

  // Trilateration Actions
  setIntersections: (points: IntersectionPoint[]) => void;
  toggleIntersectionDisplay: () => void;
}

const DEFAULT_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];

export const useStore = create<AppState>((set, get) => ({
  radii: [],
  groups: [],
  selectedRadiusId: null,
  mapCenter: { lat: 29.9511, lng: -90.0715 },
  mapZoom: 10,
  sidebarOpen: true,
  loading: false,
  
  isMeasuring: false,
  measurementPoints: [],
  
  intersections: [],
  showIntersections: true,

  setRadii: (radii) => set({ radii }),
  setGroups: (groups) => set({ groups }),
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
      userId,
      groupId: null,
      reliability: 100,
      notes: ''
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

  addGroup: async (name, color, userId) => {
    const id = uuidv4();
    const newGroup: Group = {
      id,
      name,
      color,
      visible: true,
      userId
    };

    if (userId) {
      await setDoc(doc(db, 'groups', id), newGroup);
    } else {
      set((state) => ({ groups: [...state.groups, newGroup] }));
    }
  },

  updateGroup: async (id, updates) => {
    const group = get().groups.find(g => g.id === id);
    if (group?.userId) {
      await setDoc(doc(db, 'groups', id), { ...group, ...updates });
    } else {
      set((state) => ({
        groups: state.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      }));
    }
  },

  removeGroup: async (id) => {
    const group = get().groups.find(g => g.id === id);
    if (group?.userId) {
      await deleteDoc(doc(db, 'groups', id));
    } else {
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
      }));
    }
  },

  clearAllRadii: async () => {
    const { radii, groups } = get();
    const batch = writeBatch(db);
    let hasUpdates = false;

    // Delete all radii from Firestore if they have a userId
    radii.forEach(r => {
      if (r.userId) {
        batch.delete(doc(db, 'radii', r.id));
        hasUpdates = true;
      }
    });

    // Delete all groups from Firestore if they have a userId
    groups.forEach(g => {
      if (g.userId) {
        batch.delete(doc(db, 'groups', g.id));
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      await batch.commit();
    }
    
    // Clear local state (optimistic update, though AuthGuard listener will ultimately sync this)
    set({ radii: [], groups: [], selectedRadiusId: null });
  },

  selectRadius: (id) => set({ selectedRadiusId: id }),
  setMapCenter: (lat, lng) => set({ mapCenter: { lat, lng } }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  toggleMeasurementMode: () => set((state) => ({ 
    isMeasuring: !state.isMeasuring,
    measurementPoints: [] 
  })),

  addMeasurementPoint: (lat, lng) => set((state) => {
    const currentPoints = state.measurementPoints;
    if (currentPoints.length >= 2) {
      // Start new measurement
      return { measurementPoints: [{ lat, lng }] };
    }
    return { measurementPoints: [...currentPoints, { lat, lng }] };
  }),

  clearMeasurement: () => set({ measurementPoints: [] }),

  setIntersections: (intersections) => set({ intersections }),
  toggleIntersectionDisplay: () => set((state) => ({ showIntersections: !state.showIntersections })),
}));