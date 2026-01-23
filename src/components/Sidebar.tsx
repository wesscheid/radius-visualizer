import React, { useState } from 'react';
import { useStore, Radius, IntersectionPoint, Group } from '../store/useStore';
import { Trash2, Eye, EyeOff, Plus, FolderOpen, Crosshair, Target, AlertCircle, ChevronDown, ChevronRight, Download, Save, LogOut, LogIn, Search, Locate, FileText, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { formatRadius, metersToImperial, imperialToMeters, downloadFile, convertToCSV, convertToGeoJSON } from '../utils/format';
import { auth, googleProvider } from '../firebase';
import { distance } from '../utils/trilateration';
import { parseLocationString } from '../utils/locationParser';
import { linkWithPopup, signInWithPopup } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

const AnalysisPanel = ({ bestFit, groupRadii, onExportCSV, onExportGeoJSON }: {
  bestFit: IntersectionPoint;
  groupRadii: Radius[];
  onExportCSV: () => void;
  onExportGeoJSON: () => void;
}) => {
  const [showResiduals, setShowResiduals] = useState(false);

  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-3 my-2">
      <h3 className="text-xs font-bold text-dark-text-secondary uppercase mb-2 flex items-center gap-1">
        <Target size={14} /> Analysis Result
      </h3>
      
      <div className="bg-dark-bg rounded p-2 border border-dark-border shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-semibold text-dark-text-primary">Estimated Location</span>
          <span className={clsx(
            "text-[10px] font-bold px-1.5 py-0.5 rounded",
            bestFit.confidence > 0.8 ? "bg-green-900/30 text-green-400" : 
            bestFit.confidence > 0.5 ? "bg-orange-900/30 text-orange-400" : "bg-red-900/30 text-red-400"
          )}>
            {(bestFit.confidence * 100).toFixed(0)}% CONF
          </span>
        </div>
        <div className="text-xs font-mono text-dark-text-secondary select-all cursor-text mb-2 bg-dark-surface p-1 rounded">
          {bestFit.lat.toFixed(6)}, {bestFit.lng.toFixed(6)}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-dark-text-secondary mb-2">
          <AlertCircle size={12} />
          <span>Uncertainty: ±{bestFit.errorRadius?.toFixed(1)}m</span>
        </div>

        <button 
          onClick={() => setShowResiduals(!showResiduals)}
          className="w-full flex items-center justify-between text-xs font-medium text-dark-text-secondary hover:text-dark-text-primary py-2 border-t border-dark-border mt-1 pt-1 min-h-[30px]"
        >
          <span>Residual Errors</span>
          {showResiduals ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {showResiduals && (
          <div className="mt-2 space-y-1.5 border-l-2 border-dark-border pl-2">
            {groupRadii.filter(r => r.visible).map(r => {
              const dist = distance({ lat: bestFit.lat, lng: bestFit.lng }, { lat: r.lat, lng: r.lng });
              const residual = dist - r.radius;
              const isGood = Math.abs(residual) < (bestFit.errorRadius || 10);
              
              return (
                <div key={r.id} className="flex justify-between text-[10px] items-center">
                  <span className="text-dark-text-secondary truncate max-w-[140px]">{r.name}</span>
                  <span className={clsx(
                    "font-mono px-1 rounded",
                    isGood ? "text-green-400 bg-green-900/20" : "text-orange-400 bg-orange-900/20"
                  )}>
                    {residual > 0 ? '+' : ''}{residual.toFixed(1)}m
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex gap-2 border-t border-dark-border pt-3">
          <button 
            onClick={onExportCSV}
            className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold bg-dark-surface text-dark-text-secondary hover:bg-gray-700 py-2 rounded transition-colors border border-dark-border"
          >
            <Download size={12} /> CSV
          </button>
          <button 
            onClick={onExportGeoJSON}
            className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold bg-dark-surface text-dark-text-secondary hover:bg-gray-700 py-2 rounded transition-colors border border-dark-border"
          >
            <Download size={12} /> GeoJSON
          </button>
        </div>
      </div>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const { 
    radii, 
    groups,
    addGroup,
    updateGroup,
    removeGroup,
    selectedRadiusId, 
    selectRadius, 
    addRadius,
    updateRadius, 
    removeRadius,
    sidebarOpen,
    toggleSidebar,
    showIntersections,
    toggleIntersectionDisplay,
    hideInputRadii,
    toggleHideInputRadii,
    intersections,
    clearAllRadii,
    setMapCenter,
    setMapZoom,
    setGeolocationDenied,
    setShowGeolocationWarning,
    showUngroupedAnalysis,
    toggleGroupAnalysis,
    toggleUngroupedAnalysis,
  } = useStore();

  const [user] = useAuthState(auth);
  const [isGuest, setIsGuest] = useState(true);

  React.useEffect(() => {
    if (user) {
      setIsGuest(user.isAnonymous);
    }
  }, [user]);

  const [newGroupName, setNewGroupName] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const selectedRadius = radii.find(r => r.id === selectedRadiusId);
  const { miles, feet } = selectedRadius ? metersToImperial(selectedRadius.radius) : { miles: 0, feet: 0 };

  const handleExport = (groupRadii: Radius[], groupIntersections: IntersectionPoint[], format: 'csv' | 'geojson') => {
    if (format === 'csv') {
      const data = groupRadii.map(r => ({
        name: r.name,
        lat: r.lat,
        lng: r.lng,
        radius_m: r.radius,
        reliability: r.reliability || 100
      }));
      const csv = convertToCSV(data);
      downloadFile(csv, "radii_export.csv", "text/csv");
    } else {
      const geojson = convertToGeoJSON(groupRadii, groupIntersections);
      downloadFile(geojson, "trilateration_export.geojson", "application/json");
    }
  };

  const handleAddAtCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeolocationDenied(true);
      setShowGeolocationWarning(true);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await addRadius(latitude, longitude, auth.currentUser?.uid);
        setMapCenter(latitude, longitude);
        setMapZoom(13);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setShowGeolocationWarning(true);
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };
  
  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to delete ALL locations and groups? This cannot be undone.")) {
      try {
        await clearAllRadii();
      } catch (error) {
        console.error("Failed to clear data:", error);
        window.alert("Failed to clear data. Please try again.");
      }
    }
  };

  const handleLinkAccount = async () => {
    if (!user) return;
    try {
      await linkWithPopup(user, googleProvider);
      await user.reload();
      await user.getIdToken(true);
      window.alert("Account successfully linked!");
    } catch (error: any) {
      console.error("Error linking account:", error);
      if (error.code === 'auth/credential-already-in-use') {
         if (window.confirm("This Google account is already associated with another user. Do you want to sign in with this account instead? (Note: Current temporary data will be lost if not saved)")) {
            try {
              await signInWithPopup(auth, googleProvider);
            } catch (signInError: any) {
              console.error("Error signing in:", signInError);
              window.alert("Failed to sign in: " + signInError.message);
            }
         }
      } else {
         window.alert("Failed to link account: " + error.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Error signing in:", error);
      window.alert("Failed to sign in: " + error.message);
    }
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
      window.alert("Failed to create group. Please check your connection.");
    }
  };

  const getGroupedRadii = (groupId: string | null) => {
    if (groupId === null) {
      return radii.filter(r => !r.groupId || !groups.find(g => g.id === r.groupId));
    }
    return radii.filter(r => r.groupId === groupId);
  };
  
  const findBestFitForGroup = (groupRadii: Radius[]) => {
    if (groupRadii.length === 0) return undefined;
    const groupRadiiIds = new Set(groupRadii.map(r => r.id));
    return intersections.find(i => 
      i.type === 'best-fit' && 
      i.parents.length > 0 &&
      groupRadiiIds.has(i.parents[0])
    );
  };

  if (!sidebarOpen && !selectedRadius) return null;

  return (
    <>
      <div className={clsx(
        "fixed md:absolute bottom-0 md:top-0 left-0 md:left-auto right-0",
        "h-[50vh] md:h-full w-full md:w-80 bg-dark-bg shadow-xl z-10",
        "flex flex-col transition-transform duration-300 rounded-t-2xl md:rounded-none border-r border-dark-border",
        sidebarOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"
      )}>
        <div 
          className="md:hidden w-full flex items-center justify-center pt-3 pb-1 cursor-pointer active:opacity-70"
          onClick={toggleSidebar}
        >
          <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
        </div>

        <div className="p-4 border-b border-dark-border bg-dark-bg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-dark-text-primary flex items-center gap-3">
              <img src="/logo.png" alt="MapR" className="w-8 h-8 object-contain" />
              MapR
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-full bg-dark-surface text-dark-text-secondary hover:text-dark-text-primary border border-dark-border transition-colors"
                title="Close Sidebar"
              >
                <ChevronDown size={20} />
              </button>
              <button
                onClick={toggleIntersectionDisplay}
                className={clsx(
                  "p-3 md:p-2 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center border border-dark-border",
                  showIntersections ? "bg-blue-900/30 text-blue-400 border-blue-500/50" : "bg-dark-surface text-dark-text-secondary hover:bg-gray-700"
                )}
                title="Toggle Intersection Calculation"
              >
                <Crosshair size={20} />
              </button>
              <button
                onClick={toggleHideInputRadii}
                className={clsx(
                  "p-3 md:p-2 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center border border-dark-border",
                  !hideInputRadii ? "bg-blue-900/30 text-blue-400 border-blue-500/50" : "bg-dark-surface text-dark-text-secondary hover:bg-gray-700"
                )}
                title="Toggle Input Circles Visibility"
              >
                <Layers size={20} />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <button 
              onClick={handleAddAtCurrentLocation}
              disabled={isLocating}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white py-3 rounded-lg text-sm font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-70"
            >
              <Locate size={20} className={isLocating ? "animate-pulse" : ""} />
              {isLocating ? "Getting Location..." : "Add at My Location"}
            </button>
            <form onSubmit={handleCreateGroup} className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="New Group Name"
                className="flex-1 px-3 py-3 md:py-2 text-base md:text-sm bg-dark-surface border border-dark-border text-dark-text-primary rounded focus:outline-none focus:border-primary placeholder-gray-500"
              />
              <button 
                type="submit"
                disabled={!newGroupName.trim()}
                className="p-3 md:p-2 bg-primary text-white rounded hover:bg-blue-600 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Plus size={20} />
              </button>
            </form>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-dark-bg pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-4">
          <div className="bg-dark-surface border border-dark-border rounded-lg p-3">
             <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-dark-text-secondary uppercase">Data & Account</span>
                  {user && (
                    <div className="flex flex-col mt-0.5" title={user.uid}>
                      {isGuest ? (
                        <span className="text-[10px] text-gray-500 font-mono">
                          Guest (ID: {user.uid.slice(0, 5)}...)
                        </span>
                      ) : (
                        <>
                          {user.displayName && (
                            <span className="text-[11px] font-bold text-dark-text-primary leading-tight">
                              {user.displayName}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 font-mono truncate max-w-[150px]">
                            {user.email || user.uid}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {isGuest && (
                  <span className="text-[10px] bg-yellow-900/30 text-yellow-500 px-2 py-0.5 rounded border border-yellow-800">Guest</span>
                )}
                {!isGuest && user && (
                  <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-800">Synced</span>
                )}
             </div>
             <div className="space-y-2">
                {isGuest && (
                  <>
                    <button 
                      onClick={handleLinkAccount}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium transition-colors"
                    >
                      <Save size={16} /> Save Data (Link Google)
                    </button>
                    <button 
                      onClick={handleGoogleSignIn}
                      className="w-full flex items-center justify-center gap-2 bg-dark-surface hover:bg-gray-700 text-dark-text-primary border border-dark-border py-2 rounded text-sm font-medium transition-colors"
                    >
                      <LogIn size={16} /> Login with Google
                    </button>
                  </>
                )}
                {!isGuest && (
                  <button 
                    onClick={() => auth.signOut()}
                    className="w-full flex items-center justify-center gap-2 bg-dark-surface hover:bg-gray-700 text-dark-text-primary border border-dark-border py-2 rounded text-sm font-medium transition-colors"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                )}
                <button 
                  onClick={handleClearAll}
                  className="w-full flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 py-2 rounded text-sm font-medium transition-colors"
                >
                  <Trash2 size={16} /> Clear All Data
                </button>
             </div>
          </div>

          {groups.map(group => {
            const groupRadii = getGroupedRadii(group.id);
            const bestFit = findBestFitForGroup(groupRadii);
            return (
              <div key={group.id} className="bg-dark-surface rounded-lg shadow-sm border border-dark-border overflow-hidden">
                <div className="p-3 bg-dark-bg flex items-center justify-between border-b border-dark-border">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FolderOpen className="w-4 h-4 text-dark-text-secondary flex-shrink-0" />
                    <span className="font-semibold text-dark-text-primary text-sm truncate">{group.name}</span>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                  </div>
                  <div className="flex items-center gap-1">
                    {bestFit && (
                      <button 
                        onClick={() => toggleGroupAnalysis(group.id)}
                        className={clsx("p-1 rounded", group.showAnalysis ? "text-blue-400 bg-blue-900/30" : "text-dark-text-secondary hover:text-dark-text-primary")}
                      >
                        <FileText size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => updateGroup(group.id, { visible: !group.visible })}
                      className="p-1 text-dark-text-secondary hover:text-dark-text-primary rounded"
                    >
                      {group.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button 
                      onClick={() => removeGroup(group.id)}
                      className="p-1 text-dark-text-secondary hover:text-danger rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {group.showAnalysis && bestFit && (
                  <AnalysisPanel 
                    bestFit={bestFit} 
                    groupRadii={groupRadii} 
                    onExportCSV={() => handleExport(groupRadii, intersections, 'csv')}
                    onExportGeoJSON={() => handleExport(groupRadii, intersections, 'geojson')}
                  />
                )}
                <div className="p-2 space-y-2">
                  {groupRadii.map(radius => (
                    <div 
                      key={radius.id}
                      onClick={() => selectRadius(radius.id)}
                      className={clsx(
                        "rounded p-2 border cursor-pointer transition-all flex items-center justify-between",
                        selectedRadiusId === radius.id ? "border-primary bg-blue-900/20" : "border-dark-border hover:border-gray-600"
                      )}
                    >
                      <span className="text-sm text-dark-text-primary truncate">{radius.name}</span>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }}></div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-xs font-bold text-dark-text-secondary uppercase">Ungrouped</h3>
              {findBestFitForGroup(getGroupedRadii(null)) && (
                <button 
                  onClick={toggleUngroupedAnalysis}
                  className={clsx("p-1 rounded", showUngroupedAnalysis ? "text-blue-400 bg-blue-900/30" : "text-dark-text-secondary hover:text-dark-text-primary")}
                >
                  <FileText size={16} />
                </button>
              )}
            </div>
            {showUngroupedAnalysis && findBestFitForGroup(getGroupedRadii(null)) && (
              <AnalysisPanel 
                bestFit={findBestFitForGroup(getGroupedRadii(null))!} 
                groupRadii={getGroupedRadii(null)} 
                onExportCSV={() => handleExport(getGroupedRadii(null), intersections, 'csv')}
                onExportGeoJSON={() => handleExport(getGroupedRadii(null), intersections, 'geojson')}
              />
            )}
            <div className="space-y-2">
              {getGroupedRadii(null).map(radius => (
                <div 
                  key={radius.id}
                  onClick={() => selectRadius(radius.id)}
                  className={clsx(
                    "bg-dark-surface rounded-lg p-3 shadow-sm border-2 cursor-pointer transition-all",
                    selectedRadiusId === radius.id ? "border-primary" : "border-transparent hover:border-gray-700"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-dark-text-primary truncate">{radius.name}</span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateRadius(radius.id, { visible: !radius.visible }); }}
                        className="p-1 text-dark-text-secondary hover:text-dark-text-primary rounded"
                      >
                        {radius.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeRadius(radius.id); }}
                        className="p-1 text-dark-text-secondary hover:text-danger rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-dark-text-secondary">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: radius.color }}></div>
                    <span>{formatRadius(radius.radius)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedRadius && (
          <div className="hidden md:block p-4 bg-dark-bg border-t border-dark-border">
             <EditPanel 
               selectedRadius={selectedRadius} 
               updateRadius={updateRadius} 
               groups={groups} 
               miles={miles} 
               feet={feet} 
               setMapCenter={setMapCenter}
               setMapZoom={setMapZoom}
             />
          </div>
        )}
      </div>

      {selectedRadius && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm" onClick={() => selectRadius(null)}>
          <div className="bg-dark-bg rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg text-dark-text-primary">Edit Location</h3>
                 <button onClick={() => selectRadius(null)} className="text-sm text-blue-400 font-semibold px-2 py-1">Done</button>
            </div>
            <EditPanel 
                 selectedRadius={selectedRadius} 
                 updateRadius={updateRadius} 
                 groups={groups} 
                 miles={miles} 
                 feet={feet} 
                 setMapCenter={setMapCenter}
                 setMapZoom={setMapZoom}
            />
          </div>
        </div>
      )}
    </>
  );
};

interface EditPanelProps {
  selectedRadius: any;
  updateRadius: any;
  groups: any[];
  miles: number;
  feet: number;
  setMapCenter: (lat: number, lng: number) => void;
  setMapZoom: (zoom: number) => void;
}

const EditPanel = ({ 
  selectedRadius, 
  updateRadius, 
  groups, 
  miles, 
  feet, 
  setMapCenter, 
  setMapZoom 
}: EditPanelProps) => {
  const [locationInput, setLocationInput] = useState(`${selectedRadius.lat.toFixed(6)}, ${selectedRadius.lng.toFixed(6)}`);

  React.useEffect(() => {
    setLocationInput(`${selectedRadius.lat.toFixed(6)}, ${selectedRadius.lng.toFixed(6)}`);
  }, [selectedRadius.lat, selectedRadius.lng]);

  const performSearch = async (val: string) => {
    const parsed = parseLocationString(val);
    if (parsed) {
      updateRadius(selectedRadius.id, { lat: parsed.lat, lng: parsed.lng });
      setMapCenter(parsed.lat, parsed.lng);
      setMapZoom(13);
      return;
    }

    if (val.trim().length > 3) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}`
        );
        const results = await response.json();
        if (results && results.length > 0) {
          const result = results[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          updateRadius(selectedRadius.id, { lat, lng });
          setMapCenter(lat, lng);
          setMapZoom(13);
        }
      } catch (e) {
        console.error("Geocoding failed", e);
      }
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const parsed = parseLocationString(locationInput);
      if (parsed) {
        updateRadius(selectedRadius.id, { lat: parsed.lat, lng: parsed.lng });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [locationInput, selectedRadius.id, updateRadius]);

  const handleLocationChange = (val: string) => {
    setLocationInput(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch(locationInput);
    }
  };

  const handleMilesChange = (m: string) => {
    const newMiles = parseInt(m) || 0;
    const newMeters = imperialToMeters(newMiles, feet);
    updateRadius(selectedRadius.id, { radius: newMeters });
  };

  const handleFeetChange = (f: string) => {
    const newFeet = parseInt(f) || 0;
    const newMeters = imperialToMeters(miles, newFeet);
    updateRadius(selectedRadius.id, { radius: newMeters });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-dark-text-secondary mb-1">Name</label>
        <input 
          type="text" 
          value={selectedRadius.name}
          onChange={(e) => updateRadius(selectedRadius.id, { name: e.target.value })}
          className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded focus:outline-none focus:border-primary text-dark-text-primary"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-dark-text-secondary mb-1">Location / Coordinates</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={locationInput}
            onChange={(e) => handleLocationChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => performSearch(locationInput)}
            placeholder="Paste coordinates or address..."
            className="flex-1 px-3 py-2 bg-dark-surface border border-dark-border rounded focus:outline-none focus:border-primary text-dark-text-primary text-sm"
          />
          <button 
            onClick={() => performSearch(locationInput)}
            className="p-2 bg-dark-surface border border-dark-border rounded text-dark-text-secondary hover:text-dark-text-primary transition-colors"
            title="Search/Update Location"
          >
            <Search size={18} />
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-dark-text-secondary mb-1">Group</label>
        <select
          value={selectedRadius.groupId || ''}
          onChange={(e) => updateRadius(selectedRadius.id, { groupId: e.target.value || null })}
          className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded focus:outline-none focus:border-primary text-dark-text-primary mb-3"
        >
          <option value="">Ungrouped</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-dark-text-secondary mb-1">Notes</label>
        <textarea 
          value={selectedRadius.notes || ''}
          onChange={(e) => updateRadius(selectedRadius.id, { notes: e.target.value })}
          placeholder="Add details about this location..."
          rows={2}
          className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded focus:outline-none focus:border-primary text-dark-text-primary text-sm resize-none placeholder-gray-600"
        />
      </div>

      <div className="border-t border-dark-border pt-3 pb-1">
        <label className="block text-xs font-bold text-dark-text-secondary uppercase mb-2">Appearance</label>
        
        <div className="grid grid-cols-2 gap-3 mb-2">
          {/* Color Picker */}
          <div>
            <label className="block text-xs font-medium text-dark-text-secondary mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={selectedRadius.color}
                onChange={(e) => updateRadius(selectedRadius.id, { color: e.target.value })}
                disabled={!!selectedRadius.groupId}
                className={clsx("w-full h-8 rounded cursor-pointer bg-dark-surface border border-dark-border p-0.5", !!selectedRadius.groupId && "opacity-50 cursor-not-allowed")}
                title={selectedRadius.groupId ? "Inherited from Group" : "Change Color"}
              />
            </div>
          </div>

           {/* Border Style */}
           <div>
              <label className="block text-xs font-medium text-dark-text-secondary mb-1">Border Style</label>
              <select
                value={selectedRadius.borderStyle}
                onChange={(e) => updateRadius(selectedRadius.id, { borderStyle: e.target.value })}
                disabled={!(selectedRadius.outline ?? true)}
                className="w-full h-8 bg-dark-surface border border-dark-border rounded px-2 text-xs text-dark-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
           </div>
        </div>

        <div className="flex items-center gap-4 mb-2">
             <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selectedRadius.fill}
                  onChange={(e) => updateRadius(selectedRadius.id, { fill: e.target.checked })}
                  className="rounded border-gray-600 bg-dark-bg text-primary focus:ring-primary"
                />
                <span className="text-xs font-medium text-dark-text-secondary">Fill</span>
             </label>

             <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selectedRadius.outline ?? true}
                  onChange={(e) => updateRadius(selectedRadius.id, { outline: e.target.checked })}
                  className="rounded border-gray-600 bg-dark-bg text-primary focus:ring-primary"
                />
                <span className="text-xs font-medium text-dark-text-secondary">Outline</span>
             </label>
        </div>

        {selectedRadius.fill && (
           <div className="flex items-center gap-2">
              <span className="text-[10px] text-dark-text-secondary w-12">Opacity</span>
              <input 
                type="range" min="0" max="1" step="0.1" 
                value={selectedRadius.opacity}
                onChange={(e) => updateRadius(selectedRadius.id, { opacity: parseFloat(e.target.value) })}
                className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-dark-text-secondary w-8 text-right">{(selectedRadius.opacity * 100).toFixed(0)}%</span>
           </div>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-dark-text-secondary mb-1">Latitude</label>
          <input 
            type="number" step="any" value={selectedRadius.lat}
            onChange={(e) => updateRadius(selectedRadius.id, { lat: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded focus:outline-none focus:border-primary text-dark-text-primary"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-dark-text-secondary mb-1">Longitude</label>
          <input 
            type="number" step="any" value={selectedRadius.lng}
            onChange={(e) => updateRadius(selectedRadius.id, { lng: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded focus:outline-none focus:border-primary text-dark-text-primary"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-dark-text-secondary mb-1">Miles</label>
          <input 
            type="number" value={miles}
            onChange={(e) => handleMilesChange(e.target.value)}
            className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded focus:outline-none focus:border-primary text-dark-text-primary"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-dark-text-secondary mb-1">Feet</label>
          <input 
            type="number" value={feet}
            onChange={(e) => handleFeetChange(e.target.value)}
            className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded focus:outline-none focus:border-primary text-dark-text-primary"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-dark-text-secondary mb-1">Radius Adjuster</label>
        <input 
          type="range" min="100" max="80467" step="10" value={selectedRadius.radius}
          onChange={(e) => updateRadius(selectedRadius.id, { radius: Number(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="text-[10px] text-dark-text-secondary mt-1 text-right italic">
          {formatRadius(selectedRadius.radius)}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;