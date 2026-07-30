import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { damp, scrollState } from '../lib/scroll'

/**
 * A soft warm light panel standing behind the flacon.
 *
 * This exists for one specific reason: `MeshTransmissionMaterial` refracts the
 * *scene*, not the environment map. Against a near-black backdrop there is
 * nothing behind the glass to bend, so the bottle renders as opaque black and
 * only its specular streaks survive. An environment Lightformer cannot fix that
 * — it only feeds reflections. So we put an actual emissive surface in the room.
 *
 * Additively blended and depth-write-free so it reads as haze rather than a card.
 */
export function GlowPanel() {
  const mesh = useRef<THREE.Mesh>(null!)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uIntensity: { value: 1 },
          uWarm: { value: new THREE.Color('#ffb257') },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          uniform float uIntensity;
          uniform vec3 uWarm;
          void main() {
            // Elliptical falloff, taller than wide, so it silhouettes the bottle.
            vec2 d = (vUv - vec2(0.5, 0.46)) * vec2(2.1, 1.35);
            float f = pow(max(0.0, 1.0 - length(d)), 2.8);
            gl_FragColor = vec4(uWarm * f * uIntensity, f);
          }
        `,
      }),
    [],
  )

  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    // Dims through the close-ups, where a bright card behind the cap would flare,
    // and lifts again for the wide finale.
    const p = scrollState.progress
    const goal = p < 0.22 ? 0.72 : p < 0.55 ? 0.34 : 0.6
    material.uniforms.uIntensity.value = damp(material.uniforms.uIntensity.value, goal, 2.5, dt)

    // Always faces the camera-ish plane; a fixed billboard is enough here since
    // the camera never travels behind the flacon.
    mesh.current.rotation.y = Math.sin(p * Math.PI) * 0.25
  })

  return (
    <mesh ref={mesh} position={[0, 0.1, -2.6]} renderOrder={-5}>
      <planeGeometry args={[4.2, 4.8]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
