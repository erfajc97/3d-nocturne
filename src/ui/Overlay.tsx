import { useEffect, useRef } from 'react'
import { NOTES } from '../scene/NoteOrbs'
import { revealState, scrollState } from '../lib/scroll'
import { Reveal, SplitChars } from './reveal'

export function Overlay({ ready }: { ready: boolean }) {
  return (
    <main className="relative z-10">
      <Hero ready={ready} />
      <Manifesto />
      <Notes />
      <Craft />
      <Editorial />
      <Acquire />
      <Footer />
    </main>
  )
}

/* ==================================================================== hero */

function Hero({ ready }: { ready: boolean }) {
  return (
    <section
      id="hero"
      className="pointer-events-none relative flex h-screen flex-col justify-between px-6 pb-10 pt-28 md:px-12 md:pb-14"
    >
      {/* Portrait stacks the copy into the lower half, under the flacon; landscape
          centres it beside the flacon. */}
      <div className="scrim-mobile mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-end pb-6 md:justify-center md:pb-0">
        <p
          className={`eyebrow mb-7 transition-all duration-1000 ${
            ready ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
          style={{ transitionDelay: '600ms' }}
        >
          Extrait de Parfum · Édition MMXXVI
        </p>

        {/*
          The wordmark must never break. `whitespace-nowrap` is doing real work
          here: SplitChars emits one inline-block per glyph, and browsers will
          happily wrap between inline-blocks. Size is capped in vw so the eight
          characters always fit the viewport on one line.
        */}
        <h1 className="on-render whitespace-nowrap font-display text-[min(14vw,9.5rem)] font-light leading-[0.9] tracking-[-0.025em] text-bone">
          <SplitChars text="NOCTURNE" play={ready} delay={0.35} stagger={0.045} />
        </h1>

        <div
          className={`mt-9 max-w-md transition-all duration-[1400ms] md:scrim md:max-w-[26rem] ${
            ready ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
          style={{ transitionDelay: '1100ms' }}
        >
          <div className="rule-gold mb-6 w-24" />
          <p className="text-[0.95rem] leading-relaxed text-bone/80">
            Compuesto para la hora en que la luz se rinde. Oud ahumado sobre resina
            de ámbar, atravesado por un iris frío que se niega a calentarse.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1600px] items-end justify-between">
        <DragHint ready={ready} />

        <div
          className={`hidden text-right transition-opacity duration-1000 md:block ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionDelay: '1400ms' }}
        >
          <p className="eyebrow mb-2">Desplaza</p>
          <div className="ml-auto h-14 w-px overflow-hidden bg-bone/15">
            <span className="block h-full w-full origin-top animate-[trickle_2.4s_cubic-bezier(.6,0,.4,1)_infinite] bg-gold-light" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes trickle {
          0%   { transform: translateY(-100%); }
          55%  { transform: translateY(0%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </section>
  )
}

/** "Arrastra para revelar" — retires itself once the veil has been pulled. */
function DragHint({ ready }: { ready: boolean }) {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (box.current) {
        const spent = revealState.value
        box.current.style.opacity = String(Math.max(0, 1 - spent * 1.6))
        box.current.style.transform = `translateX(${-spent * 24}px)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      ref={box}
      className={`flex items-center gap-4 transition-opacity duration-1000 ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ transitionDelay: '1400ms' }}
    >
      <span className="relative flex h-8 w-16 items-center">
        <span className="absolute inset-x-0 h-px bg-linear-to-r from-transparent via-gold to-transparent" />
        <span className="absolute left-0 h-1.5 w-1.5 animate-[sweep_2.8s_ease-in-out_infinite] rounded-full bg-gold-light" />
      </span>
      <p className="eyebrow">Arrastra para revelar</p>

      <style>{`
        @keyframes sweep {
          0%, 100% { transform: translateX(0);    opacity: 0.2; }
          50%      { transform: translateX(56px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/* =============================================================== manifesto */

function Manifesto() {
  return (
    <section
      id="manifesto"
      className="pointer-events-none relative flex min-h-[110vh] items-center px-6 md:px-12 lg:pr-40"
    >
      <Reveal className="mx-auto w-full max-w-[1600px]">
        <div className="scrim max-w-3xl">
          <p data-reveal className="eyebrow mb-9">
            01 — Manifiesto
          </p>
          <p
            data-reveal
            className="on-render font-display text-[clamp(1.9rem,4.2vw,3.6rem)] font-light leading-[1.16] tracking-[-0.01em] text-bone"
          >
            No perseguimos la primera impresión. Perseguimos{' '}
            <em className="text-gold-light not-italic">lo que queda</em> seis horas
            después, cuando ya nadie está mirando.
          </p>

          <div data-reveal className="mt-14 grid gap-10 sm:grid-cols-2">
            <p className="text-[0.9rem] leading-relaxed text-bone/70">
              Cada lote madura noventa días en barrica de roble antes de ser
              embotellado. No aceleramos la maceración: el tiempo es el único
              ingrediente que no se puede comprar.
            </p>
            <p className="text-[0.9rem] leading-relaxed text-bone/70">
              Dieciocho por ciento de concentración. Sin filtros de color, sin
              estabilizadores. El sedimento en el fondo del frasco no es un defecto
              — es la prueba.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* =================================================================== notes */

const NOTE_COPY = [
  {
    detail:
      'Agarwood de Assam, destilado en cobre. Ahumado, animal, casi mineral. Ocupa el setenta por ciento de la fórmula y no pide permiso.',
    meta: ['Assam, India', 'Destilación en cobre', '42% del extracto'],
  },
  {
    detail:
      'Labdanum y benjuí fundidos en caliente. Aporta el peso dulce que sostiene el oud sin domesticarlo. La parte que se queda en la piel.',
    meta: ['Cuenca mediterránea', 'Fundido a 60°C', '31% del extracto'],
  },
  {
    detail:
      'Rizoma de iris pallida con cinco años de secado. Aporta un frío harinoso, terroso, que corta la dulzura antes de que se vuelva confortable.',
    meta: ['Toscana, Italia', '5 años de secado', '14% del extracto'],
  },
]

function Notes() {
  return (
    <section
      id="notes"
      className="pointer-events-none relative min-h-[170vh] px-6 py-[18vh] md:px-12 lg:pr-40"
    >
      <div className="mx-auto w-full max-w-[1600px]">
        <Reveal>
          <div className="scrim max-w-xl">
            <p data-reveal className="eyebrow mb-4">
              02 — Los Acordes
            </p>
            <h2
              data-reveal
              className="on-render font-display text-[clamp(2rem,5vw,4rem)] font-light leading-[1.05] text-bone"
            >
              Tres materias, una sola dirección.
            </h2>
          </div>
        </Reveal>

        <div className="mt-[14vh] flex flex-col gap-[12vh]">
          {NOTES.map((note, i) => (
            <Reveal key={note.label} start="top 82%">
              <article className="scrim grid gap-8 md:grid-cols-12 md:items-start">
                <div className="md:col-span-1">
                  <span
                    data-reveal
                    className="font-display text-3xl font-light tabular-nums text-gold/80"
                  >
                    0{i + 1}
                  </span>
                </div>

                <div className="md:col-span-5">
                  <h3
                    data-reveal
                    className="on-render mb-5 font-display text-[clamp(1.6rem,3vw,2.5rem)] font-light leading-tight text-bone"
                  >
                    {note.label}
                  </h3>
                  <div data-reveal className="rule-gold mb-6 w-16" />
                  <p data-reveal className="max-w-sm text-[0.9rem] leading-relaxed text-bone/70">
                    {NOTE_COPY[i].detail}
                  </p>
                </div>

                <div className="md:col-span-4 md:col-start-8">
                  <dl data-reveal className="divide-y divide-bone/12 border-y border-bone/12">
                    {NOTE_COPY[i].meta.map((m) => (
                      <div key={m} className="flex items-center justify-between py-3.5">
                        <dd className="text-[0.8rem] tracking-wide text-bone/75">{m}</dd>
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: note.attenuation }}
                        />
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* =================================================================== craft */

function Craft() {
  return (
    <section id="craft" className="relative min-h-[130vh] px-6 py-[16vh] md:px-12 lg:pr-40">
      <Reveal className="mx-auto w-full max-w-[1600px]">
        <div className="grid gap-14 md:grid-cols-12 md:items-center">
          <figure data-reveal className="md:col-span-5">
            <div className="relative overflow-hidden">
              <img
                src="/editorial/ingredients.jpg"
                alt="Astilla de oud, resina de ámbar y raíz de iris sobre pizarra negra"
                loading="lazy"
                className="w-full scale-[1.02] object-cover transition-transform duration-[1600ms] ease-out hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink via-transparent to-transparent opacity-70" />
            </div>
            <figcaption className="eyebrow mt-4">Materias primas · Lote N° 041</figcaption>
          </figure>

          <div className="scrim md:col-span-6 md:col-start-7">
            <p data-reveal className="eyebrow mb-8">
              03 — El Oficio
            </p>
            <h2
              data-reveal
              className="on-render font-display text-[clamp(1.9rem,4vw,3.2rem)] font-light leading-[1.1] text-bone"
            >
              Noventa días en la oscuridad.
            </h2>
            <p data-reveal className="mt-8 max-w-lg text-[0.92rem] leading-relaxed text-bone/70">
              La maceración ocurre en sótano, sin luz y sin movimiento. Cada semana
              se extrae una muestra de dos mililitros; si la nota de salida todavía
              domina, el lote sigue esperando. Nunca sabemos de antemano cuándo
              estará listo.
            </p>

            <dl data-reveal className="mt-12 grid grid-cols-3 gap-6 border-t border-bone/14 pt-8">
              {[
                ['90', 'días de maceración'],
                ['18%', 'concentración'],
                ['400', 'frascos por lote'],
              ].map(([n, label]) => (
                <div key={label}>
                  <dt className="font-display text-[clamp(1.8rem,3vw,2.6rem)] font-light leading-none tabular-nums text-gold-light">
                    {n}
                  </dt>
                  <dd className="eyebrow mt-3 leading-relaxed">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* =============================================================== editorial */

function Editorial() {
  return (
    <section id="editorial" className="relative min-h-[110vh] px-6 py-[14vh] md:px-12 lg:pr-40">
      <Reveal className="mx-auto w-full max-w-[1600px]">
        <div className="grid gap-8 md:grid-cols-12">
          <figure data-reveal className="md:col-span-7">
            <div className="relative aspect-16/9 overflow-hidden">
              <img
                src="/editorial/ink.jpg"
                alt="Humo negro y tinta de ámbar girando en líquido oscuro"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="eyebrow mt-4">La estela · Estudio de difusión</figcaption>
          </figure>

          <figure data-reveal className="md:col-span-4 md:col-start-9 md:mt-[18vh]">
            <div className="relative aspect-3/4 overflow-hidden">
              <img
                src="/editorial/flacon.jpg"
                alt="Flacon de NOCTURNE sobre piedra húmeda con luz rasante"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="eyebrow mt-4">Flacon 50 ml · Vidrio soplado</figcaption>
          </figure>
        </div>

        <blockquote
          data-reveal
          className="scrim mx-auto mt-[16vh] max-w-3xl text-center font-display text-[clamp(1.5rem,3.4vw,2.6rem)] font-light italic leading-[1.25] text-bone/95"
        >
          <span className="on-render">
            «Un perfume que se anuncia ya ha fracasado. El nuestro se descubre cuando
            ya te has ido.»
          </span>
          <footer className="eyebrow mt-8 not-italic">Hélène Baradat · Perfumista</footer>
        </blockquote>
      </Reveal>
    </section>
  )
}

/* ================================================================= acquire */

function Acquire() {
  return (
    <section
      id="acquire"
      className="relative flex min-h-screen items-center px-6 py-[14vh] md:px-12 lg:pr-40"
    >
      <Reveal className="mx-auto w-full max-w-[1600px]">
        <div className="grid gap-16 md:grid-cols-12 md:items-end">
          <div className="scrim md:col-span-6">
            <p data-reveal className="eyebrow mb-8">
              04 — Adquirir
            </p>
            <h2
              data-reveal
              className="on-render font-display text-[clamp(2.4rem,7vw,6rem)] font-light leading-[0.92] tracking-[-0.02em] text-bone"
            >
              NOCTURNE
              <span className="block text-gold-light">Extrait</span>
            </h2>
            <p data-reveal className="mt-8 max-w-md text-[0.92rem] leading-relaxed text-bone/70">
              Lote 041 · 400 unidades numeradas a mano. El envío comienza cuando el
              lote alcanza su punto, no antes.
            </p>
          </div>

          <div className="scrim md:col-span-5 md:col-start-8">
            <dl data-reveal className="divide-y divide-bone/12 border-y border-bone/12">
              {[
                ['Formato', '50 ml · Extrait'],
                ['Concentración', '18%'],
                ['Familia', 'Amaderada ahumada'],
                ['Longevidad', '10–14 h'],
                ['Precio', '€ 290'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between py-4">
                  <dt className="eyebrow">{k}</dt>
                  <dd
                    className={
                      k === 'Precio'
                        ? 'font-display text-2xl font-light tabular-nums text-gold-light'
                        : 'text-[0.85rem] text-bone/85'
                    }
                  >
                    {v}
                  </dd>
                </div>
              ))}
            </dl>

            <button
              data-reveal
              type="button"
              className="group relative mt-10 w-full overflow-hidden border border-gold/50 px-8 py-5 text-left transition-colors duration-500 hover:border-gold"
            >
              <span className="eyebrow relative z-10 text-gold-light transition-colors duration-500 group-hover:text-ink">
                Reservar del lote 041
              </span>
              <span className="absolute right-8 top-1/2 z-10 -translate-y-1/2 text-gold-light transition-all duration-500 group-hover:translate-x-1 group-hover:text-ink">
                →
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gold-light transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-0" />
            </button>

            <p data-reveal className="eyebrow mt-5 leading-relaxed">
              Quedan 63 de 400 · Envío desde Grasse
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ================================================================== footer */

function Footer() {
  return (
    <footer className="relative border-t border-bone/12 bg-ink/80 px-6 py-14 md:px-12">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-lg tracking-[0.42em] text-bone/90">NOCTURNE</p>
          <p className="eyebrow mt-4">Maison de Parfum · Grasse, France</p>
        </div>

        <nav className="flex flex-wrap gap-x-10 gap-y-4">
          {['Instagram', 'Diario', 'Contacto', 'Distribución'].map((l) => (
            <a
              key={l}
              href="#hero"
              className="eyebrow transition-colors duration-300 hover:text-gold-light"
            >
              {l}
            </a>
          ))}
        </nav>

        <p className="eyebrow">© 2026 — Todos los derechos reservados</p>
      </div>
      <ScrollReadout />
    </footer>
  )
}

/** Tiny diagnostic that doubles as a design element: live scroll percentage. */
function ScrollReadout() {
  const el = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (el.current) {
        el.current.textContent = String(Math.round(scrollState.progress * 100)).padStart(3, '0')
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="pointer-events-none fixed bottom-6 left-6 z-40 hidden md:block">
      <span className="eyebrow tabular-nums">
        <span ref={el}>000</span> / 100
      </span>
    </div>
  )
}
