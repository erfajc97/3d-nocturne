import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { makeShroudGeometry } from './flaconGeometry'
import { damp, pointerState, revealState } from '../lib/scroll'
import { forceRevealed, prefersReducedMotion } from '../lib/quality'
import { SHROUD_FRAG, SHROUD_VERT } from '../lib/glsl'

/**
 * The veil over the flacon. Drag horizontally to pull it off; it also gives up
 * on its own after a few seconds so the page never looks stuck. Once fully
 * dissolved the mesh unmounts, handing its draw call back.
 */
export function Shroud() {
  const mesh = useRef<THREE.Mesh>(null!)
  const gone = useRef(forceRevealed)
  const auto = useRef(0)

  const geometry = useMemo(() => makeShroudGeometry(), [])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        transparent: false,
        uniforms: {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uColor: { value: new THREE.Color('#14141a') },
          uEdge: { value: new THREE.Color('#e8b45c') },
        },
        vertexShader: SHROUD_VERT,
        fragmentShader: SHROUD_FRAG,
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

  useFrame((state, delta) => {
    if (gone.current) return
    const dt = Math.min(delta, 1 / 30)

    // Drag is the intended interaction; the timer is the safety net.
    const fromDrag = Math.min(1, Math.abs(pointerState.dragX) / 2.2)
    auto.current += dt
    const grace = prefersReducedMotion ? 0.6 : 3.4
    const fromTime = Math.max(0, (auto.current - grace) / 2.6)

    const goal = Math.min(1, Math.max(fromDrag, fromTime))
    revealState.value = damp(revealState.value, goal, 2.6, dt)
    if (fromDrag > 0.02) revealState.engaged = true

    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uReveal.value = revealState.value

    if (revealState.value > 0.995) {
      revealState.value = 1
      gone.current = true
      mesh.current.visible = false
    }
  })

  if (forceRevealed) {
    revealState.value = 1
    return null
  }

  return (
    <mesh ref={mesh} geometry={geometry} renderOrder={5}>
      <primitive object={material} attach="material" />
    </mesh>
  )
}
