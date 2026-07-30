import * as THREE from 'three'

/**
 * Silhouette of the flacon, traced bottom → top as (radius, height) pairs and
 * revolved into a solid of revolution. Both ends land on x = 0 so the lathe
 * closes into a watertight volume — open shells refract as glowing holes under
 * MeshTransmissionMaterial.
 */
const BODY_PROFILE: [number, number][] = [
  [0.0, -1.0],
  [0.56, -1.0],
  [0.655, -0.962],
  [0.69, -0.9],
  [0.69, 0.08],
  [0.673, 0.2],
  [0.6, 0.34],
  [0.44, 0.45],
  [0.27, 0.515],
  [0.205, 0.565],
  [0.198, 0.745],
  [0.0, 0.772],
]

/** The juice inside: same taper, inset, filled to ~62%. */
const LIQUID_PROFILE: [number, number][] = [
  [0.0, -0.955],
  [0.52, -0.955],
  [0.61, -0.9],
  [0.643, -0.11],
  [0.0, -0.1],
]

/**
 * Resamples a hand-authored profile along a spline before revolving it.
 *
 * A raw polyline profile gives the lathe a faceted silhouette, and facets on a
 * refractive surface are far more visible than on an opaque one — the shoulder
 * broke into concentric interference arcs. Subdividing to ~4x the control points
 * makes the normals continuous and the refraction smooth.
 */
function smoothProfile(profile: [number, number][], divisions: number) {
  const curve = new THREE.SplineCurve(profile.map(([x, y]) => new THREE.Vector2(x, y)))
  return curve.getPoints(divisions).map((p) => {
    // Catmull-Rom can overshoot past the axis at the tight base bevel, which
    // would fold the surface inside out.
    p.x = Math.max(0, p.x)
    return p
  })
}

function lathe(profile: [number, number][], segments: number, divisions: number) {
  const geo = new THREE.LatheGeometry(smoothProfile(profile, divisions), segments)
  geo.computeVertexNormals()
  return geo
}

export function makeBodyGeometry(segments = 96) {
  return lathe(BODY_PROFILE, segments, 72)
}

export function makeLiquidGeometry(segments = 64) {
  return lathe(LIQUID_PROFILE, segments, 40)
}

/**
 * The veil. A coarser, slightly inflated copy of the body — the shroud shader
 * displaces it further, so it only needs enough vertices to look like cloth,
 * not enough to look like glass.
 */
export function makeShroudGeometry(segments = 128) {
  const inflated = BODY_PROFILE.map(([x, y]) => {
    const t = (y + 1) / 1.815
    return [x * (1.14 + t * 0.08), y * 1.03 + 0.02] as [number, number]
  })
  // Extend the hem past the base so it puddles on the floor.
  inflated.unshift([0.0, -1.06])
  inflated.splice(1, 0, [0.82, -1.06])
  return lathe(inflated, segments, 56)
}
