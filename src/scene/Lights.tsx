import { useRef } from 'react'
import * as THREE from 'three'
import { Environment, Lightformer } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { quality } from '../lib/quality'
import { damp, pointerState } from '../lib/scroll'

/**
 * Lighting is entirely self-contained: the environment map is baked once from
 * Lightformer geometry, so there is no HDRI download and the page works offline.
 * Glass needs an environment to refract — flat lights alone make it look like
 * grey plastic.
 */
export function Lights() {
  const key = useRef<THREE.SpotLight>(null!)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    // Key light tracks the cursor, so the highlight on the glass follows the hand.
    key.current.position.x = damp(key.current.position.x, 2.6 + pointerState.x * 1.8, 3, dt)
    key.current.position.y = damp(key.current.position.y, 4.2 - pointerState.y * 1.2, 3, dt)
  })

  return (
    <>
      <ambientLight intensity={0.12} color="#8899bb" />

      <spotLight
        ref={key}
        position={[2.6, 4.2, 3.2]}
        angle={0.42}
        penumbra={0.95}
        intensity={70}
        distance={16}
        color="#fff0d0"
        castShadow={quality.shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0008}
      />

      {/* Cold counter-light to separate the glass from the black backdrop. */}
      <spotLight
        position={[-3.4, 1.6, -2.2]}
        angle={0.7}
        penumbra={1}
        intensity={26}
        distance={14}
        color="#7d9dd8"
      />

      {/* Warm bounce off the floor, sells the "wet stone" read. */}
      <pointLight position={[0, -0.85, 1.6]} intensity={4} distance={5} color="#e0913a" />

      {/* 512 minimum: the flacon's clearcoat mirrors this map across a tight curve,
          and a coarse cubemap turns the Lightformers' hard edges into banding. */}
      <Environment resolution={quality.tier === 'high' ? 1024 : 512} frames={1} background={false}>
        {/* Big soft top strip — the primary specular on the shoulders. */}
        <Lightformer form="rect" intensity={5} scale={[8, 3, 1]} position={[0, 6, 1]} rotation={[Math.PI / 2, 0, 0]} color="#fff4e0" />
        {/* Two vertical bars read as studio strip boxes down the sides. */}
        <Lightformer form="rect" intensity={3.4} scale={[0.6, 6, 1]} position={[-4.2, 1, 2]} rotation={[0, Math.PI / 2, 0]} color="#ffd9a0" />
        <Lightformer form="rect" intensity={2.2} scale={[0.6, 6, 1]} position={[4.2, 1, 1]} rotation={[0, -Math.PI / 2, 0]} color="#9fb8e8" />
        {/* Small hot ring behind, so the glass edge catches a rim. */}
        <Lightformer form="ring" intensity={7} scale={2.4} position={[0, 1.2, -5]} color="#ffe9c4" />
        {/*
          Backlight card directly behind the flacon. Transmission can only refract
          what is actually behind the glass, so without this the bottle has nothing
          to transmit and goes opaque black.
        */}
        <Lightformer
          form="rect"
          intensity={9}
          scale={[3.2, 4.4, 1]}
          position={[0, 0, -3.4]}
          color="#ffdfa8"
        />
        <Lightformer form="circle" intensity={1.6} scale={5} position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]} color="#472a10" />
      </Environment>
    </>
  )
}
