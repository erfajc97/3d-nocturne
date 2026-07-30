import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import { makeBodyGeometry, makeLiquidGeometry } from './flaconGeometry'
import { quality } from '../lib/quality'
import { damp, mapRange, pointerState, scrollState } from '../lib/scroll'
import { Shroud } from './Shroud'

const GOLD = '#c9a349'
const GOLD_DARK = '#8a6c2c'

/**
 * The hero object: a solid glass flacon with amber juice, a machined gold cap,
 * and a dissolving veil. Everything is procedural — no GLB, no texture fetches.
 */
export function Flacon() {
  const group = useRef<THREE.Group>(null!)
  const spin = useRef(0)

  const bodyGeo = useMemo(() => makeBodyGeometry(quality.tier === 'low' ? 64 : 112), [])
  const liquidGeo = useMemo(() => makeLiquidGeometry(quality.tier === 'low' ? 48 : 72), [])

  // Lathe geometries are imperative, so R3F never attaches them — dispose by hand.
  useEffect(
    () => () => {
      bodyGeo.dispose()
      liquidGeo.dispose()
    },
    [bodyGeo, liquidGeo],
  )

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const p = scrollState.progress

    pointerState.dragEased = damp(pointerState.dragEased, pointerState.dragX, 5, dt)

    // Idle drift, plus a full turn earned across the scroll, plus user drag.
    const idle = pointerState.dragging ? 0 : state.clock.elapsedTime * 0.075
    spin.current = idle + p * Math.PI * 1.6 + pointerState.dragEased

    group.current.rotation.y = spin.current
    // Tilts into a three-quarter pose through the craft section, then settles.
    group.current.rotation.z = mapRange(p, 0.55, 0.78, 0, -0.16) * (1 - mapRange(p, 0.86, 1, 0, 1))
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.012

    // Breathing hover.
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.018
  })

  return (
    <group ref={group}>
      {/* ---------------------------------------------------------- glass */}
      <mesh geometry={bodyGeo} castShadow={quality.shadows} renderOrder={2}>
        <MeshTransmissionMaterial
          samples={quality.transmissionSamples}
          resolution={quality.transmissionRes}
          transmission={1}
          /*
            Thin and barely attenuating on purpose. Against a near-black backdrop
            a thick, strongly attenuating glass has nothing to transmit and reads
            as black lacquer — the specular streaks end up doing all the work.
          */
          /*
            Thickness and IOR are both deliberately mild. The shoulder is the
            tightest curve on the body, so it magnifies whatever the transmission
            buffer holds behind it; at glass-accurate values that magnification
            aliased the backdrop's fine noise into a fan of arcs. Roughness adds a
            final touch of blur to the tap.
          */
          thickness={0.24}
          roughness={0.055}
          ior={1.28}
          /* All four kept low. The transmission buffer is a downscaled render, so
             aggressive dispersion and distortion turn the curved shoulder into
             visible moiré rings rather than into refraction. */
          chromaticAberration={0.07}
          /* Zero, not small. Anisotropic blur walks a ring of taps around each
             fragment; with a handful of samples that ring shows up as concentric
             interference arcs across the shoulder. */
          anisotropicBlur={0}
          distortion={0}
          distortionScale={0}
          temporalDistortion={0}
          /* Single-pass. The body is a closed solid, and the backside pass was
             darkening the whole interior instead of adding depth to it. */
          backside={false}
          attenuationDistance={6}
          attenuationColor="#f6e6c2"
          color="#ffffff"
          clearcoat={0.4}
          clearcoatRoughness={0.16}
        />
      </mesh>

      {/* ---------------------------------------------------------- juice */}
      <mesh geometry={liquidGeo} renderOrder={1}>
        {/*
          Opaque, not transmissive. A see-through juice inside see-through glass
          against a black room adds up to nothing visible — the fill has to be a
          solid body for the flacon to read as "full". Self-lit so it stays amber
          even when the room is at its darkest.
        */}
        <meshPhysicalMaterial
          color="#a8560c"
          roughness={0.24}
          ior={1.4}
          clearcoat={1}
          clearcoatRoughness={0.12}
          emissive="#662f04"
          emissiveIntensity={0.42}
          metalness={0}
        />
      </mesh>

      {/*
        Two lights that live inside the glass. The warm one makes the juice read
        as a lit volume; the cool one picks out the far wall of the bottle so the
        silhouette does not collapse into a black mass.
      */}
      <pointLight position={[0, -0.5, 0]} intensity={1.5} distance={2.2} color="#ff9b33" />
      <pointLight position={[0, 0.45, -0.2]} intensity={0.55} distance={1.6} color="#cfe0ff" />

      {/* -------------------------------------------------- gold hardware */}
      <Cap />
      <Collar />

      {/* Engraved band around the body. */}
      <mesh position={[0, -0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.628, 0.011, 8, 72]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.24} />
      </mesh>

      <Shroud />
    </group>
  )
}

function Cap() {
  return (
    <group position={[0, 1.02, 0]}>
      {/* Main body of the cap. */}
      <mesh castShadow={quality.shadows}>
        <cylinderGeometry args={[0.268, 0.258, 0.34, 64]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.28} />
      </mesh>

      {/* Brushed top inlay, deliberately darker so the silhouette reads. */}
      <mesh position={[0, 0.172, 0]}>
        <cylinderGeometry args={[0.216, 0.216, 0.014, 64]} />
        <meshStandardMaterial color={GOLD_DARK} metalness={1} roughness={0.52} />
      </mesh>

      {/* Two polished retaining rings. */}
      {[-0.13, 0.13].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.272, 0.009, 8, 56]} />
          <meshStandardMaterial color="#e8cf95" metalness={1} roughness={0.14} />
        </mesh>
      ))}

      {/*
        No fluted grip here on purpose. A ring of thin vertical slivers is the
        obvious way to suggest machined metal, but each sliver is sub-pixel and
        their reflection in the glass shoulder aliased into a fan of arcs across
        the whole upper body. A brushed band reads the same and costs nothing.
      */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.271, 0.271, 0.19, 64]} />
        <meshStandardMaterial color={GOLD_DARK} metalness={1} roughness={0.55} />
      </mesh>
    </group>
  )
}

function Collar() {
  return (
    <mesh position={[0, 0.83, 0]}>
      <cylinderGeometry args={[0.234, 0.228, 0.075, 48]} />
      <meshStandardMaterial color={GOLD_DARK} metalness={1} roughness={0.34} />
    </mesh>
  )
}
