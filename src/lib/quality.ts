/**
 * Device capability tiers. Transmission materials and the reflective floor each
 * cost a full extra render pass, so on weak GPUs we drop them rather than ship
 * a 20fps hero.
 */
export type Tier = 'low' | 'mid' | 'high'

function detect(): Tier {
  if (typeof window === 'undefined') return 'mid'

  // `?q=low|mid|high` forces a tier. Needed for automated screenshots, which run
  // on a software rasterizer that cannot survive the high-tier passes.
  const forced = new URLSearchParams(window.location.search).get('q')
  if (forced === 'low' || forced === 'mid' || forced === 'high') return forced

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 900
  const cores = navigator.hardwareConcurrency ?? 4
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8

  if (coarse || narrow || cores <= 4 || memory <= 4) return 'low'
  if (cores <= 8) return 'mid'
  return 'high'
}

export const tier = detect()

export const quality = {
  tier,
  /** MeshTransmissionMaterial render samples. */
  transmissionSamples: tier === 'high' ? 10 : tier === 'mid' ? 6 : 4,
  /**
   * MeshTransmissionMaterial FBO resolution. Do not drop below 512 — the flacon's
   * curved shoulder starts showing interference rings from the downscaled buffer.
   */
  transmissionRes: tier === 'high' ? 1024 : 512,
  /** Reflective floor is the single most expensive effect — high tier only. */
  reflectiveFloor: tier === 'high',
  /** Depth of field needs a depth pass; skip it on low. */
  depthOfField: tier !== 'low',
  moteCount: tier === 'high' ? 1400 : tier === 'mid' ? 800 : 400,
  dpr: (tier === 'low' ? [1, 1.5] : [1, 2]) as [number, number],
  shadows: tier === 'high',
}

/**
 * `?reveal=1` starts with the veil already gone. Automated screenshots run at a
 * few frames per second, and the veil's timer advances in clamped frame deltas,
 * so it would otherwise still be covering the flacon in every capture.
 */
export const forceRevealed =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('reveal') === '1'

export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
