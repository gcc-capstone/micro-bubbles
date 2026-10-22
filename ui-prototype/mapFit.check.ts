// Run: node mapFit.check.ts
import assert from 'node:assert';
import { corePoints, edgeSpot } from './mapFit.ts';

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
console.log('mapFit ok');
