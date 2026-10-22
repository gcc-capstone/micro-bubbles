// Run: node mapFit.check.ts
import assert from 'node:assert';
import { corePoints, edgeSpot, spread, visibleLabels } from './mapFit.ts';

// Five people in town, one across the state: the far one is left out.
const town = [0, 1, 2, 3, 4].map((i) => ({ lat: 41.15 + i * 0.002, lng: -80.08 }));
const far = { lat: 40.44, lng: -79.99 };
assert.deepStrictEqual(corePoints([...town, far]).length, 5);
// Evenly spread people all stay in.
assert.strictEqual(corePoints(town).length, 5);
// Never drops below half, even when everyone is far apart.
assert.ok(corePoints([{ lat: 0, lng: 0 }, { lat: 1, lng: 0 }, { lat: 10, lng: 0 }, { lat: 50, lng: 0 }]).length >= 2);

const region = { latitude: 0, longitude: 0, latitudeDelta: 1, longitudeDelta: 1 };
const size = { w: 400, h: 800 };
const inset = { top: 0, bottom: 0 };
assert.strictEqual(edgeSpot(region, size, inset, { lat: 0.1, lng: 0.1 }), null); // on screen
const east = edgeSpot(region, size, inset, { lat: 0, lng: 3 })!;
assert.strictEqual(Math.round(east.x), 372); // right edge minus margin
assert.strictEqual(Math.round(east.y), 400);
assert.strictEqual(east.angle, 0);
const north = edgeSpot(region, size, { top: 100, bottom: 300 }, { lat: 5, lng: 0 })!;
assert.strictEqual(Math.round(north.y), 128); // below the top inset
// Overlapping markers end up apart; fixed ones stay put; far ones don't move.
const pts = [{ x: 100, y: 100, r: 20 }, { x: 100, y: 100, r: 20 }, { x: 110, y: 100, r: 20, fixed: true }, { x: 400, y: 400, r: 20 }];
const off = spread(pts, 100); // room to fully separate
const at = pts.map((p, i) => ({ x: p.x + off[i].dx, y: p.y + off[i].dy }));
for (let i = 0; i < 3; i++)
  for (let j = i + 1; j < 3; j++) assert.ok(Math.hypot(at[i].x - at[j].x, at[i].y - at[j].y) >= 39, `pair ${i},${j} still overlaps`);
assert.deepStrictEqual(off[2], { dx: 0, dy: 0 });
assert.deepStrictEqual(off[3], { dx: 0, dy: 0 });
// Shifts are capped.
const far2 = spread([{ x: 0, y: 0, r: 100 }, { x: 0, y: 0, r: 100, fixed: true }], 30);
assert.ok(Math.hypot(far2[0].dx, far2[0].dy) <= 30.01);
// A label on a marker hides; the second of two overlapping labels hides; a clear one shows.
assert.deepStrictEqual(
  visibleLabels(
    [{ x: 0, y: 0, w: 80, h: 20 }, { x: 200, y: 0, w: 80, h: 20 }, { x: 220, y: 5, w: 80, h: 20 }, { x: 500, y: 0, w: 80, h: 20 }],
    [{ x: 10, y: 0, w: 40, h: 40 }],
  ),
  [false, true, false, true],
);
console.log('mapFit ok');
