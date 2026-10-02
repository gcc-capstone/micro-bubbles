// Greedy screen-space grouping: markers closer than `px` pixels merge into one group.
// ponytail: O(n²) and order-dependent; fine for a Bubble's few dozen markers.
export function groupNearby<T>(items: T[], toPx: (t: T) => { x: number; y: number }, px = 48): T[][] {
  const groups: { x: number; y: number; items: T[] }[] = [];
  for (const it of items) {
    const p = toPx(it);
    const g = groups.find((c) => Math.hypot(c.x - p.x, c.y - p.y) < px);
    if (g) g.items.push(it);
    else groups.push({ ...p, items: [it] });
  }
  return groups.map((g) => g.items);
}
