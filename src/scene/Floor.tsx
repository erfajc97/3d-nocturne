import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { MeshReflectorMaterial } from '@react-three/drei'
import { quality } from '../lib/quality'

/**
 * Wet-stone floor. The reflector runs a second scene render, so below the high
 * tier we fall back to a plain rough surface — same silhouette, a third of the
 * cost.
 */
export function Floor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.06, 0]} receiveShadow>
        <planeGeometry args={[34, 34]} />
        {quality.reflectiveFloor ? (
          <MeshReflectorMaterial
            resolution={512}
            mirror={0.42}
            mixBlur={3.2}
            mixStrength={14}
            blur={[480, 140]}
            depthScale={1.4}
            minDepthThreshold={0.3}
            maxDepthThreshold={1.2}
            roughness={0.95}
            metalness={0.45}
            color="#030305"
          />
        ) : (
          <meshStandardMaterial color="#020204" roughness={0.74} metalness={0.42} />
        )}
      </mesh>

      <ContactShadow />
    </>
  )
}

/**
 * Fake contact shadow: one alpha-blended disc with a radial falloff, sitting a
 * hair above the floor. Real shadow maps are high-tier only, and without any
 * grounding the flacon looks like it is hovering. This costs one tiny draw call
 * and works on every tier.
 */
function ContactShadow() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uOpacity: { value: 0.82 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          uniform float uOpacity;
          void main() {
            float d = length(vUv - 0.5) * 2.0;
            // Two stacked falloffs: a tight dark core under the base, and a wide
            // soft ambient occlusion halo around it.
            float core = pow(max(0.0, 1.0 - d / 0.62), 2.6);
            float halo = pow(max(0.0, 1.0 - d), 1.5);
            gl_FragColor = vec4(0.0, 0.0, 0.0, (core * 0.85 + halo * 0.35) * uOpacity);
          }
        `,
      }),
    [],
  )

  useEffect(() => () => material.dispose(), [material])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.052, 0]} renderOrder={0}>
      <planeGeometry args={[3.4, 3.4]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
