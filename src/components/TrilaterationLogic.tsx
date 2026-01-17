import React, { useEffect } from 'react';
import { useStore, IntersectionPoint } from '../store/useStore';
import { getCircleIntersections, calculateTrilateration } from '../utils/trilateration';
import { getAverageColor } from '../utils/format';
import { v4 as uuidv4 } from 'uuid';

const TrilaterationLogic: React.FC = () => {
  const { radii, groups, setIntersections } = useStore();

  useEffect(() => {
    const visibleRadii = radii.filter(r => {
      const group = groups.find(g => g.id === r.groupId);
      return r.visible && (group ? group.visible : true);
    });
    
    const newIntersections: IntersectionPoint[] = [];

    // Helper to get color of a radius (from group or self)
    const getRadiusColor = (radiusId: string) => {
      const r = radii.find(x => x.id === radiusId);
      if (!r) return "#ffffff";
      const group = groups.find(g => g.id === r.groupId);
      return group ? group.color : r.color;
    };

    // 1. Calculate pairwise intersections (2 circles)
    for (let i = 0; i < visibleRadii.length; i++) {
      for (let j = i + 1; j < visibleRadii.length; j++) {
        const c1 = visibleRadii[i];
        const c2 = visibleRadii[j];
        
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

    // 2. Calculate Multilateration Best Fit (3+ circles)
    if (visibleRadii.length >= 3) {
      const bestFit = calculateTrilateration(visibleRadii);
      if (bestFit) {
        const allColors = visibleRadii.map(r => getRadiusColor(r.id));
        
        newIntersections.push({
          id: uuidv4(),
          lat: bestFit.point.lat,
          lng: bestFit.point.lng,
          type: 'best-fit',
          confidence: bestFit.confidence,
          errorRadius: bestFit.errorRadius,
          parents: visibleRadii.map(r => r.id),
          color: getAverageColor(allColors)
        });
      }
    }

    setIntersections(newIntersections);

  }, [radii, groups, setIntersections]);

  return null;
};

export default TrilaterationLogic;
