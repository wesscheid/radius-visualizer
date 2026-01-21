import React from 'react';
import { useStore } from '../store/useStore';
import { XCircle } from 'lucide-react';

const GeolocationWarning: React.FC = () => {
  const { showGeolocationWarning, setShowGeolocationWarning, geolocationDenied } = useStore();

  if (!showGeolocationWarning) {
    return null;
  }

  const message = geolocationDenied
    ? "Geolocation is not supported by your browser. You will not be able to use location-based features."
    : "Unable to retrieve your location. Please ensure location services are enabled and you have granted permission.";

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 p-4 bg-red-600 text-white rounded-lg shadow-xl flex items-center justify-between z-50 max-w-sm">
      <div className="flex items-center">
        <XCircle size={24} className="mr-3" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button 
        onClick={() => setShowGeolocationWarning(false)}
        className="ml-4 p-1 rounded-full hover:bg-red-700 transition-colors"
        aria-label="Dismiss warning"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default GeolocationWarning;
