import React from 'react';
import { useStore, Radius } from '../store/useStore';
import { Trash2, Eye, EyeOff, MapPin, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { formatRadius, metersToImperial, imperialToMeters } from '../utils/format';

const Sidebar: React.FC = () => {
  const { 
    radii, 
    selectedRadiusId, 
    selectRadius, 
    updateRadius, 
    removeRadius,
    sidebarOpen
  } = useStore();

  const selectedRadius = radii.find(r => r.id === selectedRadiusId);
  const { miles, feet } = selectedRadius ? metersToImperial(selectedRadius.radius) : { miles: 0, feet: 0 };

  if (!sidebarOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-xl z-10 flex flex-col transition-transform duration-300 transform translate-x-0">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Radius Controls
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {radii.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Click on the map to add a radius.</p>
          </div>
        )}

        {radii.map((radius) => (
          <div 
            key={radius.id}
            onClick={() => selectRadius(radius.id)}
            className={clsx(
              "bg-white rounded-lg p-3 shadow-sm border-2 cursor-pointer transition-all",
              selectedRadiusId === radius.id ? "border-primary" : "border-transparent hover:border-gray-200"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-700 truncate">{radius.name}</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); updateRadius(radius.id, { visible: !radius.visible }); }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  {radius.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeRadius(radius.id); }}
                  className="p-1 text-gray-400 hover:text-danger rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: radius.color }}></div>
              <span>{formatRadius(radius.radius)}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedRadius && (
        <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <h3 className="font-semibold text-gray-800 mb-3">Edit Selected</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
              <input 
                type="text" 
                value={selectedRadius.name}
                onChange={(e) => updateRadius(selectedRadius.id, { name: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-primary text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-500">Radius (Imperial)</label>
              </div>
              
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <div className="relative">
                    <input 
                      type="number" 
                      value={miles}
                      min="0"
                      onChange={(e) => updateRadius(selectedRadius.id, { 
                        radius: imperialToMeters(Number(e.target.value), feet) 
                      })}
                      className="w-full pl-2 pr-7 py-1 border border-gray-300 rounded focus:outline-none focus:border-primary text-sm font-mono"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-gray-400 font-bold uppercase">mi</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <input 
                      type="number" 
                      value={feet}
                      min="0"
                      max="5279"
                      onChange={(e) => updateRadius(selectedRadius.id, { 
                        radius: imperialToMeters(miles, Number(e.target.value)) 
                      })}
                      className="w-full pl-2 pr-7 py-1 border border-gray-300 rounded focus:outline-none focus:border-primary text-sm font-mono"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-gray-400 font-bold uppercase">ft</span>
                  </div>
                </div>
              </div>

              <input 
                type="range" 
                min="100" 
                max="80467" // ~50 miles
                step="100"
                value={selectedRadius.radius}
                onChange={(e) => updateRadius(selectedRadius.id, { radius: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-[10px] text-gray-400 mt-1 text-right italic">
                {formatRadius(selectedRadius.radius)}
              </div>
            </div>

            <div className="flex items-center gap-2">
               <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Opacity</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    value={selectedRadius.opacity}
                    onChange={(e) => updateRadius(selectedRadius.id, { opacity: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                  <input 
                    type="color" 
                    value={selectedRadius.color}
                    onChange={(e) => updateRadius(selectedRadius.id, { color: e.target.value })}
                    className="h-8 w-8 p-0 border-0 rounded cursor-pointer"
                  />
               </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input 
                        type="checkbox"
                        checked={selectedRadius.fill}
                        onChange={(e) => updateRadius(selectedRadius.id, { fill: e.target.checked })}
                        className="rounded text-primary focus:ring-primary"
                    />
                    Fill
                </label>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
