export function pickCardIndex(count: number): number {
  if (count <= 0) {
    throw new Error(`pickCardIndex: count must be > 0, got ${count}`);
  }
  return Math.floor(Math.random() * count);
}

/** Distinct card indices, for spreads that deal without replacement. */
export function pickDistinct(count: number, n: number): number[] {
  if (count <= 0) {
    throw new Error(`pickDistinct: count must be > 0, got ${count}`);
  }
  if (n < 0 || n > count) {
    throw new Error(`pickDistinct: cannot pick ${n} of ${count}`);
  }
  const pool = Array.from({ length: count }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/** UTC date as YYYY-MM-DD, so every visitor shares one card of the day. */
export function todayUTC(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Deterministic card for a given YYYY-MM-DD date: same date always yields the
 * same card. FNV-1a rather than a seeded PRNG so the result is stable across
 * runtimes and across a rebuild.
 */
export function cardForDate(dateISO: string, count: number): number {
  if (count <= 0) {
    throw new Error(`cardForDate: count must be > 0, got ${count}`);
  }
  let h = 2166136261;
  for (let i = 0; i < dateISO.length; i++) {
    h ^= dateISO.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % count;
}
