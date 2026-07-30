import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mapRange, scrollState } from '../lib/scroll'

export type Note = {
  label: string
  color: string
  attenuation: string
  radius: number
  height: number
  speed: number
  phase: number
}

/** The three accords. Kept in one place so the overlay copy can reuse it. */
export const NOTES: Note[] = [
  { label: 'Oud ahumado', color: '#3a1f0a', attenuation: '#b4550f', radius: 1.55, height: 0.55, speed: 0.32, phase: 0 },
  { label: 'Resina de ámbar', color: '#5a3a10', attenuation: '#e0a23a', radius: 1.9, height: -0.1, speed: -0.24, phase: 2.1 },
  { label: 'Iris frío', color: '#22262e', attenuation: '#8ba4c4', radius: 1.35, height: -0.62, speed: 0.41, phase: 4.2 },
]

/**
 * Three glass beads orbiting the flacon, one per accord. They only exist during
 * the notes section — outside it they scale to zero and stop costing anything
 * meaningful.
 */
export function NoteOrbs() {
  const group = useRef<THREE.Group>(null!)

  useFrame((state) => {
    const p = scrollState.progress
    // Ramp in over the notes section, ramp out before the craft section.
    const presence =
      mapRange(p, 0.3, 0.42, 0, 1) * (1 - mapRange(p, 0.58, 0.68, 0, 1))
    const t = state.clock.elapsedTime

    group.current.children.forEach((child, i) => {
      const note = NOTES[i]
      const a = t * note.speed + note.phase
      child.position.set(
        Math.cos(a) * note.radius,
        note.height + Math.sin(t * 0.6 + note.phase) * 0.07,
        Math.sin(a) * note.radius,
      )
      const s = presence * (0.85 + Math.sin(t * 1.3 + note.phase) * 0.15)
      child.scale.setScalar(s)
      child.visible = s > 0.01
    })
  })

  return (
    <group ref={group}>
      {NOTES.map((note) => (
        <mesh key={note.label} scale={0}>
          <icosahedronGeometry args={[0.15, 4]} />
          <meshPhysicalMaterial
            color={note.color}
            transmission={0.95}
            thickness={0.9}
            roughness={0.06}
            ior={1.6}
            attenuationColor={note.attenuation}
            attenuationDistance={0.3}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * The sweeping arc from the reference boards — a dashed ring that rotates around
 * the flacon and tightens as you scroll. Instanced so 64 dashes cost one call.
 */
export function OrbitArc() {
  const inst = useRef<THREE.InstancedMesh>(null!)
  const dummy = useRef(new THREE.Object3D())
  const COUNT = 72

  useFrame((state) => {
    const p = scrollState.progress
    const t = state.clock.elapsedTime
    const presence = mapRange(p, 0.06, 0.2, 0, 1) * (1 - mapRange(p, 0.82, 0.96, 0, 1))
    const radius = 2.1 - p * 0.5

    for (let i = 0; i < COUNT; i++) {
      const frac = i / COUNT
      const a = frac * Math.PI * 2 + t * 0.16
      // Only ~55% of the ring is drawn, and the gap travels — reads as a sweep.
      const inArc = Math.sin(frac * Math.PI * 2 - t * 0.5) > -0.35 ? 1 : 0

      dummy.current.position.set(Math.cos(a) * radius, -0.15 + Math.sin(a * 2) * 0.35, Math.sin(a) * radius)
      dummy.current.rotation.set(0, -a, Math.PI / 2)
      dummy.current.scale.setScalar(inArc * presence * (0.6 + 0.4 * Math.sin(frac * 12 + t * 2)))
      dummy.current.updateMatrix()
      inst.current.setMatrixAt(i, dummy.current.matrix)
    }
    inst.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={inst} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <boxGeometry args={[0.008, 0.09, 0.008]} />
      <meshBasicMaterial color="#f5dfae" toneMapped={false} transparent opacity={0.85} />
    </instancedMesh>
  )
}
