// src/utils/format.ts

export const METERS_TO_FEET = 3.28084;
export const FEET_IN_MILE = 5280;

export const metersToImperial = (meters: number) => {
  const totalFeet = meters * METERS_TO_FEET;
  const miles = Math.floor(totalFeet / FEET_IN_MILE);
  const feet = Math.round(totalFeet % FEET_IN_MILE);
  return { miles, feet };
};

export const imperialToMeters = (miles: number, feet: number) => {
  const totalFeet = (miles * FEET_IN_MILE) + feet;
  return totalFeet / METERS_TO_FEET;
};

export const formatRadius = (meters: number): string => {
  if (meters === 0) return '0 ft';

  const totalFeet = meters * METERS_TO_FEET;

  // If under a quarter mile, it's more intuitive to see feet
  if (totalFeet < (FEET_IN_MILE / 4)) {
    return `${Math.round(totalFeet)} ft`;
  }
  
  const miles = Math.floor(totalFeet / FEET_IN_MILE);
  const remainingFeet = Math.round(totalFeet % FEET_IN_MILE);

  if (remainingFeet === 0) {
    return `${miles} mi`;
  }
  
  // For larger distances, don't show feet if it's less than 100 to avoid noise like "5 mi 1 ft"
  if (remainingFeet < 100) {
    const milesDecimal = totalFeet / FEET_IN_MILE;
    // show one decimal place if it's not a whole number
    return `${parseFloat(milesDecimal.toFixed(1))} mi`;
  }

  return `${miles} mi ${remainingFeet} ft`;
};

/**
 * Trigger a browser download of a string content
 */
export const downloadFile = (content: string, fileName: string, contentType: string) => {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
};

/**
 * Converts a list of objects to CSV content
 */
export const convertToCSV = (data: any[]) => {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(obj => 
    Object.values(obj).map(val => 
      typeof val === 'string' ? `"${val}"` : val
    ).join(",")
  );
  return [headers, ...rows].join("\n");
};

/**
 * Converts map data to GeoJSON FeatureCollection
 */
export const convertToGeoJSON = (radii: any[], intersections: any[]) => {
  const features = [
    ...radii.map(r => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [r.lng, r.lat]
      },
      properties: {
        name: r.name,
        radius_meters: r.radius,
        color: r.color,
        type: "radius_source"
      }
    })),
    ...intersections.map(i => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [i.lng, i.lat]
      },
      properties: {
        type: i.type,
        confidence: i.confidence,
        error_radius: i.errorRadius,
        name: i.type === 'best-fit' ? "Estimated Location" : "Pairwise Intersection"
      }
    }))
  ];

  return JSON.stringify({
    type: "FeatureCollection",
    features
  }, null, 2);
};

/**
 * Calculates the average color from a list of hex color strings.
 */
export const getAverageColor = (colors: string[]): string => {
  if (colors.length === 0) return "#000000";
  if (colors.length === 1) return colors[0];

  let r = 0, g = 0, b = 0;

  colors.forEach(hex => {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Parse r, g, b
    const ri = parseInt(cleanHex.substring(0, 2), 16);
    const gi = parseInt(cleanHex.substring(2, 4), 16);
    const bi = parseInt(cleanHex.substring(4, 6), 16);
    
    // We average the squares of the colors for better perceptual result
    r += ri * ri;
    g += gi * gi;
    b += bi * bi;
  });

  const n = colors.length;
  const ra = Math.round(Math.sqrt(r / n)).toString(16).padStart(2, '0');
  const ga = Math.round(Math.sqrt(g / n)).toString(16).padStart(2, '0');
  const ba = Math.round(Math.sqrt(b / n)).toString(16).padStart(2, '0');

  return `#${ra}${ga}${ba}`;
};