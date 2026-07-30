import { useEffect, useState } from 'react'

/**
 * Curtain intro. There are no assets to download — the scene is procedural — so
 * this is a deliberate beat that lets the first frames of WebGL settle and the
 * webfont land before the type animates in. Faked progress is honest here: it
 * measures nothing, so it counts at a fixed rate rather than pretending.
 */
export function Loader({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0)
  const [lifting, setLifting] = useState(false)

  useEffect(() => {
    const start = performance.now()
    const total = 1500
    let raf = 0

    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / total)
      // Ease so it decelerates into 100 instead of hitting a wall.
      setCount(Math.round((1 - Math.pow(1 - t, 3)) * 100))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setLifting(true)
        window.setTimeout(onDone, 900)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-ink px-6 py-10 transition-all duration-[900ms] ease-[cubic-bezier(.76,0,.24,1)] md:px-12 md:py-14 ${
        lifting ? 'pointer-events-none -translate-y-full' : ''
      }`}
    >
      <p className="eyebrow">Maison de Parfum · Grasse</p>

      <div className="flex items-end justify-between gap-8">
        <h2 className="font-display text-[clamp(2.5rem,9vw,7rem)] font-light leading-none tracking-[0.06em] text-bone/90">
          NOCTURNE
        </h2>
        <span className="font-display text-[clamp(1.5rem,4vw,3rem)] font-light tabular-nums text-gold-light">
          {String(count).padStart(3, '0')}
        </span>
      </div>

      <div className="relative h-px w-full bg-bone/10">
        <span
          className="absolute inset-y-0 left-0 bg-gold-light transition-[width] duration-100 ease-linear"
          style={{ width: `${count}%` }}
        />
      </div>
    </div>
  )
}
