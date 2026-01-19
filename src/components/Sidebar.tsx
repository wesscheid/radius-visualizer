import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Trash2, Eye, EyeOff, MapPin, Layers, Plus, FolderOpen, Crosshair, Target, AlertCircle, ChevronDown, ChevronRight, Download, Save, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { formatRadius, metersToImperial, imperialToMeters, downloadFile, convertToCSV, convertToGeoJSON } from '../utils/format';
import { auth, googleProvider } from '../firebase';
import { distance } from '../utils/trilateration';
import { linkWithPopup, signInWithPopup, User, GoogleAuthProvider } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

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
    toggleSidebar,
    showIntersections,
    toggleIntersectionDisplay,
    intersections,
    clearAllRadii
  } = useStore();

  const [user] = useAuthState(auth);
  const [isGuest, setIsGuest] = useState(true);

  // Sync isGuest with user state whenever user changes
  React.useEffect(() => {
    if (user) {
      setIsGuest(user.isAnonymous);
    }
  }, [user]);

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

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to delete ALL locations and groups? This cannot be undone.")) {
      try {
        await clearAllRadii();
      } catch (error) {
        console.error("Failed to clear data:", error);
        alert("Failed to clear data. Please try again.");
      }
    }
  };

  const handleLinkAccount = async () => {
    if (!user) return;
    try {
      await linkWithPopup(user, googleProvider);
      // Force token refresh to update claims and UI
      await user.reload();
      await user.getIdToken(true);
      alert("Account successfully linked!");
    } catch (error: any) {
      console.error("Error linking account:", error);
      if (error.code === 'auth/credential-already-in-use') {
         if (window.confirm("This Google account is already associated with another user. Do you want to sign in with this account instead? (Note: Current temporary data will be lost if not saved)")) {
            try {
              await signInWithPopup(auth, googleProvider);
            } catch (signInError: any) {
              console.error("Error signing in:", signInError);
              alert("Failed to sign in: " + signInError.message);
            }
         }
      } else {
         alert("Failed to link account: " + error.message);
      }
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
      alert("Failed to create group. Please check your connection.");
    }
  };

  const getGroupedRadii = (groupId: string | null) => {
    return radii.filter(r => (groupId === null ? !r.groupId : r.groupId === groupId));
  };

  if (!sidebarOpen && !selectedRadius) return null;

  return (
    <>
      {/* Main Sidebar / Bottom Sheet */}
      <div className={clsx(
        "fixed md:absolute bottom-0 md:top-0 left-0 md:left-auto right-0",
        "h-[50vh] md:h-full w-full md:w-80 bg-dark-bg shadow-xl z-10",
        "flex flex-col transition-transform duration-300 rounded-t-2xl md:rounded-none border-r border-dark-border",
        sidebarOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"
      )}>
        {/* Drag Handle for Mobile */}
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
            </div>
          </div>
          
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

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-dark-bg pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-4">
          
          {/* Account & Data Management */}
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
                  <button 
                    onClick={handleLinkAccount}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium transition-colors"
                  >
                    <Save size={16} /> Save Data (Link Google)
                  </button>
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

          {/* ... Rest of the Sidebar (Results, Groups, Ungrouped) remains identical ... */}
          {/* ResultsPanel */}
          {showIntersections && bestFit && (
            <div className="bg-dark-surface border border-dark-border rounded-lg p-3 mb-4">
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
                    {radii.filter(r => r.visible).map(r => {
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
                    onClick={handleExportCSV}
                    className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold bg-dark-surface text-dark-text-secondary hover:bg-gray-700 py-2 rounded transition-colors border border-dark-border"
                  >
                    <Download size={12} /> CSV
                  </button>
                  <button 
                    onClick={handleExportGeoJSON}
                    className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold bg-dark-surface text-dark-text-secondary hover:bg-gray-700 py-2 rounded transition-colors border border-dark-border"
                  >
                    <Download size={12} /> GeoJSON
                  </button>
                </div>
              </div>
            </div>
          )}

          {groups.map(group => (
            <div key={group.id} className="bg-dark-surface rounded-lg shadow-sm border border-dark-border overflow-hidden">
              <div className="p-3 bg-dark-bg flex items-center justify-between border-b border-dark-border">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FolderOpen className="w-4 h-4 text-dark-text-secondary flex-shrink-0" />
                  <span className="font-semibold text-dark-text-primary text-sm truncate">{group.name}</span>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                </div>
                <div className="flex items-center gap-1">
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
              
              <div className="p-2 space-y-2">
                {getGroupedRadii(group.id).map(radius => (
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
          ))}

          <div>
            <h3 className="text-xs font-bold text-dark-text-secondary uppercase mb-2 px-1">Ungrouped</h3>
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
            />
          </div>
        </div>
      )}
    </>
  );
};

const EditPanel: React.FC<{
  selectedRadius: any,
  updateRadius: any,
  groups: any[],
  miles: number,
  feet: number
}> = ({ selectedRadius, updateRadius, groups, miles, feet }) => {
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
        <label className="block text-xs font-medium text-dark-text-secondary mb-1">Group</label>
        <select
          value={selectedRadius.groupId || ''}
          onChange={(e) => updateRadius(selectedRadius.id, { groupId: e.target.value || null })}
          className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded focus:outline-none focus:border-primary text-dark-text-primary"
        >
          <option value="">Ungrouped</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
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
      <div>
        <label className="block text-xs font-medium text-dark-text-secondary mb-1">Radius (mi)</label>
        <input 
          type="range" min="100" max="80467" step="100" value={selectedRadius.radius}
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