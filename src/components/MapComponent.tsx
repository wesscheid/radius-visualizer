import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../store/useStore';
import { auth } from '../firebase';

// Fix for default Leaflet marker icons in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapUpdater = () => {
  const map = useMap();
  const { mapCenter } = useStore();

  useEffect(() => {
    map.setView([mapCenter.lat, mapCenter.lng], map.getZoom());
  }, [mapCenter, map]);

  return null;
};

const MapEvents = () => {
  const { addRadius } = useStore();
  
  useMapEvents({
    click(e) {
      addRadius(e.latlng.lat, e.latlng.lng, auth.currentUser?.uid);
    },
  });

  return null;
};

const MapComponent: React.FC = () => {
  const { 
    radii, 
    selectedRadiusId, 
    selectRadius,
    updateRadius,
    mapCenter
  } = useStore();

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={10}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater />
        <MapEvents />

        {radii.map((radius) => (
          radius.visible && (
            <React.Fragment key={radius.id}>
              <Marker 
                position={[radius.lat, radius.lng]}
                draggable={selectedRadiusId === radius.id}
                eventHandlers={{
                  click: () => selectRadius(radius.id),
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    updateRadius(radius.id, { lat: position.lat, lng: position.lng });
                  },
                }}
              />
              <Circle
                center={[radius.lat, radius.lng]}
                radius={radius.radius}
                pathOptions={{
                  color: radius.color,
                  fillColor: radius.color,
                  fillOpacity: radius.fill ? radius.opacity : 0,
                  weight: selectedRadiusId === radius.id ? 3 : 1,
                  dashArray: radius.borderStyle === 'dashed' ? '5, 5' : radius.borderStyle === 'dotted' ? '1, 5' : undefined,
                }}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    selectRadius(radius.id);
                  },
                }}
              />
            </React.Fragment>
          )
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;