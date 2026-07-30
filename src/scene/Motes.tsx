import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { MOTES_FRAG, MOTES_VERT } from '../lib/glsl'
import { quality } from '../lib/quality'
import { revealState, scrollState } from '../lib/scroll'

/** Deterministic PRNG so the dust field is identical on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Suspended gold dust. One draw call of additive points, all motion in the
 * vertex shader — the CPU only pushes two uniforms per frame.
 */
export function Motes() {
  const points = useRef<THREE.Points>(null!)
  const dpr = useThree((s) => s.viewport.dpr)
  const count = quality.moteCount

  const geometry = useMemo(() => {
    const rand = mulberry32(0x5eed)
    const position = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    const size = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Cylindrical shell around the flacon — denser near it, sparse far out.
      const angle = rand() * Math.PI * 2
      const radius = 0.7 + Math.pow(rand(), 0.65) * 4.4
      position[i * 3 + 0] = Math.cos(angle) * radius
      position[i * 3 + 1] = -1.4 + rand() * 4.2
      position[i * 3 + 2] = Math.sin(angle) * radius - rand() * 1.5

      seed[i] = rand()
      size[i] = 0.7 + Math.pow(rand(), 2.4) * 2.9
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(position, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    return geo
  }, [count])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uBurst: { value: 0 },
          uPixelRatio: { value: 1 },
          uColorA: { value: new THREE.Color('#e8c37a') },
          uColorB: { value: new THREE.Color('#fff3d6') },
        },
        vertexShader: MOTES_VERT,
        fragmentShader: MOTES_FRAG,
      }),
    [],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uPixelRatio.value = dpr
    // The veil dissolving throws the dust outward; scroll keeps pushing it out.
    material.uniforms.uBurst.value = revealState.value * 0.55 + scrollState.progress * 0.9
    points.current.rotation.y = state.clock.elapsedTime * 0.012
  })

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <primitive object={material} attach="material" />
    </points>
  )
}
