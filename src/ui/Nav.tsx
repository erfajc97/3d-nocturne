import { useEffect, useRef } from 'react'
import { scrollState } from '../lib/scroll'

const CHAPTERS = [
  { id: 'hero', label: 'Le Voile', at: 0.0 },
  { id: 'manifesto', label: 'Manifiesto', at: 0.16 },
  { id: 'notes', label: 'Los Acordes', at: 0.34 },
  { id: 'craft', label: 'El Oficio', at: 0.6 },
  { id: 'editorial', label: 'Materia', at: 0.76 },
  { id: 'acquire', label: 'Adquirir', at: 0.9 },
]

export function Nav({ ready }: { ready: boolean }) {
  return (
    <header
      className={`pointer-events-none fixed inset-x-0 top-0 z-40 transition-opacity duration-1000 ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Solid bar on phones: content scrolls right under the fixed nav there, and a
          gradient alone left the wordmark tangled in section headings. */}
      <div className="border-b border-bone/8 bg-ink/88 backdrop-blur-md md:border-0 md:bg-transparent md:backdrop-blur-none">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 md:px-12 md:py-8">
        <a
          href="#hero"
          className="pointer-events-auto font-display text-[1.05rem] tracking-[0.42em] text-bone/90 transition-colors hover:text-gold-light"
        >
          NOCTURNE
        </a>

        <nav className="pointer-events-auto hidden items-center gap-9 md:flex">
          {['Colección', 'Maison', 'Diario'].map((item) => (
            <a
              key={item}
              href="#manifesto"
              className="eyebrow transition-colors duration-300 hover:text-gold-light"
            >
              {item}
            </a>
          ))}
        </nav>

        <a
          href="#acquire"
          className="pointer-events-auto group relative overflow-hidden border border-bone/15 px-5 py-2.5 transition-colors duration-500 hover:border-gold/60"
        >
          <span className="eyebrow relative z-10 text-bone/80 transition-colors group-hover:text-ink">
            Adquirir
          </span>
          <span className="absolute inset-0 -translate-y-full bg-gold-light transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-y-0" />
        </a>
      </div>
      </div>
    </header>
  )
}

/**
 * Right-hand chapter rail. Reads scroll progress on its own rAF loop and writes
 * straight to the DOM — routing this through React state would re-render the
 * whole overlay on every frame.
 */
export function ChapterRail({ ready }: { ready: boolean }) {
  const fill = useRef<HTMLSpanElement>(null)
  const labels = useRef<(HTMLAnchorElement | null)[]>([])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = scrollState.progress
      if (fill.current) fill.current.style.transform = `scaleY(${p})`

      labels.current.forEach((el, i) => {
        if (!el) return
        const next = CHAPTERS[i + 1]?.at ?? 1.01
        const active = p >= CHAPTERS[i].at - 0.02 && p < next - 0.02
        el.style.opacity = active ? '1' : '0.32'
        el.style.color = active ? '#e8c37a' : ''
        el.style.letterSpacing = active ? '0.42em' : '0.34em'
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <aside
      className={`pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block transition-opacity duration-1000 ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex items-stretch gap-4">
        <div className="relative w-px bg-bone/12">
          <span
            ref={fill}
            className="absolute inset-x-0 top-0 h-full origin-top bg-gold-light"
            style={{ transform: 'scaleY(0)' }}
          />
        </div>
        <div className="flex flex-col justify-between gap-6 py-1">
          {CHAPTERS.map((c, i) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              ref={(el) => {
                labels.current[i] = el
              }}
              className="eyebrow pointer-events-auto text-right transition-all duration-500"
            >
              {c.label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  )
}
