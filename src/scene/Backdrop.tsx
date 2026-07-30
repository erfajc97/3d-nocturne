import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { BACKDROP_FRAG, BACKDROP_VERT } from '../lib/glsl'
import { damp, scrollState } from '../lib/scroll'

/**
 * Procedural smoke wall far behind the scene. It is unlit and depth-write-free,
 * so it costs one fullscreen fragment pass and nothing else.
 */
export function Backdrop() {
  const mesh = useRef<THREE.Mesh>(null!)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uWarm: { value: new THREE.Color('#2c1a08') },
          uCool: { value: new THREE.Color('#040406') },
        },
        vertexShader: BACKDROP_VERT,
        fragmentShader: BACKDROP_FRAG,
      }),
    [],
  )

  useEffect(() => () => material.dispose(), [material])

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uProgress.value = damp(
      material.uniforms.uProgress.value,
      scrollState.progress,
      4,
      Math.min(delta, 1 / 30),
    )
  })

  return (
    <mesh ref={mesh} position={[0, 0.4, -9]} renderOrder={-10} frustumCulled={false}>
      <planeGeometry args={[42, 26]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
