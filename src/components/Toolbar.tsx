import React from 'react';
import { useStore } from '../store/useStore';
import { Menu, Plus, Map, Share2 } from 'lucide-react';

const Toolbar: React.FC = () => {
  const { toggleSidebar, sidebarOpen, addRadius, mapCenter } = useStore();

  const handleAddCenter = () => {
    // Helper to add a radius at the center of the screen
    addRadius(mapCenter.lat, mapCenter.lng);
  };

  return (
    <div className="absolute bottom-6 left-6 flex flex-col gap-3 z-10">
      <button 
        onClick={toggleSidebar}
        className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 text-gray-700 transition-colors"
        title={sidebarOpen ? "Hide Sidebar" : "Show Radii"}
      >
        <Menu size={24} />
      </button>

      <button 
        onClick={handleAddCenter}
        className="bg-primary p-4 rounded-full shadow-lg hover:bg-blue-600 text-white transition-colors"
        title="Add Radius at Center"
      >
        <Plus size={24} />
      </button>

      {/* Placeholder for future features */}
      <button 
        className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 text-gray-700 transition-colors hidden sm:block"
        title="Change Map Layer"
      >
        <Map size={24} />
      </button>

      <button 
        className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 text-gray-700 transition-colors hidden sm:block"
        title="Share"
      >
        <Share2 size={24} />
      </button>
    </div>
  );
};

export default Toolbar;
