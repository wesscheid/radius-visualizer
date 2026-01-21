import React, { useEffect } from 'react';
import { useStore, IntersectionPoint } from '../store/useStore';
import { getCircleIntersections, calculateTrilateration } from '../utils/trilateration';
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
      // 1. Calculate pairwise intersections (2-circle) within the group
      for (let i = 0; i < groupRadii.length; i++) {
        for (let j = i + 1; j < groupRadii.length; j++) {
          const c1 = groupRadii[i];
          const c2 = groupRadii[j];
          
          const points = getCircleIntersections(c1, c2);
          
          const color1 = getRadiusColor(c1.id);
          const color2 = getRadiusColor(c2.id);
          const avgColor = getAverageColor([color1, color2]);
          
          points.forEach(p => {
            newIntersections.push({
              id: uuidv4(),
              lat: p.lat,
              lng: p.lng,
              type: '2-circle',
              confidence: 1.0, 
              parents: [c1.id, c2.id],
              color: avgColor
            });
          });
        }
      }

      // 2. Calculate Multilateration Best Fit (3+ circles) for the group
      if (groupRadii.length >= 3) {
        const bestFit = calculateTrilateration(groupRadii);
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
            color: getAverageColor(allColors)
          });
        }
      }
    });

    setIntersections(newIntersections);

  }, [radii, groups, setIntersections]);

  return null;
};

export default TrilaterationLogic;
