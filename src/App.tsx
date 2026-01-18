import React, { useState } from 'react';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import TrilaterationLogic from './components/TrilaterationLogic';
import { useStore } from './store/useStore';
import { auth } from './firebase';
import { Search, X } from 'lucide-react';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { addRadius, setMapCenter, setMapZoom } = useStore();

  const handleSearch = async () => {
    if (searchQuery.trim() === '') return;

    // Check for coordinates (Lat, Lng)
    const coordinateRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    const match = searchQuery.match(coordinateRegex);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[3]);

      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        addRadius(lat, lng, auth.currentUser?.uid);
        setMapCenter(lat, lng);
        setMapZoom(13);
        setSearchQuery('');
        setMobileSearchOpen(false);
        return;
      } else {
        alert('Invalid coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180.');
        return;
      }
    }

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
        setMobileSearchOpen(false);
      } else {
        alert('Location not found. Please try a different search.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again later.');
    }
  };

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-dark-bg">
      {/* Logic Layers */}
      <TrilaterationLogic />

      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <MapComponent />
      </div>

      {/* UI Layers */}
      <Toolbar />
      <Sidebar />
      
      {/* Top Search Bar */}
      <div className="absolute top-4 left-0 right-0 px-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:w-full md:max-w-md z-10 flex justify-end md:block pointer-events-none">
        <div className={`pointer-events-auto bg-dark-surface rounded-lg shadow-md flex items-center p-2 opacity-90 hover:opacity-100 transition-all duration-300 border border-dark-border ${mobileSearchOpen ? 'w-full' : 'w-12 h-12 md:w-full'}`}>
           
           {/* Mobile Search Icon (when collapsed) */}
           <button 
             className={`md:hidden p-1 text-dark-text-secondary ${mobileSearchOpen ? 'hidden' : 'block'}`}
             onClick={() => setMobileSearchOpen(true)}
           >
             <Search size={24} />
           </button>

           {/* Input Field (shown on desktop or when expanded) */}
           <div className={`flex-1 flex items-center ${mobileSearchOpen ? 'flex' : 'hidden md:flex'}`}>
             <input 
               type="text" 
               placeholder="Search location..." 
               className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 outline-none min-w-0 text-dark-text-primary placeholder-gray-500"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                   handleSearch();
                 }
               }}
               autoComplete="off"
             />
             
             {/* Close/Search Action for Mobile */}
             {mobileSearchOpen && (
                <button onClick={() => setMobileSearchOpen(false)} className="md:hidden text-dark-text-secondary p-1">
                  <X size={20} />
                </button>
             )}

             <div className="hidden md:block text-xs text-dark-text-secondary px-2 border-l border-dark-border whitespace-nowrap">
                Prototype
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default App;
