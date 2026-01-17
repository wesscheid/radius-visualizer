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
    toggleIntersectionDisplay
  } = useStore();

  const handleAddCenter = () => {
    // Helper to add a radius at the center of the screen
    addRadius(mapCenter.lat, mapCenter.lng, auth.currentUser?.uid);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
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
        alert("Unable to retrieve your location");
      }
    );
  };

  return (
    <div className="absolute bottom-6 left-0 right-0 md:left-6 md:right-auto flex flex-row md:flex-col justify-center md:justify-start gap-4 md:gap-3 z-10 px-6 md:px-0 pointer-events-none md:pointer-events-auto">
      {/* Wrapper to re-enable pointer events for buttons since container is pass-through on mobile */}
      
      <button 
        onClick={toggleSidebar}
        className="pointer-events-auto bg-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-gray-50 text-gray-700 transition-colors"
        title={sidebarOpen ? "Hide Sidebar" : "Show Radii"}
      >
        <Menu size={24} />
      </button>

      <button 
        onClick={handleLocate}
        className="pointer-events-auto bg-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-gray-50 text-gray-700 transition-colors"
        title="Zoom to Current Location"
      >
        <Locate size={24} />
      </button>
      
      <button 
        onClick={toggleMeasurementMode}
        className={`pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-colors ${isMeasuring ? 'bg-blue-100 text-blue-600 border-2 border-blue-500' : 'bg-white hover:bg-gray-50 text-gray-700'} hidden md:flex`}
        title="Measurement Tool"
      >
        <Ruler size={24} />
      </button>

      <button 
        onClick={toggleIntersectionDisplay}
        className={`pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-colors ${showIntersections ? 'bg-orange-100 text-orange-600 border-2 border-orange-500' : 'bg-white hover:bg-gray-50 text-gray-700'} hidden md:flex`}
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
        className="pointer-events-auto bg-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-gray-50 text-gray-700 transition-colors hidden md:flex"
        title="Change Map Layer"
      >
        <Map size={24} />
      </button>

      <button 
        className="pointer-events-auto bg-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-gray-50 text-gray-700 transition-colors hidden md:flex"
        title="Share"
      >
        <Share2 size={24} />
      </button>
    </div>
  );
};

export default Toolbar;
