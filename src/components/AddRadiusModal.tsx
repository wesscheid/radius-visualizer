import React, { useState, useEffect } from 'react';
import { Group } from '../store/useStore';
import { imperialToMeters } from '../utils/format';
import { X } from 'lucide-react';

interface AddRadiusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (radius: number, groupId: string | null) => void;
  groups: Group[];
  onCreateGroup: (name: string) => Promise<string>;
}

const AddRadiusModal: React.FC<AddRadiusModalProps> = ({ isOpen, onClose, onConfirm, groups, onCreateGroup }) => {
  const [miles, setMiles] = useState<number | string>(0);
  const [feet, setFeet] = useState<number | string>(2500);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState<boolean>(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMiles(0);
      setFeet(2500);
      setSelectedGroupId('');
      setNewGroupName('');
      setIsCreatingNewGroup(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const m = miles === '' ? 0 : Number(miles);
    const f = feet === '' ? 0 : Number(feet);
    const meters = imperialToMeters(m, f);

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
    
    if (meters === 0) {
      alert("Radius distance cannot be zero.");
      return;
    }
    onConfirm(meters, finalGroupId);
  };

  const isFormValid = () => {
    const m = miles === '' ? 0 : Number(miles);
    const f = feet === '' ? 0 : Number(feet);
    const meters = imperialToMeters(m, f);
    const isRadiusValid = meters > 0;
    const isGroupValid = (selectedGroupId !== '' && !isCreatingNewGroup) || (isCreatingNewGroup && newGroupName.trim() !== '');
    return isRadiusValid && isGroupValid;
  };


  const handleMilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setMiles('');
    } else {
      const num = parseInt(val);
      if (!isNaN(num)) {
        setMiles(num);
      }
    }
  };

  const handleFeetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setFeet('');
    } else {
      const num = parseInt(val);
      if (!isNaN(num)) {
        setFeet(num);
      }
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
          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">Radius Distance</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={miles}
                    onChange={handleMilesChange}
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
                    onChange={handleFeetChange}
                    className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded focus:outline-none focus:border-primary text-dark-text-primary"
                  />
                  <span className="absolute right-3 top-2 text-xs text-dark-text-secondary font-medium pointer-events-none">ft</span>
                </div>
              </div>
            </div>
          </div>

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