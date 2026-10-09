// Run: node calendarMath.check.ts
import assert from 'node:assert';
import { addMonths, dayNum, isoOf, leadBlanks, offsets, parts, startOfWeek, weekRows } from './calendarMath.ts';

const fri = dayNum('2026-10-02'); // a Friday
assert.strictEqual(isoOf(fri), '2026-10-02');
assert.strictEqual(parts(fri).dow, 5);
assert.strictEqual(isoOf(startOfWeek(fri, 0)), '2026-09-27'); // Sunday start
assert.strictEqual(isoOf(startOfWeek(fri, 1)), '2026-09-28'); // Monday start
assert.strictEqual(isoOf(startOfWeek(dayNum('2026-09-27'), 1)), '2026-09-21'); // Sunday belongs to previous Mon-week
assert.strictEqual(leadBlanks(2026, 9, 0), 4); // Oct 1 2026 is Thursday
assert.strictEqual(leadBlanks(2026, 9, 1), 3);
assert.strictEqual(weekRows(2026, 9, 0), 5);
assert.strictEqual(weekRows(2026, 1, 0), 4); // Feb 2026 starts Sunday, 28 days
assert.deepStrictEqual(addMonths(2026, 9, 3), { y: 2027, m: 0 });
assert.deepStrictEqual(addMonths(2026, 0, -1), { y: 2025, m: 11 });
assert.deepStrictEqual(offsets([10, 20, 5]), [0, 10, 30, 35]);
assert.strictEqual(isoOf(dayNum('2024-03-10') + 1), '2024-03-11'); // no DST drift
console.log('calendarMath ok');
