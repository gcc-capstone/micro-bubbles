// Date math for the calendar's long virtual lists. Days are whole numbers (days since 1970-01-01,
// UTC) so there are no time-zone or daylight-saving surprises.

export const dayNum = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 864e5);
};
export const isoOf = (n: number) => new Date(n * 864e5).toISOString().slice(0, 10);
export const parts = (n: number) => {
  const d = new Date(n * 864e5);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), dow: d.getUTCDay() };
};
export const monthStart = (y: number, m: number) => Math.round(Date.UTC(y, m, 1) / 864e5);
export const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

// weekStart: 0 = Sunday, 1 = Monday.
export const startOfWeek = (n: number, weekStart: number) => n - ((parts(n).dow - weekStart + 7) % 7);
// Blank cells before day 1 in a month grid, and how many week rows the month needs.
export const leadBlanks = (y: number, m: number, weekStart: number) => (parts(monthStart(y, m)).dow - weekStart + 7) % 7;
export const weekRows = (y: number, m: number, weekStart: number) => Math.ceil((leadBlanks(y, m, weekStart) + daysIn(y, m)) / 7);

// Month i steps away from a base month (negative = earlier).
export const addMonths = (y: number, m: number, i: number) => {
  const t = y * 12 + m + i;
  return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
};

// Prefix sums of item heights, for FlatList getItemLayout with variable-height rows.
export const offsets = (heights: number[]) => {
  const out = new Array<number>(heights.length + 1);
  out[0] = 0;
  for (let i = 0; i < heights.length; i++) out[i + 1] = out[i] + heights[i];
  return out;
};
