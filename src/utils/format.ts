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