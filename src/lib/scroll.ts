/**
 * Single mutable source of truth for scroll + pointer state.
 *
 * Read from `useFrame` — never from React state. Writing scroll progress into
 * component state would re-render the whole tree 60x/second; the 3D scene reads
 * these fields directly instead.
 */
export const scrollState = {
  /** Normalized document scroll, 0 → 1. */
  progress: 0,
  /** Instantaneous scroll velocity in px/frame, used for motion blur-ish cues. */
  velocity: 0,
}

export const pointerState = {
  /** Normalized pointer, -1 → 1 on both axes. */
  x: 0,
  y: 0,
  /** Accumulated horizontal drag, in radians. Drives the hero reveal. */
  dragX: 0,
  /** Smoothed drag, lerped toward `dragX` every frame. */
  dragEased: 0,
  dragging: false,
}

/** 0 → 1: how much of the shroud has dissolved. Driven by drag + time. */
export const revealState = {
  value: 0,
  /** Set once the user has actually grabbed the bottle. */
  engaged: false,
}

/** Frame-rate independent exponential damping. */
export function damp(current: number, goal: number, lambda: number, dt: number) {
  return current + (goal - current) * (1 - Math.exp(-lambda * dt))
}

/** Map `v` from [inMin,inMax] to [outMin,outMax], clamped. */
export function mapRange(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) {
  const t = Math.min(1, Math.max(0, (v - inMin) / (inMax - inMin)))
  return outMin + t * (outMax - outMin)
}
