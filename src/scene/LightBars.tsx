import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mapRange, scrollState } from '../lib/scroll'

type Bar = {
  position: [number, number, number]
  rotation: [number, number, number]
  length: number
  color: string
  /** Scroll window in which this bar is lit. */
  from: number
  to: number
}

/**
 * Thin emissive tubes crossing the space. Unlit basic material with tone mapping
 * off, so bloom turns them into hard neon streaks — the cheapest way to get a
 * photographed-studio look without real area lights.
 */
const BARS: Bar[] = [
  // Kept high, low or well to the right of frame centre: a streak running through
  // the headline reads as a mistake, not as lighting.
  { position: [1.4, 2.25, -2.2], rotation: [0, 0.22, -0.34], length: 6.4, color: '#fff4dd', from: -0.2, to: 0.55 },
  { position: [2.6, 1.05, -3.0], rotation: [0.1, -0.3, 0.82], length: 5.0, color: '#ffe6b8', from: -0.2, to: 0.66 },
  { position: [1.1, -1.55, -1.4], rotation: [0, 0.12, 0.05], length: 4.6, color: '#f7d9a0', from: 0.12, to: 0.82 },
  // These two fade before the finale. Once the camera pulls back they drift into
  // frame as thick defocused streaks that read as artefacts, not lighting.
  { position: [-2.9, 1.55, -1.2], rotation: [0.3, 0.9, 1.3], length: 3.8, color: '#ffffff', from: 0.36, to: 0.9 },
  { position: [2.9, -0.5, -1.1], rotation: [-0.2, -0.8, 1.18], length: 3.4, color: '#ffdca8', from: 0.54, to: 0.94 },
]

export function LightBars() {
  const group = useRef<THREE.Group>(null!)

  useFrame((state) => {
    const p = scrollState.progress
    const t = state.clock.elapsedTime

    group.current.children.forEach((child, i) => {
      const bar = BARS[i]
      const mesh = child as THREE.Mesh
      const mat = mesh.material as THREE.MeshBasicMaterial

      // Fade in / out over the bar's scroll window, with a faint flicker.
      const on =
        mapRange(p, bar.from, bar.from + 0.12, 0, 1) * (1 - mapRange(p, bar.to - 0.12, bar.to, 0, 1))
      const flicker = 0.9 + Math.sin(t * (5 + i * 3.1) + i) * 0.1

      mat.opacity = on * flicker * 0.72
      mesh.visible = on > 0.01
      mesh.scale.x = 0.25 + on * 0.75
    })

    // Whole rig rotates slowly, so the streaks sweep across the glass.
    group.current.rotation.y = Math.sin(t * 0.07) * 0.1 + scrollState.progress * 0.4
  })

  return (
    <group ref={group}>
      {BARS.map((bar, i) => (
        <mesh key={i} position={bar.position} rotation={bar.rotation}>
          <boxGeometry args={[bar.length, 0.022, 0.022]} />
          <meshBasicMaterial color={bar.color} toneMapped={false} transparent opacity={0} />
        </mesh>
      ))}
    </group>
  )
}
