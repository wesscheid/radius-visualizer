import React, { useState, useEffect } from 'react';
import { Group } from '../store/useStore';
import { imperialToMeters } from '../utils/format';
import { X, Target } from 'lucide-react';

interface AddRadiusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (radius: number, groupId: string | null, radiusMin?: number, radiusMax?: number) => void;
  groups: Group[];
  onCreateGroup: (name: string) => Promise<string>;
  locatingMode: 'standard' | 'hybrid';
}

const AddRadiusModal: React.FC<AddRadiusModalProps> = ({ isOpen, onClose, onConfirm, groups, onCreateGroup, locatingMode }) => {
  const [miles, setMiles] = useState<number | string>(0);
  const [feet, setFeet] = useState<number | string>(2500);
  
  // Hybrid fields
  const [minMiles, setMinMiles] = useState<number | string>(0);
  const [minFeet, setMinFeet] = useState<number | string>(2000);
  const [maxMiles, setMaxMiles] = useState<number | string>(0);
  const [maxFeet, setMaxFeet] = useState<number | string>(3000);

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState<boolean>(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMiles(0);
      setFeet(2500);
      setMinMiles(0);
      setMinFeet(2000);
      setMaxMiles(0);
      setMaxFeet(3000);
      setSelectedGroupId('');
      setNewGroupName('');
      setIsCreatingNewGroup(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let radius: number;
    let radiusMin: number | undefined;
    let radiusMax: number | undefined;

    if (locatingMode === 'hybrid') {
      radiusMin = imperialToMeters(minMiles === '' ? 0 : Number(minMiles), minFeet === '' ? 0 : Number(minFeet));
      radiusMax = imperialToMeters(maxMiles === '' ? 0 : Number(maxMiles), maxFeet === '' ? 0 : Number(maxFeet));
      radius = (radiusMin + radiusMax) / 2;
    } else {
      radius = imperialToMeters(miles === '' ? 0 : Number(miles), feet === '' ? 0 : Number(feet));
    }

    let finalGroupId: string | null = selectedGroupId || null;

    if (isCreatingNewGroup) {
      if (!newGroupName.trim()) {
        alert("Please enter a name for the new group.");
        return;
      }
      finalGroupId = await onCreateGroup(newGroupName);
    } else if (!selectedGroupId) {
      alert("Please select a group or create a new one.");
      return;
    }
    
    if (radius === 0 && !radiusMax) {
      alert("Radius distance cannot be zero.");
      return;
    }
    onConfirm(radius, finalGroupId, radiusMin, radiusMax);
  };

  const isFormValid = () => {
    const isGroupValid = (selectedGroupId !== '' && !isCreatingNewGroup) || (isCreatingNewGroup && newGroupName.trim() !== '');
    
    if (locatingMode === 'hybrid') {
      const min = imperialToMeters(minMiles === '' ? 0 : Number(minMiles), minFeet === '' ? 0 : Number(minFeet));
      const max = imperialToMeters(maxMiles === '' ? 0 : Number(maxMiles), maxFeet === '' ? 0 : Number(maxFeet));
      return isGroupValid && max > 0 && max >= min;
    } else {
      const meters = imperialToMeters(miles === '' ? 0 : Number(miles), feet === '' ? 0 : Number(feet));
      return isGroupValid && meters > 0;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-dark-bg border border-dark-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-dark-border bg-dark-surface">
          <h3 className="font-bold text-lg text-dark-text-primary">Add Location</h3>
          <button 
            onClick={onClose}
            className="text-dark-text-secondary hover:text-dark-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {locatingMode === 'standard' ? (
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">Radius Distance</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={miles}
                      onChange={(e) => setMiles(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded focus:outline-none focus:border-primary text-dark-text-primary"
                    />
                    <span className="absolute right-3 top-2 text-xs text-dark-text-secondary font-medium pointer-events-none">mi</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="5279"
                      value={feet}
                      onChange={(e) => setFeet(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded focus:outline-none focus:border-primary text-dark-text-primary"
                    />
                    <span className="absolute right-3 top-2 text-xs text-dark-text-secondary font-medium pointer-events-none">ft</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                   <Target size={16} className="text-primary" />
                   <span className="text-xs font-bold text-dark-text-primary uppercase">Hybrid Range</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-dark-text-secondary mb-1 uppercase tracking-wider">Min Distance (Farther than...)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="number" value={minMiles}
                          onChange={(e) => setMinMiles(e.target.value)}
                          className="w-full pl-2 pr-6 py-1.5 bg-dark-bg border border-dark-border rounded text-xs text-dark-text-primary focus:border-primary outline-none"
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] text-dark-text-secondary">mi</span>
                      </div>
                      <div className="relative flex-1">
                        <input 
                          type="number" value={minFeet}
                          onChange={(e) => setMinFeet(e.target.value)}
                          className="w-full pl-2 pr-6 py-1.5 bg-dark-bg border border-dark-border rounded text-xs text-dark-text-primary focus:border-primary outline-none"
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] text-dark-text-secondary">ft</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-dark-text-secondary mb-1 uppercase tracking-wider">Max Distance (No farther than...)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="number" value={maxMiles}
                          onChange={(e) => setMaxMiles(e.target.value)}
                          className="w-full pl-2 pr-6 py-1.5 bg-dark-bg border border-dark-border rounded text-xs text-dark-text-primary focus:border-primary outline-none"
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] text-dark-text-secondary">mi</span>
                      </div>
                      <div className="relative flex-1">
                        <input 
                          type="number" value={maxFeet}
                          onChange={(e) => setMaxFeet(e.target.value)}
                          className="w-full pl-2 pr-6 py-1.5 bg-dark-bg border border-dark-border rounded text-xs text-dark-text-primary focus:border-primary outline-none"
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] text-dark-text-secondary">ft</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">Assign to Group</label>
            <select
              value={isCreatingNewGroup ? 'create-new-group' : selectedGroupId}
              onChange={(e) => {
                if (e.target.value === 'create-new-group') {
                  setIsCreatingNewGroup(true);
                  setSelectedGroupId('');
                } else {
                  setIsCreatingNewGroup(false);
                  setSelectedGroupId(e.target.value);
                }
              }}
              className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded focus:outline-none focus:border-primary text-dark-text-primary"
            >
              <option value="">Ungrouped</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
              <option value="create-new-group">Create New Group...</option>
            </select>
            {isCreatingNewGroup && (
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter new group name"
                className="w-full px-3 py-2 mt-2 bg-dark-surface border border-dark-border rounded focus:outline-none focus:border-primary text-dark-text-primary"
              />
            )}
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-dark-surface border border-dark-border rounded text-dark-text-primary font-medium hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid()}
              className="flex-1 py-2.5 bg-primary rounded text-white font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRadiusModal;