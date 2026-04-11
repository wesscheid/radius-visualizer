import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline, Tooltip, useMap, useMapEvents, CircleMarker, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../store/useStore';
import { formatRadius } from '../utils/format';
import { computeDestinationPoint } from '../utils/trilateration';

/**
 * Generates an array of points forming a circle, used for complex polygon rendering (like annulus).
 */
const generateCirclePoints = (center: { lat: number; lng: number }, radius: number, points: number = 64) => {
  const coords: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const bearing = (i * 360) / points;
    const p = computeDestinationPoint(center, radius, bearing);
    coords.push([p.lat, p.lng]);
  }
  return coords;
};

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
  const { setMapCenter, setMapZoom, isMeasuring, addMeasurementPoint } = useStore();
  const map = useMap();
  
  useMapEvents({
    click(e) {
      if (isMeasuring) {
        addMeasurementPoint(e.latlng.lat, e.latlng.lng);
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
    locatingMode,
    selectRadius,
    updateRadius,
    mapCenter,
    isMeasuring,
    measurementPoints,
    intersections,
    showIntersections,
    hideInputRadii,
    focusOverlap
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
                
                {/* Overlap Area Polygon */}
                {intersection.polygonPoints && (
                  <Polygon
                    positions={intersection.polygonPoints.map(p => [p.lat, p.lng] as [number, number])}
                    pathOptions={{
                      color: markerColor,
                      fillColor: markerColor,
                      fillOpacity: 0.3,
                      weight: 2,
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
          const isHybrid = locatingMode === 'hybrid';
          
          const handlePos = computeDestinationPoint({ lat: radius.lat, lng: radius.lng }, radius.radius, 90);
          const minHandlePos = isHybrid && radius.radiusMin ? computeDestinationPoint({ lat: radius.lat, lng: radius.lng }, radius.radiusMin, 45) : null;
          const maxHandlePos = isHybrid && radius.radiusMax ? computeDestinationPoint({ lat: radius.lat, lng: radius.lng }, radius.radiusMax, 135) : null;

          return isVisible && (
            <React.Fragment key={radius.id}>
              {/* Marker - always visible if radius is visible, unless explicitly hidden by other logic */}
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
              
              {!hideInputRadii && !focusOverlap && (
                <>
                  {isHybrid ? (
                    <>
                      {/* Min Radius - Dashed outline */}
                      <Circle
                        center={[radius.lat, radius.lng]}
                        radius={radius.radiusMin ?? radius.radius}
                        pathOptions={{
                          color: color,
                          fillColor: 'transparent',
                          fillOpacity: 0,
                          weight: (radius.outline ?? true) ? (selectedRadiusId === radius.id ? 2 : 1) : 0,
                          dashArray: '5, 10',
                        }}
                        interactive={false}
                      />

                      {/* Annulus Fill - Color ONLY the ring between min and max */}
                      {radius.fill && (
                        <Polygon
                          positions={[
                            generateCirclePoints({ lat: radius.lat, lng: radius.lng }, radius.radiusMax ?? radius.radius, 128),
                            generateCirclePoints({ lat: radius.lat, lng: radius.lng }, radius.radiusMin ?? 0, 128)
                          ]}
                          pathOptions={{
                            fillColor: color,
                            fillOpacity: radius.opacity,
                            stroke: false,
                          }}
                          interactive={true}
                          eventHandlers={{
                            click: (e) => {
                              L.DomEvent.stopPropagation(e);
                              if (!isMeasuring) selectRadius(radius.id);
                            },
                          }}
                        />
                      )}

                      {/* Max Radius - Provides the outer solid outline and interactive selection area */}
                      <Circle
                        center={[radius.lat, radius.lng]}
                        radius={radius.radiusMax ?? radius.radius}
                        pathOptions={{
                          color: color,
                          fillColor: 'transparent',
                          fillOpacity: 0.0001, // Invisible but interactive for easier clicking
                          weight: (radius.outline ?? true) ? (selectedRadiusId === radius.id ? 2 : 1) : 0,
                        }}
                        eventHandlers={{
                          click: (e) => {
                            L.DomEvent.stopPropagation(e);
                            if (!isMeasuring) selectRadius(radius.id);
                          },
                        }}
                      />
                    </>
                  ) : (
                    <Circle
                      center={[radius.lat, radius.lng]}
                      radius={radius.radius}
                      pathOptions={{
                        color: color,
                        fillColor: color,
                        fillOpacity: radius.fill ? radius.opacity : 0,
                        weight: (radius.outline ?? true) ? (selectedRadiusId === radius.id ? 3 : 1) : 0,
                        dashArray: radius.borderStyle === 'dashed' ? '5, 5' : radius.borderStyle === 'dotted' ? '1, 5' : undefined,
                      }}
                      eventHandlers={{
                        click: (e) => {
                          L.DomEvent.stopPropagation(e);
                          if (!isMeasuring) selectRadius(radius.id);
                        },
                      }}
                    />
                  )}
                </>
              )}

              {selectedRadiusId === radius.id && !focusOverlap && (
                <>
                  {!isHybrid && (
                    <>
                      <Polyline 
                        positions={[
                          [radius.lat, radius.lng],
                          [handlePos.lat, handlePos.lng]
                        ]}
                        pathOptions={{ color: 'black', weight: 1, dashArray: '4, 4', opacity: 0.5 }}
                        interactive={false}
                      />
                      <Marker
                        position={[handlePos.lat, handlePos.lng]}
                        draggable={true}
                        icon={L.divIcon({ className: 'radius-handle', iconSize: [12, 12] })}
                        eventHandlers={{
                          drag: (e) => {
                            const marker = e.target;
                            const newPos = marker.getLatLng();
                            const center = L.latLng(radius.lat, radius.lng);
                            const newRadius = center.distanceTo(newPos);
                            updateRadius(radius.id, { radius: newRadius });
                          },
                        }}
                      />
                    </>
                  )}
                  
                  {isHybrid && minHandlePos && (
                    <Marker
                      position={[minHandlePos.lat, minHandlePos.lng]}
                      draggable={true}
                      icon={L.divIcon({ className: 'radius-handle min-handle', iconSize: [12, 12] })}
                      eventHandlers={{
                        drag: (e) => {
                          const marker = e.target;
                          const newPos = marker.getLatLng();
                          const center = L.latLng(radius.lat, radius.lng);
                          const newRadius = center.distanceTo(newPos);
                          updateRadius(radius.id, { radiusMin: newRadius });
                        },
                      }}
                    >
                      <Tooltip direction="top">Min Radius</Tooltip>
                    </Marker>
                  )}

                  {isHybrid && maxHandlePos && (
                    <Marker
                      position={[maxHandlePos.lat, maxHandlePos.lng]}
                      draggable={true}
                      icon={L.divIcon({ className: 'radius-handle max-handle', iconSize: [12, 12] })}
                      eventHandlers={{
                        drag: (e) => {
                          const marker = e.target;
                          const newPos = marker.getLatLng();
                          const center = L.latLng(radius.lat, radius.lng);
                          const newRadius = center.distanceTo(newPos);
                          updateRadius(radius.id, { radiusMax: newRadius });
                        },
                      }}
                    >
                      <Tooltip direction="top">Max Radius</Tooltip>
                    </Marker>
                  )}
                </>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;