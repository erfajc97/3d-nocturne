import { useMemo, type ReactElement } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { quality } from '../lib/quality'
import { mapRange, scrollState } from '../lib/scroll'

/**
 * Grade pass. Order matters: defocus first (so the bokeh is in-scene), bloom the
 * bright result, then lens artefacts, then grain last so it sits on top like
 * film stock.
 *
 * Note on the aberration offset: these effect wrappers key an internal `useMemo`
 * on `JSON.stringify(props)`, and under React 19 a `ref` arrives as a prop. Once
 * the effect is mounted that ref holds an R3F-managed object whose `__r3f` state
 * is circular, so stringify throws and takes the whole tree down. We therefore
 * own a Vector2, hand it over once, and mutate it in place — no ref, no
 * re-render, and the uniform still updates because the effect keeps our instance.
 */
export function Effects() {
  const offset = useMemo(() => new THREE.Vector2(0.00025, 0.00015), [])

  useFrame(() => {
    // Aberration widens at the extremes of the story and calms in the middle.
    // Kept low: the gold hardware has hard specular edges and fringes badly.
    const p = scrollState.progress
    const edge = Math.max(mapRange(p, 0.12, 0, 0, 1), mapRange(p, 0.8, 1, 0, 1))
    const amount = 0.00018 + edge * 0.0008
    offset.set(amount, amount * 0.6)
  })

  /*
    Passes are assembled as an array rather than written inline. EffectComposer
    types its children as elements only, so a conditional pass (`... : null`) and
    even a JSX comment between passes both fail the check.

    - ChromaticAberration: no radial modulation. It scales the offset with
      distance from centre, which is exactly where the flacon sits.
    - Vignette: generous offset, since the composition is deliberately off-centre
      and a tight vignette crushed the subject along with the frame edges.
  */
  const passes = [
    quality.depthOfField ? (
      <DepthOfField key="dof" target={[0, 0.1, 0]} focalLength={0.024} bokehScale={5.5} height={480} />
    ) : null,
    <Bloom
      key="bloom"
      intensity={0.62}
      luminanceThreshold={0.72}
      luminanceSmoothing={0.24}
      mipmapBlur
      radius={0.66}
    />,
    <ChromaticAberration key="ca" blendFunction={BlendFunction.NORMAL} offset={offset} />,
    <Vignette key="vig" offset={0.36} darkness={0.74} blendFunction={BlendFunction.NORMAL} />,
    <Noise key="noise" opacity={0.035} blendFunction={BlendFunction.OVERLAY} />,
  ].filter(Boolean) as ReactElement[]

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {passes}
    </EffectComposer>
  )
}
