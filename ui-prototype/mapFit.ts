// Map framing math. Pure functions so mapFit.check.ts can run them under plain node.

type LatLng = { lat: number; lng: number };
export type Region = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };

const km = (a: LatLng, b: LatLng) => {
  const dy = (a.lat - b.lat) * 111;
  const dx = (a.lng - b.lng) * 111 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dx, dy);
};

const GAP = 3; // a jump to 3x the previous distance marks the outliers
const FLOOR_KM = 0.3; // distances under this count as "same spot", so tiny gaps don't cut

// The people to frame: as many as possible in as small an area as possible. Start from the most
// central person (least total distance to everyone), add people nearest-first, and stop at the first
// big jump in distance once at least half are in. Whoever is left out gets an edge marker.
// ponytail: O(n²) medoid, fine for a Bubble's few dozen people.
export function corePoints<T extends LatLng>(pts: T[]): T[] {
  if (pts.length <= 2) return pts;
  const center = pts.reduce((best, p) => (pts.reduce((s, q) => s + km(p, q), 0) < pts.reduce((s, q) => s + km(best, q), 0) ? p : best));
  const sorted = [...pts].sort((a, b) => km(center, a) - km(center, b));
  const half = Math.ceil(pts.length / 2);
  for (let i = half; i < sorted.length; i++) {
    if (km(center, sorted[i]) > GAP * Math.max(km(center, sorted[i - 1]), FLOOR_KM)) return sorted.slice(0, i);
  }
  return sorted;
}

// Screen position of a point, given the region shown between the insets.
export function toScreen(region: Region, size: { w: number; h: number }, inset: { top: number; bottom: number }, p: LatLng) {
  return {
    x: ((p.lng - (region.longitude - region.longitudeDelta / 2)) / region.longitudeDelta) * size.w,
    y: inset.top + ((region.latitude + region.latitudeDelta / 2 - p.lat) / region.latitudeDelta) * (size.h - inset.top - inset.bottom),
  };
}

// Where to draw the marker for an off-screen point: on the ray from the visible area's center toward
// the point, clamped to that area shrunk by `margin`. Returns null when the point is on screen.
// The visible area is the map view minus the top and bottom insets (search button, sheet); with
// mapPadding set, iOS reports the region of that area, not of the whole view.
// ponytail: flat projection and no map rotation; fine at city scale with north up.
export function edgeSpot(
  region: Region,
  size: { w: number; h: number },
  inset: { top: number; bottom: number },
  p: LatLng,
  margin = 28,
): { x: number; y: number; angle: number } | null {
  const top = inset.top;
  const bottom = size.h - inset.bottom;
  const { x, y } = toScreen(region, size, inset, p);
  if (x >= 0 && x <= size.w && y >= top && y <= bottom) return null;
  const cx = size.w / 2;
  const cy = (top + bottom) / 2;
  const dx = x - cx;
  const dy = y - cy;
  const hw = size.w / 2 - margin;
  const hh = (bottom - top) / 2 - margin;
  const t = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
  return { x: cx + dx * t, y: cy + dy * t, angle: Math.atan2(dy, dx) };
}
