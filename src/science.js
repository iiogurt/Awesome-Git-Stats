/**
 * Statistics for the `lab` layout: the numbers a scientist would compute from an
 * account. All pure functions; empty input gives neutral results, never NaN.
 */

/** h-index: the largest h such that h repositories have at least h stars each. */
export function hIndex(stars) {
  const sorted = [...stars].sort((a, b) => b - a);
  let h = 0;
  while (h < sorted.length && sorted[h] >= h + 1) h += 1;
  return h;
}

/** Gini coefficient, 0 (all equal) to 1 (everything in one place). */
export function gini(values) {
  const sorted = values.filter((v) => v > 0).sort((a, b) => a - b);
  const n = sorted.length;
  const total = sorted.reduce((sum, v) => sum + v, 0);
  if (n < 2 || !total) return 0;
  const weighted = sorted.reduce((sum, v, i) => sum + (i + 1) * v, 0);
  return (2 * weighted) / (n * total) - (n + 1) / n;
}

/** Lorenz curve points [share of items, share of total], from (0, 0) to (1, 1). */
export function lorenz(values) {
  const sorted = values.filter((v) => v > 0).sort((a, b) => a - b);
  const total = sorted.reduce((sum, v) => sum + v, 0);
  const points = [[0, 0]];
  let running = 0;
  sorted.forEach((v, i) => {
    running += v;
    points.push([(i + 1) / sorted.length, running / total]);
  });
  return points;
}

/** Shannon entropy in bits of a distribution given as weights. */
export function entropy(weights) {
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
  if (!total) return 0;
  return -weights.reduce((sum, w) => {
    const p = w / total;
    return p > 0 ? sum + p * Math.log2(p) : sum;
  }, 0);
}

/** Mean and population standard deviation. */
export function moments(values) {
  if (!values.length) return { mean: 0, sd: 0 };
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return { mean, sd: Math.sqrt(variance) };
}

/** Ordinary least squares y = slope·x + intercept, with the coefficient of determination. */
export function linearFit(xs, ys) {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0, r2: 0 };
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  const slope = sxx ? sxy / sxx : 0;
  const r2 = sxx && syy ? (sxy * sxy) / (sxx * syy) : 0;
  return { slope, intercept: my - slope * mx, r2 };
}

/**
 * Amplitude spectrum of a daily series (mean removed), for frequencies 1/N … 1/2
 * cycles per day, and the dominant period in days. A plain DFT: N is about 365.
 */
export function spectrum(series) {
  const n = series.length;
  if (n < 4) return { amplitudes: [], period: null };
  const { mean } = moments(series);
  const amplitudes = [];
  for (let k = 1; k <= Math.floor(n / 2); k++) {
    let re = 0;
    let im = 0;
    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * k * t) / n;
      re += (series[t] - mean) * Math.cos(angle);
      im -= (series[t] - mean) * Math.sin(angle);
    }
    amplitudes.push(Math.hypot(re, im) / n);
  }
  const peak = amplitudes.reduce((best, a, i) => (a > amplitudes[best] ? i : best), 0);
  return { amplitudes, period: amplitudes[peak] > 0 ? n / (peak + 1) : null };
}

/**
 * Circular mean of weekday totals (Monday first): the direction the week leans to,
 * as a weekday index (fractional) and the mean resultant length R̄ (0 = even, 1 = one day).
 */
export function circularMean(totals) {
  const total = totals.reduce((sum, v) => sum + v, 0);
  if (!total) return { index: 0, length: 0 };
  let x = 0;
  let y = 0;
  totals.forEach((v, i) => {
    const angle = (2 * Math.PI * i) / totals.length;
    x += v * Math.cos(angle);
    y += v * Math.sin(angle);
  });
  const index = (Math.atan2(y, x) / (2 * Math.PI)) * totals.length;
  return {
    index: index < 0 ? index + totals.length : index,
    length: Math.hypot(x, y) / total,
  };
}

/**
 * Power law s ∝ r^−α fitted to stars by rank (log-log least squares) over the
 * repositories that have stars.
 */
export function zipf(stars) {
  const sorted = stars.filter((s) => s > 0).sort((a, b) => b - a);
  const xs = sorted.map((_, i) => Math.log10(i + 1));
  const ys = sorted.map((s) => Math.log10(s));
  const fit = linearFit(xs, ys);
  return { points: xs.map((x, i) => [x, ys[i]]), alpha: -fit.slope, fit };
}

/**
 * The calendar as one byte per week (Sunday first, bit i set when day i of the
 * week had contributions), as lowercase hex.
 */
export function weekBits(days) {
  if (!days.length) return '';
  const offset = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const bytes = [];
  days.forEach((day, i) => {
    const index = i + offset;
    const week = Math.floor(index / 7);
    bytes[week] = (bytes[week] ?? 0) | (day.count > 0 ? 1 << (index % 7) : 0);
  });
  return [...bytes].map((b) => (b ?? 0).toString(16).padStart(2, '0')).join('');
}

/**
 * A chemical-looking symbol for a language: "TypeScript" -> "Ts", "Python" -> "Py",
 * "C++" -> "C⁺", "C#" -> "C♯". `taken` avoids handing out the same symbol twice.
 */
export function elementSymbol(name, taken = new Set()) {
  const special = { 'C++': 'C⁺', 'C#': 'C♯', 'F#': 'F♯', 'Objective-C': 'Oc' };
  const candidates = [];
  if (special[name]) candidates.push(special[name]);
  const letters = name.replace(/[^A-Za-z]/g, '');
  const capitals = letters.match(/[A-Z]/g) ?? [];
  if (capitals.length >= 2) candidates.push(capitals[0] + capitals[1].toLowerCase());
  if (letters.length === 1) candidates.push(letters.toUpperCase());
  const first = (letters[0] ?? '?').toUpperCase();
  for (const ch of letters.slice(1).toLowerCase()) candidates.push(first + ch);
  candidates.push(first);
  const symbol = candidates.find((c) => !taken.has(c)) ?? `${first}${taken.size}`;
  taken.add(symbol);
  return symbol;
}
