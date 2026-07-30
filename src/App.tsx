import { useCallback, useState } from 'react'
import { Experience } from './scene/Experience'
import { Cursor } from './ui/Cursor'
import { Loader } from './ui/Loader'
import { ChapterRail, Nav } from './ui/Nav'
import { Overlay } from './ui/Overlay'
import { usePointer, useSmoothScroll } from './lib/useSmoothScroll'

export default function App() {
  const [booted, setBooted] = useState(false)

  // Smooth scrolling stays off during the intro so the curtain cannot be scrolled past.
  useSmoothScroll(booted)
  usePointer()

  const onDone = useCallback(() => setBooted(true), [])

  return (
    <>
      {/* The canvas is fixed behind everything and never remounts. */}
      <Experience />

      {/*
        Global scrim. Darkens the frame edges and the bottom band where the nav,
        hint and readout sit. Per-block legibility is handled by `.scrim`, so this
        stays light enough to leave the render intact.
      */}
      <div className="pointer-events-none fixed inset-0 z-5 bg-[radial-gradient(115%_95%_at_68%_46%,transparent_46%,rgba(4,4,6,0.6)_100%)]" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-5 h-40 bg-linear-to-t from-ink/85 to-transparent" />
      <div className="pointer-events-none fixed inset-x-0 top-0 z-5 h-32 bg-linear-to-b from-ink/70 to-transparent" />

      <Nav ready={booted} />
      <ChapterRail ready={booted} />
      <Overlay ready={booted} />
      <Cursor />

      {!booted && <Loader onDone={onDone} />}
    </>
  )
}
