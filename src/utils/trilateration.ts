interface Point {
  lat: number;
  lng: number;
}

interface Circle {
  id: string;
  lat: number;
  lng: number;
  radius: number; // meters
  reliability?: number; // 0-100
}

// Earth constants
const R_EARTH = 6371000; // meters

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

/**
 * Projects a lat/lng to x/y meters relative to a reference point.
 * Uses Equirectangular projection (sufficient for local scale intersections).
 */
function project(p: Point, ref: Point): { x: number; y: number } {
  const x = toRad(p.lng - ref.lng) * R_EARTH * Math.cos(toRad(ref.lat));
  const y = toRad(p.lat - ref.lat) * R_EARTH;
  return { x, y };
}

/**
 * Unprojects x/y meters back to lat/lng relative to a reference point.
 */
function unproject(p: { x: number; y: number }, ref: Point): Point {
  const lat = ref.lat + toDeg(p.y / R_EARTH);
  const lng = ref.lng + toDeg(p.x / (R_EARTH * Math.cos(toRad(ref.lat))));
  return { lat, lng };
}

/**
 * Calculates intersection points of two circles.
 */
export function getCircleIntersections(c1: Circle, c2: Circle): Point[] {
  // Use c1 as reference for local projection
  const p1 = { x: 0, y: 0 };
  const p2 = project(c2, c1);
  
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  // Check for solvability
  if (d > c1.radius + c2.radius) return []; // Separate
  if (d < Math.abs(c1.radius - c2.radius)) return []; // Contained
  if (d === 0) return []; // Coincident

  const a = (c1.radius * c1.radius - c2.radius * c2.radius + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, c1.radius * c1.radius - a * a));

  const x2 = p1.x + (dx * a) / d;
  const y2 = p1.y + (dy * a) / d;

  const i1 = {
    x: x2 + (h * dy) / d,
    y: y2 - (h * dx) / d,
  };

  const i2 = {
    x: x2 - (h * dy) / d,
    y: y2 + (h * dx) / d,
  };

  return [unproject(i1, c1), unproject(i2, c1)];
}

/**
 * Finds the "Best Fit" point for 3+ circles using Weighted Trilateration.
 */
export function calculateTrilateration(circles: Circle[]): { point: Point; confidence: number; errorRadius: number } | null {
  if (circles.length < 3) return null;

  const intersections: Array<Point & { weight: number }> = [];

  // 1. Get all pairwise intersections
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      const c1 = circles[i];
      const c2 = circles[j];
      const points = getCircleIntersections(c1, c2);
      
      // Calculate combined weight for these intersections
      // Reliability defaults to 100 if undefined
      const w1 = (c1.reliability ?? 100) / 100;
      const w2 = (c2.reliability ?? 100) / 100;
      const combinedWeight = (w1 + w2) / 2;

      points.forEach(p => {
        intersections.push({ ...p, weight: combinedWeight });
      });
    }
  }

  if (intersections.length === 0) return null;

  // 2. Score points by "Geometric Consistency" (Distance to all perimeters)
  // Weighted by the reliability of the circles being checked against.
  const scoredPoints = intersections.map(p => {
    let weightedErrorSum = 0;
    let totalWeight = 0;

    circles.forEach(c => {
      const dist = distance(p, c);
      const error = Math.abs(dist - c.radius);
      const weight = (c.reliability ?? 100) / 100;
      
      // Squared error for least-squares approach
      weightedErrorSum += weight * (error * error);
      totalWeight += weight;
    });

    return { 
      point: p, 
      // Normalize error by total weight
      error: totalWeight > 0 ? weightedErrorSum / totalWeight : weightedErrorSum,
      weight: p.weight 
    };
  });

  // Sort by error (ascending)
  scoredPoints.sort((a, b) => a.error - b.error);

  // 3. Select Top Cluster
  // Take top 30% of points or at least top 3
  const candidateCount = Math.max(3, Math.ceil(intersections.length * 0.3));
  const bestCandidates = scoredPoints.slice(0, candidateCount);

  // 4. Calculate Weighted Centroid of Candidates
  // We use the intersection point's own derived weight (from its parent circles) 
  // AND its score (inverse of error) to weight the final position.
  let sumLat = 0, sumLng = 0, sumW = 0;

  bestCandidates.forEach(cand => {
    // Inverse error weight: closer points matter more. 
    // Add small epsilon to avoid divide by zero.
    const scoreWeight = 1 / (cand.error + 1); 
    const finalWeight = cand.weight * scoreWeight;

    sumLat += cand.point.lat * finalWeight;
    sumLng += cand.point.lng * finalWeight;
    sumW += finalWeight;
  });

  const avgLat = sumLat / sumW;
  const avgLng = sumLng / sumW;

  // 5. Calculate Metrics
  const bestPoint = { lat: avgLat, lng: avgLng };
  
  // RMSE (Root Mean Square Error) of the best point against all circle perimeters
  let totalSquaredError = 0;
  circles.forEach(c => {
    const d = distance(bestPoint, c);
    const err = d - c.radius;
    totalSquaredError += err * err;
  });
  const rmse = Math.sqrt(totalSquaredError / circles.length);

  // Confidence Heuristic
  // If RMSE is 0, Confidence 1. 
  // If RMSE is large (e.g. 500m), Confidence drops.
  // We scale it relative to map scale or fixed value? 
  // Let's use a decay function. 
  const confidence = 1 / (1 + (rmse / 50)); // 50m error = 0.5 confidence

  return { 
    point: bestPoint, 
    confidence,
    errorRadius: rmse // The "Uncertainty Region" radius
  };
}

export function distance(p1: Point, p2: Point): number {
  const R = 6371000;
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates a destination point given a start point, distance (meters), and bearing (degrees).
 */
export function computeDestinationPoint(start: Point, distance: number, bearing: number): Point {
  const R = 6371000; // Earth's radius in meters
  const δ = distance / R; // angular distance in radians
  const θ = toRad(bearing);
  const φ1 = toRad(start.lat);
  const λ1 = toRad(start.lng);

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) +
    Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );

  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
  );

  return {
    lat: toDeg(φ2),
    lng: toDeg(λ2)
  };
}