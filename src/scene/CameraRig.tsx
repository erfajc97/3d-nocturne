import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { damp, pointerState, scrollState } from '../lib/scroll'
import { prefersReducedMotion } from '../lib/quality'

type Keyframe = {
  /** Scroll progress this shot lands on. */
  at: number
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  /**
   * How much of the horizontal composition offset to apply, 0 → 1. Panning the
   * look-at target left pushes the flacon into the right third of the frame,
   * clearing the left side for copy. Close-ups want less of it.
   */
  bias: number
}

const SHOTS: Keyframe[] = [
  { at: 0.0, position: [0, 0.05, 7.1], target: [0, 0.0, 0], fov: 30, bias: 1.0 },
  { at: 0.15, position: [2.5, 1.15, 4.2], target: [0, 0.3, 0], fov: 32, bias: 0.55 },
  { at: 0.3, position: [0.35, 1.45, 2.15], target: [0, 0.95, 0], fov: 38, bias: 0.2 },
  { at: 0.46, position: [-3.1, 0.35, 3.3], target: [0, 0.1, 0], fov: 33, bias: 0.45 },
  { at: 0.62, position: [1.0, -0.62, 2.7], target: [0, -0.25, 0], fov: 40, bias: 0.35 },
  { at: 0.78, position: [3.0, 0.6, 4.6], target: [0, 0.15, 0], fov: 30, bias: 0.5 },
  // Finale keeps some bias: dead-centre put the flacon straight behind the
  // purchase panel, and a bright glass body under a spec table is unreadable.
  { at: 1.0, position: [0, 0.2, 8.6], target: [0, 0.05, 0], fov: 27, bias: 0.5 },
]

const smoothstep = (t: number) => t * t * (3 - 2 * t)

type Sampled = { pos: THREE.Vector3; target: THREE.Vector3; fov: number; bias: number }

function sample(p: number, out: Sampled) {
  let i = 0
  while (i < SHOTS.length - 2 && p > SHOTS[i + 1].at) i++

  const a = SHOTS[i]
  const b = SHOTS[i + 1]
  const span = b.at - a.at
  const t = smoothstep(Math.min(1, Math.max(0, span > 0 ? (p - a.at) / span : 0)))

  out.pos.set(
    THREE.MathUtils.lerp(a.position[0], b.position[0], t),
    THREE.MathUtils.lerp(a.position[1], b.position[1], t),
    THREE.MathUtils.lerp(a.position[2], b.position[2], t),
  )
  out.target.set(
    THREE.MathUtils.lerp(a.target[0], b.target[0], t),
    THREE.MathUtils.lerp(a.target[1], b.target[1], t),
    THREE.MathUtils.lerp(a.target[2], b.target[2], t),
  )
  out.fov = THREE.MathUtils.lerp(a.fov, b.fov, t)
  out.bias = THREE.MathUtils.lerp(a.bias, b.bias, t)
}

/**
 * Drives the default camera from scroll progress, with damping so a flicked
 * scrollwheel glides instead of teleporting, plus a small pointer parallax.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const goal = useRef<Sampled>({
    pos: new THREE.Vector3(),
    target: new THREE.Vector3(),
    fov: 30,
    bias: 1,
  })
  const look = useRef(new THREE.Vector3(0, 0, 0))

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    sample(scrollState.progress, goal.current)

    /*
      Two compositions, chosen by aspect.

      Landscape trucks the camera left so the flacon lands in the right third and
      the copy gets the left half.
      Portrait has no room for that, so instead it pulls much further back and
      trucks *down*, parking the flacon in the upper part of the frame with the
      copy stacked beneath it. Reusing the landscape framing on a phone put the
      bottle directly behind every paragraph.
    */
    const aspect = size.width / size.height
    const portrait = aspect <= 1.15
    const offsetX = (portrait ? 0 : -1.55) * goal.current.bias
    const offsetY = (portrait ? -0.5 : 0) * goal.current.bias
    const zoomOut = portrait ? 1.3 : 1

    // Parallax: subtle, and switched off while the user drags the bottle so the
    // two interactions do not fight each other.
    const par = prefersReducedMotion || pointerState.dragging ? 0 : 1
    const px = pointerState.x * 0.3 * par
    const py = pointerState.y * 0.18 * par

    const lambda = 4.5
    camera.position.x = damp(camera.position.x, goal.current.pos.x + offsetX + px, lambda, dt)
    camera.position.y = damp(camera.position.y, goal.current.pos.y + offsetY - py, lambda, dt)
    camera.position.z = damp(camera.position.z, goal.current.pos.z * zoomOut, lambda, dt)

    look.current.x = damp(look.current.x, goal.current.target.x + offsetX, lambda, dt)
    look.current.y = damp(look.current.y, goal.current.target.y + offsetY, lambda, dt)
    look.current.z = damp(look.current.z, goal.current.target.z, lambda, dt)
    camera.lookAt(look.current)

    const fov = damp(camera.fov, goal.current.fov, 3, dt)
    if (Math.abs(fov - camera.fov) > 0.001) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  })

  return null
}
