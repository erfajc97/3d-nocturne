/** Shared GLSL: cheap hash-based value noise + fbm. No texture lookups. */
export const NOISE = /* glsl */ `
  float hash31(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i + vec3(0,0,0)), hash31(i + vec3(1,0,0)), f.x),
          mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
          mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += amp * vnoise(p);
      p *= 2.02;
      amp *= 0.5;
    }
    return sum;
  }
`

/* ------------------------------------------------------------------ shroud */

/**
 * The veil draped over the flacon. Dissolves from the bottom up as `uReveal`
 * climbs 0 → 1, with a hot ember edge riding the dissolve front.
 */
export const SHROUD_VERT = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uReveal;

  ${NOISE}

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    // Slack cloth. The base mesh is a solid of revolution, so without generous
    // non-axisymmetric displacement it just reads as a second bottle. Three
    // octave bands: broad drape, folds, then weave-scale wrinkles.
    vec3 p = position;
    float drape = fbm(position * 1.05 + vec3(0.0, uTime * 0.06, 0.0)) - 0.5;
    float folds = fbm(position * 3.4 + vec3(7.1, uTime * 0.04, 2.3)) - 0.5;
    float wrinkle = fbm(position * 11.0 + vec3(uTime * 0.05)) - 0.5;
    p += normal * (drape * 0.26 + folds * 0.10 + wrinkle * 0.022);

    // Gravity: the drape sags and the hem flares outward where it meets the floor.
    float hem = smoothstep(-0.35, -1.05, position.y);
    p.xz *= 1.0 + hem * 0.16;
    p.y -= (1.0 - hem) * 0.04;

    // As it dissolves the cloth also lifts and drifts away from the glass.
    p += normal * uReveal * 0.10;
    p.y += uReveal * uReveal * 0.35;

    vPos = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

export const SHROUD_FRAG = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uReveal;
  uniform vec3 uColor;
  uniform vec3 uEdge;

  ${NOISE}

  void main() {
    // Dissolve mask. Biased by height so the veil peels upward off the base.
    float n = fbm(vPos * 3.1 + vec3(0.0, uTime * 0.03, 0.0));
    float height = smoothstep(-1.25, 1.15, vPos.y);
    float mask = n * 0.62 + (1.0 - height) * 0.38;

    float front = uReveal * 1.25;
    if (mask < front - 0.06) discard;

    // Fake two-sided cloth lighting — no real light needed, keeps it cheap.
    vec3 nrm = normalize(vNormal);
    vec3 keyDir = normalize(vec3(-0.55, 0.75, 0.4));
    float key = max(dot(nrm, keyDir), 0.0);
    float rim = pow(1.0 - abs(dot(nrm, vec3(0.0, 0.0, 1.0))), 2.4);

    vec3 col = uColor * (0.10 + pow(key, 1.6) * 1.35) + vec3(0.34, 0.33, 0.38) * rim * 0.42;

    // Fine weave so it does not read as plastic.
    col *= 0.82 + 0.36 * vnoise(vPos * 210.0);

    // Ember front: the band about to burn away glows.
    float edge = smoothstep(front + 0.10, front - 0.06, mask);
    col = mix(col, uEdge * 2.6, edge * 0.9);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

/* ---------------------------------------------------------------- backdrop */

/** Slow-drifting warm nebula behind everything. Pure math, no textures. */
export const BACKDROP_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const BACKDROP_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uWarm;
  uniform vec3 uCool;

  ${NOISE}

  void main() {
    vec2 uv = vUv;
    vec2 c = uv - 0.5;

    // Two counter-drifting noise fields read as slow smoke.
    // Both octaves stay low-frequency on purpose: the flacon refracts this wall,
    // and fine detail magnified through curved glass aliases into visible rings.
    float a = fbm(vec3(uv * 1.9, uTime * 0.035));
    float b = fbm(vec3(uv * 2.9 + 11.3, uTime * -0.021));
    // High exponent: the smoke stays near black and only the densest wisps lift,
    // so display type over the top keeps its contrast.
    float smoke = pow(clamp(a * 0.72 + b * 0.42, 0.0, 1.0), 4.2);

    // A tight warm pool that migrates across the frame with scroll. Kept small
    // and off-centre so it pools behind the flacon, not behind the copy.
    vec2 pool = vec2(0.62 + sin(uProgress * 3.14159) * 0.16, 0.46 + uProgress * 0.1);
    float glow = 1.0 - smoothstep(0.0, 0.40, distance(uv, pool));

    vec3 col = mix(uCool, uWarm, smoke * 0.55);
    col += uWarm * pow(glow, 2.6) * 0.42;

    // Heavy vignette keeps the flacon the brightest thing on screen.
    float vig = 1.0 - smoothstep(0.10, 0.72, length(c * vec2(1.15, 1.35)));
    col *= 0.02 + vig * 0.75;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

/* ------------------------------------------------------------------- motes */

/** Gold dust. Additive points, animated entirely on the GPU. */
export const MOTES_VERT = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;

  varying float vAlpha;
  varying float vSeed;

  uniform float uTime;
  uniform float uBurst;
  uniform float uPixelRatio;

  void main() {
    vSeed = aSeed;

    vec3 p = position;
    float t = uTime * 0.11 + aSeed * 6.2831;

    // Lazy convection: each mote traces its own slow lissajous.
    p.x += sin(t * 1.7 + aSeed * 3.1) * 0.22;
    p.y += cos(t * 1.2 + aSeed * 5.7) * 0.30 + mod(uTime * 0.02 + aSeed, 1.0) * 0.4;
    p.z += sin(t * 1.4 + aSeed * 1.9) * 0.22;

    // On reveal the dust is thrown outward from the flacon.
    p += normalize(p + vec3(0.001)) * uBurst * (0.5 + aSeed * 1.6);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float dist = -mv.z;
    gl_PointSize = aSize * uPixelRatio * (7.0 / max(dist, 0.35));

    // Fade the far field so the volume has depth.
    vAlpha = smoothstep(11.0, 1.4, dist) * (0.35 + 0.65 * abs(sin(t * 2.3)));
  }
`

export const MOTES_FRAG = /* glsl */ `
  varying float vAlpha;
  varying float vSeed;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  void main() {
    // Round, soft-edged sprite.
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float falloff = pow(1.0 - d * 2.0, 2.2);

    vec3 col = mix(uColorA, uColorB, vSeed);
    gl_FragColor = vec4(col, falloff * vAlpha);
  }
`
