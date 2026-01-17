import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Trash2, Eye, EyeOff, MapPin, Layers, Plus, FolderOpen, Crosshair, Target, AlertCircle, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { formatRadius, metersToImperial, imperialToMeters, downloadFile, convertToCSV, convertToGeoJSON } from '../utils/format';
import { auth } from '../firebase';
import { distance } from '../utils/trilateration';

const Sidebar: React.FC = () => {
  const { 
    radii, 
    groups,
    addGroup,
    updateGroup,
    removeGroup,
    selectedRadiusId, 
    selectRadius, 
    updateRadius, 
    removeRadius,
    sidebarOpen,
    showIntersections,
    toggleIntersectionDisplay,
    intersections
  } = useStore();

  const [newGroupName, setNewGroupName] = useState('');
  const [showResiduals, setShowResiduals] = useState(false);

  const selectedRadius = radii.find(r => r.id === selectedRadiusId);
  const bestFit = intersections.find(i => i.type === 'best-fit');
  const { miles, feet } = selectedRadius ? metersToImperial(selectedRadius.radius) : { miles: 0, feet: 0 };

  const handleExportCSV = () => {
    const data = radii.map(r => ({
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      radius_m: r.radius,
      reliability: r.reliability || 100
    }));
    const csv = convertToCSV(data);
    downloadFile(csv, "radii_export.csv", "text/csv");
  };

  const handleExportGeoJSON = () => {
    const geojson = convertToGeoJSON(radii, intersections);
    downloadFile(geojson, "trilateration_export.geojson", "application/json");
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    try {
      await addGroup(newGroupName, randomColor, auth.currentUser?.uid);
      setNewGroupName('');
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group. Please check your connection.");
    }
  };

  const getGroupedRadii = (groupId: string | null) => {
    return radii.filter(r => (groupId === null ? !r.groupId : r.groupId === groupId));
  };

  if (!sidebarOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-xl z-10 flex flex-col transition-transform duration-300 transform translate-x-0">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Layers & Groups
          </h2>
          <button
            onClick={toggleIntersectionDisplay}
            className={clsx(
              "p-2 rounded-full transition-colors",
              showIntersections ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
            title="Toggle Intersection Calculation"
          >
            <Crosshair size={18} />
          </button>
        </div>
        
        <form onSubmit={handleCreateGroup} className="flex gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New Group Name"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-primary"
          />
          <button 
            type="submit"
            disabled={!newGroupName.trim()}
            className="p-2 bg-primary text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            <Plus size={18} />
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
        
        {/* Trilateration Results Panel */}
        {showIntersections && bestFit && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
              <Target size={14} /> Analysis Result
            </h3>
            
            <div className="bg-white rounded p-2 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-slate-700">Estimated Location</span>
                <span className={clsx(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  bestFit.confidence > 0.8 ? "bg-green-100 text-green-700" : 
                  bestFit.confidence > 0.5 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                )}>
                  {(bestFit.confidence * 100).toFixed(0)}% CONF
                </span>
              </div>
              <div className="text-xs font-mono text-slate-600 select-all cursor-text mb-2 bg-slate-50 p-1 rounded">
                {bestFit.lat.toFixed(6)}, {bestFit.lng.toFixed(6)}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <AlertCircle size={12} />
                <span>Uncertainty: ±{bestFit.errorRadius?.toFixed(1)}m</span>
              </div>

              {/* Residuals Toggle */}
              <button 
                onClick={() => setShowResiduals(!showResiduals)}
                className="w-full flex items-center justify-between text-xs font-medium text-slate-500 hover:text-slate-700 py-1 border-t border-slate-100 mt-1 pt-1"
              >
                <span>Residual Errors</span>
                {showResiduals ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {/* Residuals List */}
              {showResiduals && (
                <div className="mt-2 space-y-1.5 border-l-2 border-slate-100 pl-2">
                  {radii.filter(r => r.visible).map(r => {
                    const dist = distance({ lat: bestFit.lat, lng: bestFit.lng }, { lat: r.lat, lng: r.lng });
                    const residual = dist - r.radius;
                    const isGood = Math.abs(residual) < (bestFit.errorRadius || 10);
                    
                    return (
                      <div key={r.id} className="flex justify-between text-[10px] items-center">
                        <span className="text-slate-500 truncate max-w-[140px]">{r.name}</span>
                        <span className={clsx(
                          "font-mono px-1 rounded",
                          isGood ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"
                        )}>
                          {residual > 0 ? '+' : ''}{residual.toFixed(1)}m
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Export Buttons */}
              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                <button 
                  onClick={handleExportCSV}
                  className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 py-1.5 rounded transition-colors"
                >
                  <Download size={12} /> CSV
                </button>
                <button 
                  onClick={handleExportGeoJSON}
                  className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 py-1.5 rounded transition-colors"
                >
                  <Download size={12} /> GeoJSON
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Groups Section */}
        {groups.map(group => (
          <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-3 bg-gray-100 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-2 overflow-hidden">
                <FolderOpen className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="font-semibold text-gray-700 text-sm truncate">{group.name}</span>
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: group.color }}
                  title="Group Color"
                />
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => updateGroup(group.id, { visible: !group.visible })}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  {group.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button 
                  onClick={() => removeGroup(group.id)}
                  className="p-1 text-gray-400 hover:text-danger rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="p-2 space-y-2">
              {getGroupedRadii(group.id).length === 0 && (
                <div className="text-xs text-gray-400 text-center italic py-2">Empty Group</div>
              )}
              {getGroupedRadii(group.id).map(radius => (
                <div 
                  key={radius.id}
                  onClick={() => selectRadius(radius.id)}
                  className={clsx(
                    "rounded p-2 border cursor-pointer transition-all flex items-center justify-between",
                    selectedRadiusId === radius.id ? "border-primary bg-blue-50" : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  <span className="text-sm text-gray-700 truncate">{radius.name}</span>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }}></div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Ungrouped Section */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 px-1">Ungrouped</h3>
          <div className="space-y-2">
            {getGroupedRadii(null).map(radius => (
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
            {getGroupedRadii(null).length === 0 && groups.length === 0 && radii.length === 0 && (
              <div className="text-center text-gray-500 mt-4">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No locations yet.</p>
              </div>
            )}
          </div>
        </div>
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
              <label className="block text-xs font-medium text-gray-500 mb-1">Group</label>
              <select
                value={selectedRadius.groupId || ''}
                onChange={(e) => updateRadius(selectedRadius.id, { groupId: e.target.value || null })}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-primary text-sm bg-white"
              >
                <option value="">Ungrouped</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
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

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Reliability (Weight): {selectedRadius.reliability || 100}%
              </label>
              <input 
                type="range" 
                min="1" 
                max="100" 
                step="1"
                value={selectedRadius.reliability || 100}
                onChange={(e) => updateRadius(selectedRadius.id, { reliability: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-[10px] text-gray-400 mt-1 italic">
                Used for weighted trilateration calculation.
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
               {!selectedRadius.groupId && (
                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                    <input 
                      type="color" 
                      value={selectedRadius.color}
                      onChange={(e) => updateRadius(selectedRadius.id, { color: e.target.value })}
                      className="h-8 w-8 p-0 border-0 rounded cursor-pointer"
                    />
                 </div>
               )}
               {selectedRadius.groupId && (
                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                    <div className="text-xs text-gray-400 italic py-2">
                      Inherited
                    </div>
                 </div>
               )}
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