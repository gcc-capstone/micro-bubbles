// Run: node cluster.check.ts
import assert from 'node:assert';
import { groupNearby } from './cluster.ts';

const pts = [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 200, y: 0 }, { x: 205, y: 3 }, { x: 500, y: 500 }];
const groups = groupNearby(pts, (p) => p, 48);
assert.deepStrictEqual(groups.map((g) => g.length), [2, 2, 1]);
assert.strictEqual(groupNearby([], (p: { x: number; y: number }) => p).length, 0);
console.log('cluster ok');
