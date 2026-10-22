import { cloneElement, isValidElement, useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, MoveRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

/** A responsive, animated horizontal gallery with snap points and progress feedback. */
export default function ContentSlider({ children, label, className = '' }) {
  const trackRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const reduceMotion = useReducedMotion()

  const syncPosition = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const max = Math.max(1, track.scrollWidth - track.clientWidth)
    setProgress(Math.min(100, Math.max(0, (track.scrollLeft / max) * 100)))
    const slides = [...track.querySelectorAll('.slider-slide')]
    if (slides.length) {
      const center = track.scrollLeft + track.clientWidth * 0.28
      let nearest = 0
      let distance = Infinity
      slides.forEach((slide, index) => {
        const delta = Math.abs(slide.offsetLeft - center)
        if (delta < distance) { nearest = index; distance = delta }
      })
      setActiveIndex(nearest)
    }
  }, [])

  const move = useCallback((direction) => {
    const track = trackRef.current
    if (!track) return
    const slides = track.querySelectorAll('.slider-slide')
    const current = slides[activeIndex]
    const width = current?.getBoundingClientRect().width || track.clientWidth * 0.8
    track.scrollBy({ left: direction * (width + 18), behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [activeIndex, reduceMotion])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    syncPosition()
    track.addEventListener('scroll', syncPosition, { passive: true })
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncPosition) : null
    observer?.observe(track)
    return () => {
      track.removeEventListener('scroll', syncPosition)
      observer?.disconnect()
    }
  }, [syncPosition, children])

  const slides = (Array.isArray(children) ? children : [children]).filter(Boolean)
  const animatedSlides = slides.map((slide, index) => isValidElement(slide)
    ? cloneElement(slide, { className: `${slide.props.className || ''} ${index === activeIndex ? 'is-active' : ''}`.trim() })
    : slide)
  return (
    <div className={`content-slider ${className}`}>
      <div className="slider-controls">
        <div className="slider-label-group">
          <span>{label}</span>
          <span className="slider-count">{String(Math.min(activeIndex + 1, slides.length)).padStart(2, '0')} <i>/</i> {String(slides.length).padStart(2, '0')}</span>
        </div>
        <div className="slider-arrows">
          <button type="button" aria-label={`Previous ${label.toLowerCase()}`} onClick={() => move(-1)}><ChevronLeft size={18} /></button>
          <button type="button" aria-label={`Next ${label.toLowerCase()}`} onClick={() => move(1)}><ChevronRight size={18} /></button>
        </div>
      </div>
      <motion.div
        ref={trackRef}
        className="slider-track"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: 0.65, ease: [0.22, 0.68, 0.24, 1] }}
        role="region"
        aria-label={label}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
          if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
        }}
      >
        {animatedSlides}
      </motion.div>
      <div className="slider-progress" aria-hidden="true"><motion.span animate={{ width: `${progress}%` }} transition={{ duration: 0.18 }} /></div>
      <p className="slider-hint"><MoveRight size={13} aria-hidden="true" /> Drag or scroll to explore</p>
    </div>
  )
}
