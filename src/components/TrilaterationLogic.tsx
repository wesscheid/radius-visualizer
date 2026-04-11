import React, { useEffect } from 'react';
import { useStore, IntersectionPoint } from '../store/useStore';
import { getCircleIntersections, calculateRangeTrilateration, distance } from '../utils/trilateration';
import { getAverageColor } from '../utils/format';
import { v4 as uuidv4 } from 'uuid';

const TrilaterationLogic: React.FC = () => {
  const { radii, groups, setIntersections } = useStore();

  useEffect(() => {
    // Group radii by groupId (using 'ungrouped' for null/undefined)
    const radiiByGroup: Record<string, typeof radii> = {};

    radii.forEach(r => {
      const group = groups.find(g => g.id === r.groupId);
      // Check visibility: radius must be visible AND its group (if any) must be visible
      const isGroupVisible = group ? group.visible : true;
      
      if (r.visible && isGroupVisible) {
        const key = r.groupId || 'ungrouped';
        if (!radiiByGroup[key]) {
          radiiByGroup[key] = [];
        }
        radiiByGroup[key].push(r);
      }
    });
    
    const newIntersections: IntersectionPoint[] = [];

    // Helper to get color of a radius
    const getRadiusColor = (radiusId: string) => {
      const r = radii.find(x => x.id === radiusId);
      if (!r) return "#ffffff";
      const group = groups.find(g => g.id === r.groupId);
      return group ? group.color : r.color;
    };

    // Process each group independently
    Object.values(radiiByGroup).forEach(groupRadii => {
      // Pre-calculate ranges for each unique location in the group
      const locations = new Map<string, { lat: number; lng: number; rMin: number; rMax: number }>();
      groupRadii.forEach(r => {
        const key = `${r.lat.toFixed(6)},${r.lng.toFixed(6)}`;
        const rMin = r.radiusMin ?? r.radius;
        const rMax = r.radiusMax ?? r.radius;
        const existing = locations.get(key);
        if (existing) {
          existing.rMin = Math.min(existing.rMin, rMin);
          existing.rMax = Math.max(existing.rMax, rMax);
        } else {
          locations.set(key, { lat: r.lat, lng: r.lng, rMin, rMax });
        }
      });

      const locationList = Array.from(locations.values());

      // 1. Calculate pairwise intersections (2-circle) within the group
      for (let i = 0; i < groupRadii.length; i++) {
        for (let j = i + 1; j < groupRadii.length; j++) {
          const c1 = groupRadii[i];
          const c2 = groupRadii[j];
          
          // Skip if same center (range boundary)
          const dCenters = distance(c1, c2);
          if (dCenters < 0.1) continue;

          // For pairwise, we use the standard radius or mid-radius as a representative
          const points = getCircleIntersections(c1, c2);
          
          const color1 = getRadiusColor(c1.id);
          const color2 = getRadiusColor(c2.id);
          const avgColor = getAverageColor([color1, color2]);
          
          points.forEach(p => {
            // Plausibility Check: Is this intersection point within the ranges of all OTHER locations?
            const isPlausible = locationList.every(loc => {
              const d = distance(p, loc);
              return d >= loc.rMin - 10 && d <= loc.rMax + 10; // 10m tolerance
            });

            if (isPlausible) {
              newIntersections.push({
                id: uuidv4(),
                lat: p.lat,
                lng: p.lng,
                type: '2-circle',
                confidence: 1.0, 
                parents: [c1.id, c2.id],
                color: avgColor
              });
            }
          });
        }
      }

      // 2. Calculate Multilateration Best Fit (2+ locations) for the group
      if (locationList.length >= 2) {
        const bestFit = calculateRangeTrilateration(groupRadii);
        if (bestFit) {
          const allColors = groupRadii.map(r => getRadiusColor(r.id));
          
          newIntersections.push({
            id: uuidv4(),
            lat: bestFit.point.lat,
            lng: bestFit.point.lng,
            type: 'best-fit',
            confidence: bestFit.confidence,
            errorRadius: bestFit.errorRadius,
            parents: groupRadii.map(r => r.id),
            color: getAverageColor(allColors),
            polygonPoints: bestFit.polygonPoints
          });

        }
      }
    });

    setIntersections(newIntersections);

  }, [radii, groups, setIntersections]);

  return null;
};

export default TrilaterationLogic;
