import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { pointerState, scrollState } from './scroll'
import { prefersReducedMotion } from './quality'

gsap.registerPlugin(ScrollTrigger)

/**
 * Wires Lenis inertial scrolling to GSAP's ticker and ScrollTrigger, and feeds
 * normalized progress into the scroll store the 3D scene reads from.
 *
 * Running Lenis on GSAP's ticker (instead of its own rAF) keeps scroll position,
 * ScrollTrigger evaluation and tween updates on the same frame — otherwise
 * pinned text visibly lags the camera by one frame.
 */
export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const lenis = new Lenis({
      duration: prefersReducedMotion ? 0.1 : 1.15,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      smoothWheel: !prefersReducedMotion,
    })

    let last = 0
    lenis.on('scroll', (e: { progress: number; scroll: number }) => {
      scrollState.progress = e.progress
      scrollState.velocity = e.scroll - last
      last = e.scroll
      ScrollTrigger.update()
    })

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [enabled])
}

/** Tracks pointer position and horizontal drag on the canvas. */
export function usePointer() {
  useEffect(() => {
    let grabbing = false
    let originX = 0
    let originDrag = 0

    const move = (e: PointerEvent) => {
      pointerState.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerState.y = (e.clientY / window.innerHeight) * 2 - 1

      if (grabbing) {
        const dx = (e.clientX - originX) / window.innerWidth
        pointerState.dragX = originDrag + dx * Math.PI * 2.4
      }
    }

    const down = (e: PointerEvent) => {
      // Let real UI (links, buttons) win the gesture.
      if ((e.target as HTMLElement).closest('a,button')) return
      grabbing = true
      pointerState.dragging = true
      originX = e.clientX
      originDrag = pointerState.dragX
      document.body.style.cursor = 'grabbing'
    }

    const up = () => {
      grabbing = false
      pointerState.dragging = false
      document.body.style.cursor = ''
    }

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)

    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [])
}
