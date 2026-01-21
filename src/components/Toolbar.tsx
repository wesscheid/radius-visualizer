import React from 'react';
import { useStore } from '../store/useStore';
import { Menu, Plus, Map, Share2, Locate, Ruler, Target } from 'lucide-react';
import { auth } from '../firebase';

const Toolbar: React.FC = () => {
  const { 
    toggleSidebar, 
    sidebarOpen, 
    addRadius, 
    mapCenter, 
    setMapCenter, 
    setMapZoom, 
    toggleMeasurementMode, 
    isMeasuring,
    showIntersections,
    toggleIntersectionDisplay,
    setGeolocationDenied,
    setShowGeolocationWarning
  } = useStore();

  const handleAddCenter = () => {
    // Helper to add a radius at the center of the screen
    addRadius(mapCenter.lat, mapCenter.lng, auth.currentUser?.uid);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setGeolocationDenied(true);
      setShowGeolocationWarning(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter(latitude, longitude);
        setMapZoom(13);
      },
      (error) => {
        console.error("Error getting location:", error);
        setShowGeolocationWarning(true);
      }
    );
  };

  return (
    <div className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] left-0 right-0 md:bottom-6 md:left-6 md:right-auto flex flex-row md:flex-col justify-center md:justify-start gap-4 md:gap-3 z-10 px-6 md:px-0 pointer-events-none md:pointer-events-auto">
      {/* Wrapper to re-enable pointer events for buttons since container is pass-through on mobile */}
      
      <button 
        onClick={toggleSidebar}
        className="pointer-events-auto bg-dark-surface w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-gray-700 text-dark-text-primary transition-colors border border-dark-border"
        title={sidebarOpen ? "Hide Sidebar" : "Show Radii"}
      >
        <Menu size={24} />
      </button>

      <button 
        onClick={handleLocate}
        className="pointer-events-auto bg-dark-surface w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-gray-700 text-dark-text-primary transition-colors border border-dark-border"
        title="Zoom to Current Location"
      >
        <Locate size={24} />
      </button>
      
      <button 
        onClick={toggleMeasurementMode}
        className={`pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-colors border border-dark-border ${isMeasuring ? 'bg-blue-900/50 text-blue-400 border-blue-500' : 'bg-dark-surface hover:bg-gray-700 text-dark-text-primary'} hidden md:flex`}
        title="Measurement Tool"
      >
        <Ruler size={24} />
      </button>

      <button 
        onClick={toggleIntersectionDisplay}
        className={`pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-colors border border-dark-border ${showIntersections ? 'bg-orange-900/50 text-orange-400 border-orange-500' : 'bg-dark-surface hover:bg-gray-700 text-dark-text-primary'} hidden md:flex`}
        title="Toggle Intersection Points"
      >
        <Target size={24} />
      </button>

      <button 
        onClick={handleAddCenter}
        className="pointer-events-auto bg-primary w-14 h-14 flex items-center justify-center rounded-full shadow-lg hover:bg-blue-600 text-white transition-colors"
        title="Add Radius at Center"
      >
        <Plus size={28} />
      </button>

      {/* Placeholder for future features */}
      <button 
        className="pointer-events-auto bg-dark-surface w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-gray-700 text-dark-text-primary transition-colors border border-dark-border hidden md:flex"
        title="Change Map Layer"
      >
        <Map size={24} />
      </button>

      <button 
        className="pointer-events-auto bg-dark-surface w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-gray-700 text-dark-text-primary transition-colors border border-dark-border hidden md:flex"
        title="Share"
      >
        <Share2 size={24} />
      </button>
    </div>
  );
};

export default Toolbar;