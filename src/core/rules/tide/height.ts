/**
 * `heightAt` and `rateAt` — the continuous read of a discrete `TidePredictionSeries`.
 *
 * `heightAt` uses a shape-preserving monotone cubic (Fritsch–Carlson) rather than plain
 * linear interpolation. Linear interpolation visibly flattens the peaks near a published
 * high or low; a naive (non-monotone) cubic spline can overshoot past a published high or
 * below a published low, which would invent a water level NOAA never predicted. The
 * Fritsch–Carlson tangent construction guarantees the interpolant stays within the range
 * of its neighbouring samples on every segment.
 */
import type { Instant, Millis, Metres, MetresPerHour, Sourced } from "@/core/units";
import { metres, metresPerHour, sourced } from "@/core/units";
import type { TidePredictionSample, TidePredictionSeries } from "./source";
import { RATE_WINDOW } from "./constants";

/** Fritsch–Carlson tangents, one per sample, cached per `samples` array identity. */
const tangentCache = new WeakMap<readonly TidePredictionSample[], readonly number[]>();

function monotoneTangents(samples: readonly TidePredictionSample[]): readonly number[] {
  const cached = tangentCache.get(samples);
  if (cached) return cached;

  const n = samples.length;
  const m = new Array<number>(n).fill(0);

  if (n > 1) {
    const delta = new Array<number>(n - 1);
    for (let i = 0; i < n - 1; i++) {
      const dx = samples[i + 1].at - samples[i].at;
      const dy = samples[i + 1].height - samples[i].height;
      delta[i] = dy / dx;
    }

    m[0] = delta[0];
    m[n - 1] = delta[n - 2];
    for (let i = 1; i < n - 1; i++) {
      // Zero the tangent across a sign change (a local extremum) so the curve cannot
      // overshoot past it; average the neighbouring slopes otherwise.
      m[i] = delta[i - 1] * delta[i] <= 0 ? 0 : (delta[i - 1] + delta[i]) / 2;
    }

    for (let i = 0; i < n - 1; i++) {
      if (delta[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
        continue;
      }
      const alpha = m[i] / delta[i];
      const beta = m[i + 1] / delta[i];
      if (alpha < 0) m[i] = 0;
      if (beta < 0) m[i + 1] = 0;
      const magnitude = alpha * alpha + beta * beta;
      if (magnitude > 9) {
        const tau = 3 / Math.sqrt(magnitude);
        m[i] = tau * alpha * delta[i];
        m[i + 1] = tau * beta * delta[i];
      }
    }
  }

  tangentCache.set(samples, m);
  return m;
}

/** Binary search for the largest index `i` with `samples[i].at <= at`. Assumes ascending. */
function floorIndex(samples: readonly TidePredictionSample[], at: Instant): number {
  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (samples[mid].at <= at) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function hermite(
  s0: TidePredictionSample,
  s1: TidePredictionSample,
  m0: number,
  m1: number,
  at: Instant,
): number {
  const h = s1.at - s0.at;
  const t = (at - s0.at) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return h00 * s0.height + h10 * h * m0 + h01 * s1.height + h11 * h * m1;
}

export function heightAt(s: TidePredictionSeries, at: Instant): Sourced<Metres> | null {
  const samples = s.samples;
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (at < first.at || at > last.at) return null;

  const i = floorIndex(samples, at);
  const exact = samples[i];
  if (exact.at === at) {
    return sourced(metres(exact.height), "published", "NOAA published prediction sample.");
  }

  const s0 = samples[i];
  const s1 = samples[i + 1];
  const tangents = monotoneTangents(samples);
  const value = hermite(s0, s1, tangents[i], tangents[i + 1], at);
  return sourced(
    metres(value),
    "interpolated",
    "Interpolated between NOAA prediction samples with a shape-preserving monotone curve.",
  );
}

export function rateAt(
  s: TidePredictionSeries,
  at: Instant,
  w: Millis = RATE_WINDOW,
): Sourced<MetresPerHour> | null {
  const samples = s.samples;
  const first = samples[0].at;
  const last = samples[samples.length - 1].at;
  if (at < first || at > last) return null;

  const half = w / 2;
  const lowAt = Math.max(first, at - half) as Instant;
  const highAt = Math.min(last, at + half) as Instant;
  if (lowAt === highAt) {
    // At the very edge of the loaded series there is no room for a window at all.
    return sourced(
      metresPerHour(0),
      "interpolated",
      "At the edge of the loaded prediction window; no room for a rate window, treated as flat.",
    );
  }

  const lowHeight = heightAt(s, lowAt);
  const highHeight = heightAt(s, highAt);
  if (lowHeight === null || highHeight === null) return null;

  const durationHours = (highAt - lowAt) / 3_600_000;
  const rate = (highHeight.value - lowHeight.value) / durationHours;
  const clamped = highAt - lowAt < w ? " (window clamped to the loaded prediction range)" : "";
  return sourced(
    metresPerHour(rate),
    "interpolated",
    `Centred finite difference over the monotone height curve${clamped}.`,
  );
}
