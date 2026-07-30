import { Suspense } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, Preload } from '@react-three/drei'
import { Backdrop } from './Backdrop'
import { CameraRig } from './CameraRig'
import { Effects } from './Effects'
import { Flacon } from './Flacon'
import { Floor } from './Floor'
import { GlowPanel } from './GlowPanel'
import { Lights } from './Lights'
import { LightBars } from './LightBars'
import { Motes } from './Motes'
import { NoteOrbs, OrbitArc } from './NoteOrbs'
import { quality } from '../lib/quality'

/**
 * The one and only WebGL surface. It is fixed behind the scrolling HTML, never
 * unmounts, and owns no React state — every frame reads from the scroll store.
 */
export function Experience() {
  return (
    <Canvas
      className="!fixed inset-0"
      dpr={quality.dpr}
      shadows={quality.shadows}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      /* Matches the first storyboard shot, offset included, so frame one is already composed. */
      camera={{ position: [-1.55, 0.05, 7.1], fov: 30, near: 0.1, far: 60 }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor('#04040600')
        /*
          Fog swallows the far edge of the floor plane, which otherwise ends in a
          hard bright horizon line straight through the type. Density is tuned
          against the *furthest* camera position: FogExp2 falls off as
          exp(-(density*depth)^2), so the portrait framing at ~10 units was
          erasing the flacon entirely at higher values.
        */
        scene.fog = new THREE.FogExp2('#040406', 0.055)
      }}
    >
      <Suspense fallback={null}>
        <Lights />
        <Backdrop />
        <GlowPanel />
        <Floor />
        <Flacon />
        <NoteOrbs />
        <OrbitArc />
        <Motes />
        <LightBars />
        <CameraRig />
        <Effects />
        <Preload all />
      </Suspense>
      <AdaptiveDpr pixelated />
    </Canvas>
  )
}
