import { useEffect, useRef } from 'react'
import { damp, pointerState } from '../lib/scroll'

/**
 * A trailing ring that swells while dragging. Positioned with a transform on its
 * own rAF loop so it never triggers layout, and skipped entirely on touch, where
 * there is no cursor to augment.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let scale = 1
    let last = performance.now()
    let raf = 0

    const track = (e: PointerEvent) => {
      if (dot.current) {
        dot.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      }
    }

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now

      const targetX = ((pointerState.x + 1) / 2) * window.innerWidth
      const targetY = ((pointerState.y + 1) / 2) * window.innerHeight
      x = damp(x, targetX, 12, dt)
      y = damp(y, targetY, 12, dt)
      scale = damp(scale, pointerState.dragging ? 2.1 : 1, 8, dt)

      if (ring.current) {
        ring.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`
        ring.current.style.borderColor = pointerState.dragging
          ? 'rgb(232 195 122 / 0.9)'
          : 'rgb(233 228 217 / 0.3)'
      }
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', track, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('pointermove', track)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-45 hidden md:block">
      <div
        ref={ring}
        className="absolute left-0 top-0 h-9 w-9 rounded-full border transition-colors duration-300"
      />
      <div
        ref={dot}
        className="absolute left-0 top-0 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-light"
      />
    </div>
  )
}
