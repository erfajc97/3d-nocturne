import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '../lib/quality'

/**
 * Reveals every `[data-reveal]` descendant once the section scrolls into view.
 * One ScrollTrigger per section rather than per element — dozens of triggers all
 * evaluating on the same scroll event is a measurable frame cost.
 */
export function Reveal({
  children,
  className,
  stagger = 0.075,
  y = 34,
  start = 'top 78%',
}: {
  children: ReactNode
  className?: string
  stagger?: number
  y?: number
  start?: string
}) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const targets = el.querySelectorAll('[data-reveal]')
    if (!targets.length) return

    if (prefersReducedMotion) {
      gsap.set(targets, { opacity: 1, y: 0 })
      return
    }

    const tween = gsap.fromTo(
      targets,
      { y, opacity: 0, filter: 'blur(6px)' },
      {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 1.25,
        ease: 'expo.out',
        stagger,
        scrollTrigger: { trigger: el, start, once: true },
      },
    )

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [stagger, y, start])

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  )
}

/**
 * Splits a string into per-character spans inside overflow-hidden line masks so
 * the glyphs can rise out of nothing. Words are kept intact so wrapping still
 * breaks in sensible places.
 */
export function SplitChars({
  text,
  className,
  charClassName,
  delay = 0,
  duration = 1.5,
  stagger = 0.028,
  play = true,
}: {
  text: string
  className?: string
  charClassName?: string
  delay?: number
  duration?: number
  stagger?: number
  play?: boolean
}) {
  const root = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || !play) return
    const chars = el.querySelectorAll('.char')

    if (prefersReducedMotion) {
      gsap.set(chars, { yPercent: 0, opacity: 1 })
      return
    }

    const tween = gsap.fromTo(
      chars,
      { yPercent: 118, opacity: 0, rotate: 4 },
      {
        yPercent: 0,
        opacity: 1,
        rotate: 0,
        duration,
        delay,
        ease: 'expo.out',
        stagger,
      },
    )
    return () => {
      tween.kill()
    }
  }, [play, delay, duration, stagger])

  return (
    <span ref={root} className={className} aria-label={text}>
      {text.split(' ').map((word, w) => (
        <span key={w} className="inline-block overflow-hidden align-bottom pb-[0.12em]">
          {word.split('').map((ch, i) => (
            <span key={i} className={`char ${charClassName ?? ''}`} aria-hidden>
              {ch}
            </span>
          ))}
          {w < text.split(' ').length - 1 && <span className="char">&nbsp;</span>}
        </span>
      ))}
    </span>
  )
}
