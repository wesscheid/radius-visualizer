export interface ParsedLocation {
  lat: number;
  lng: number;
  name?: string;
}

/**
 * Parses various location strings into coordinates.
 * Supports:
 * 1. Standard decimal: "29.97791, -90.06554"
 * 2. Degree format: "29.97791° N, 90.06554° W"
 * 3. Geo URI: "geo:29.97794,-90.06549?z=15"
 * 4. OsmAnd/Map Links: "https://osmand.net/map?pin=29.97794,-90.06549#15/29.97794/-90.06549"
 * 5. Multi-line blobs containing any of the above
 */
export const parseLocationString = (input: string): ParsedLocation | null => {
  if (!input) return null;

  // Pre-process: if it's multi-line, we might want to scan line by line or the whole blob
  // The user's example:
  // My Position
  // Old Prieur Street 1907, New Orleans
  // Location: geo:29.97794,-90.06549?z=15
  // https://osmand.net/map?pin=29.97794,-90.06549#15/29.97794/-90.06549

  // 1. Try to find geo: lat,lng (common in OsmAnd shares)
  const geoMatch = input.match(/geo:(-?\d+\.\d+),(-?\d+\.\d+)/i);
  if (geoMatch) {
    return {
      lat: parseFloat(geoMatch[1]),
      lng: parseFloat(geoMatch[2])
    };
  }

  // 2. Try to find osmand/map pin/query params
  const pinMatch = input.match(/[?&]pin=(-?\d+\.\d+),(-?\d+\.\d+)/i);
  if (pinMatch) {
    return {
      lat: parseFloat(pinMatch[1]),
      lng: parseFloat(pinMatch[2])
    };
  }

  // 3. Try to find coordinates with degrees and N/S/E/W
  // Format: 29.97791° N, 90.06554° W
  // Handles various degree symbols and separators
  const degreeRegex = /(-?\d+(?:\.\d+)?)\s*[\u00B0\u00BA]?\s*([NS])\s*[,/]?\s*(-?\d+(?:\.\d+)?)\s*[\u00B0\u00BA]?\s*([EW])/i;
  const degreeMatch = input.match(degreeRegex);
  if (degreeMatch) {
    let lat = parseFloat(degreeMatch[1]);
    let lng = parseFloat(degreeMatch[3]);

    if (degreeMatch[2].toUpperCase() === 'S') lat = -lat;
    if (degreeMatch[4].toUpperCase() === 'W') lng = -lng;

    return { lat, lng };
  }

  // 4. Hemisphere first: "N 29.97791, W 90.06554"
  const hemiFirstRegex = /([NS])\s*(-?\d+(?:\.\d+)?)\s*[,/]?\s*([EW])\s*(-?\d+(?:\.\d+)?)/i;
  const hemiFirstMatch = input.match(hemiFirstRegex);
  if (hemiFirstMatch) {
    let lat = parseFloat(hemiFirstMatch[2]);
    let lng = parseFloat(hemiFirstMatch[4]);

    if (hemiFirstMatch[1].toUpperCase() === 'S') lat = -lat;
    if (hemiFirstMatch[3].toUpperCase() === 'W') lng = -lng;

    return { lat, lng };
  }

  // 5. Labeled coordinates: "lat: 29.97794, lng: -90.06549" or "latitude: ..., longitude: ..."
  const labeledRegex = /(?:lat(?:itude)?|y)[:\s]+(-?\d+(?:\.\d+)?)\s*[,;]?\s*(?:lng(?:itude)?|lon(?:gitude)?|x)[:\s]+(-?\d+(?:\.\d+)?)/i;
  const labeledMatch = input.match(labeledRegex);
  if (labeledMatch) {
    return {
      lat: parseFloat(labeledMatch[1]),
      lng: parseFloat(labeledMatch[2])
    };
  }

  // 5. Standard Decimal with possible Degree symbols: 29.97794, -90.06549
  // Also allows optional parentheses: (29.97794, -90.06549)
  const decimalRegex = /\(?\s*(-?\d+(?:\.\d+)?)\s*[\u00B0\u00BA]?\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*[\u00B0\u00BA]?\s*\)?/;
  const decimalMatch = input.match(decimalRegex);
  if (decimalMatch) {
    return {
      lat: parseFloat(decimalMatch[1]),
      lng: parseFloat(decimalMatch[2])
    };
  }

  // 5. If it looks like a Plus Code (has a '+' with alphanumeric around it)
  // We return null here to let the main search handle it via geocoding
  // unless we had a library to resolve it locally.
  if (input.includes('+') && /[A-Z0-9]{4,}\+[A-Z0-9]{2,}/i.test(input)) {
    return null; 
  }

  return null;
};
