import React, { useState } from 'react';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import { useStore } from './store/useStore';
import { auth } from './firebase';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const { addRadius, setMapCenter, setMapZoom } = useStore();

  const handleSearch = async () => {
    if (searchQuery.trim() === '') return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const results = await response.json();

      if (results && results.length > 0) {
        const result = results[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        addRadius(lat, lng, auth.currentUser?.uid);
        setMapCenter(lat, lng);
        setMapZoom(13);
        setSearchQuery('');
      } else {
        alert('Location not found. Please try a different search.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again later.');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-100">
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <MapComponent />
      </div>

      {/* UI Layers */}
      <Toolbar />
      <Sidebar />
      
      {/* Top Search Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-10">
        <div className="bg-white rounded-lg shadow-md flex items-center p-2 opacity-90 hover:opacity-100 transition-opacity">
           <input 
             type="text" 
             placeholder="Search location and press Enter..." 
             className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 outline-none"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             onKeyDown={(e) => {
               if (e.key === 'Enter') {
                 handleSearch();
               }
             }}
           />
           <div className="text-xs text-gray-400 px-2 border-l border-gray-200">
              Prototype
           </div>
        </div>
      </div>
    </div>
  );
}

export default App;