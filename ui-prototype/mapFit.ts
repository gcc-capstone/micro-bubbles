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

// Nudge overlapping markers apart. Each marker is a circle (screen points); fixed ones (your dot,
// group counts, the focused person) never move. Pairs that overlap push each other apart along the
// line between them, a little per pass, until nothing overlaps or the passes run out. Returns each
// marker's offset from where it really is, capped at maxShift so nothing wanders from its spot.
// ponytail: O(n²) per pass, fine for the few dozen visible markers; a grid index if that grows.
export function spread(items: { x: number; y: number; r: number; fixed?: boolean }[], maxShift = 30, passes = 40) {
  const pos = items.map((it) => ({ x: it.x, y: it.y }));
  for (let k = 0; k < passes; k++) {
    let moved = false;
    for (let i = 0; i < items.length; i++)
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        if (a.fixed && b.fixed) continue;
        let dx = pos[j].x - pos[i].x;
        let dy = pos[j].y - pos[i].y;
        let d = Math.hypot(dx, dy);
        const need = a.r + b.r;
        if (d >= need) continue;
        if (d < 0.01) {
          // same spot: fan out in a stable direction per pair
          const ang = (i * 7 + j * 13) % 360 * (Math.PI / 180);
          [dx, dy, d] = [Math.cos(ang), Math.sin(ang), 1];
        }
        const push = (need - d) / 2 + 0.5;
        const ux = dx / d;
        const uy = dy / d;
        const wa = a.fixed ? 0 : b.fixed ? 2 : 1;
        const wb = b.fixed ? 0 : a.fixed ? 2 : 1;
        pos[i].x -= ux * push * wa;
        pos[i].y -= uy * push * wa;
        pos[j].x += ux * push * wb;
        pos[j].y += uy * push * wb;
        moved = true;
      }
    if (!moved) break;
  }
  return pos.map((p, i) => {
    const dx = p.x - items[i].x;
    const dy = p.y - items[i].y;
    const k = Math.min(1, maxShift / (Math.hypot(dx, dy) || 1));
    return { dx: dx * k, dy: dy * k };
  });
}

type Box = { x: number; y: number; w: number; h: number }; // centered box, screen points
const hit = (a: Box, b: Box) => Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;

// Text labels (hotspot names) don't move; like Apple Maps, one that collides with a marker or an
// earlier label is hidden instead. Returns which labels to show, in the order given (priority).
export function visibleLabels(labels: Box[], markers: Box[]) {
  const shown: Box[] = [];
  return labels.map((l) => {
    const ok = !markers.some((m) => hit(l, m)) && !shown.some((s) => hit(l, s));
    if (ok) shown.push(l);
    return ok;
  });
}
