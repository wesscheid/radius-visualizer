import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline, Tooltip, useMap, useMapEvents, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../store/useStore';
import { auth } from '../firebase';
import { formatRadius } from '../utils/format';

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
  const { mapCenter, mapZoom } = useStore();

  useEffect(() => {
    map.setView([mapCenter.lat, mapCenter.lng], mapZoom);
  }, [mapCenter, mapZoom, map]);

  return null;
};

const MapEvents = () => {
  const { addRadius, setMapCenter, setMapZoom, isMeasuring, addMeasurementPoint } = useStore();
  const map = useMap();
  
  useMapEvents({
    click(e) {
      if (isMeasuring) {
        addMeasurementPoint(e.latlng.lat, e.latlng.lng);
      } else {
        addRadius(e.latlng.lat, e.latlng.lng, auth.currentUser?.uid);
      }
    },
    moveend() {
      const center = map.getCenter();
      setMapCenter(center.lat, center.lng);
    },
    zoomend() {
      setMapZoom(map.getZoom());
    }
  });

  return null;
};

const MapComponent: React.FC = () => {
  const { 
    radii, 
    groups,
    selectedRadiusId, 
    selectRadius,
    updateRadius,
    mapCenter,
    isMeasuring,
    measurementPoints,
    intersections,
    showIntersections
  } = useStore();

  return (
    <div className={`w-full h-full ${isMeasuring ? 'cursor-crosshair' : ''}`}>
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={10}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          url={`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${process.env.REACT_APP_STADIA_API_KEY}`}
        />
        
        <MapUpdater />
        <MapEvents />

        {/* Measurement Tool Rendering */}
        {measurementPoints.map((point, index) => (
          <CircleMarker 
            key={`measure-${index}`}
            center={[point.lat, point.lng]}
            radius={5}
            pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 1 }}
          />
        ))}

        {measurementPoints.length === 2 && (
          <Polyline 
            positions={[
              [measurementPoints[0].lat, measurementPoints[0].lng],
              [measurementPoints[1].lat, measurementPoints[1].lng]
            ]}
            pathOptions={{ color: '#2563eb', dashArray: '5, 10' }}
          >
            <Tooltip permanent direction="center" className="text-sm font-bold">
              {formatRadius(L.latLng(measurementPoints[0]).distanceTo(L.latLng(measurementPoints[1])))}
            </Tooltip>
          </Polyline>
        )}

        {/* Intersection Points Rendering */}
        {showIntersections && intersections.map((intersection) => {
          if (intersection.type === 'best-fit') {
            const confidenceColor = intersection.confidence > 0.8 ? '#10B981' : intersection.confidence > 0.5 ? '#F59E0B' : '#EF4444';
            const markerColor = intersection.color || confidenceColor;
            
            return (
              <React.Fragment key={intersection.id}>
                {/* Uncertainty Region */}
                {intersection.errorRadius && (
                  <Circle 
                    center={[intersection.lat, intersection.lng]}
                    radius={intersection.errorRadius}
                    pathOptions={{ 
                      color: markerColor, 
                      fillColor: markerColor, 
                      fillOpacity: 0.15, 
                      weight: 1, 
                      dashArray: '4, 4' 
                    }}
                    interactive={false}
                  />
                )}
                
                {/* Best Fit Point */}
                <CircleMarker
                  center={[intersection.lat, intersection.lng]}
                  radius={8}
                  pathOptions={{ 
                    color: '#ffffff', 
                    weight: 2, 
                    fillColor: markerColor, 
                    fillOpacity: 1 
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]}>
                    <div className="text-center">
                      <strong>Estimated Location</strong><br/>
                      Conf: {(intersection.confidence * 100).toFixed(0)}%<br/>
                      Error: ±{intersection.errorRadius?.toFixed(1)}m<br/>
                      {intersection.lat.toFixed(5)}, {intersection.lng.toFixed(5)}
                    </div>
                  </Tooltip>
                </CircleMarker>
              </React.Fragment>
            );
          } else {
            // 2-circle intersections
            const pointColor = intersection.color || '#F59E0B';
            return (
              <CircleMarker
                key={intersection.id}
                center={[intersection.lat, intersection.lng]}
                radius={4}
                pathOptions={{ 
                  color: '#ffffff', 
                  weight: 1, 
                  fillColor: pointColor, 
                  fillOpacity: 0.8 
                }}
              />
            );
          }
        })}

        {radii.map((radius) => {
          const group = groups.find(g => g.id === radius.groupId);
          const isVisible = radius.visible && (group ? group.visible : true);
          const color = group ? group.color : radius.color;

          return isVisible && (
            <React.Fragment key={radius.id}>
              <Marker 
                position={[radius.lat, radius.lng]}
                draggable={selectedRadiusId === radius.id}
                eventHandlers={{
                  click: () => !isMeasuring && selectRadius(radius.id),
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
                  color: color,
                  fillColor: color,
                  fillOpacity: radius.fill ? radius.opacity : 0,
                  weight: selectedRadiusId === radius.id ? 3 : 1,
                  dashArray: radius.borderStyle === 'dashed' ? '5, 5' : radius.borderStyle === 'dotted' ? '1, 5' : undefined,
                }}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    if (!isMeasuring) selectRadius(radius.id);
                  },
                }}
              />
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;