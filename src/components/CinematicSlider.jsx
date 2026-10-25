import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, MoveUpRight } from 'lucide-react'
import { Link } from '../lib/RouterLink'

const palettes = [
  ['#101915', '#263f32', '#b8df86'],
  ['#151a27', '#293d5b', '#9dc8ff'],
  ['#20151f', '#493044', '#e4a8ce'],
  ['#171b20', '#35434a', '#e4c38a'],
]

/** Cinematic, vertical image-rail carousel inspired by the user's video reference. */
export default function CinematicSlider({ items = [], label, getTitle, getImage, getLink, renderDetails, intervalSeconds = 5 }) {
  const [active, setActive] = useState(0)
  const reduceMotion = useReducedMotion()
  useEffect(() => {
    const seconds = Number(intervalSeconds)
    if (items.length < 2 || !Number.isFinite(seconds) || seconds <= 0 || reduceMotion) return undefined
    const timer = window.setInterval(() => setActive((current) => (current + 1) % items.length), seconds * 1000)
    return () => window.clearInterval(timer)
  }, [intervalSeconds, items.length, reduceMotion])
  if (!items.length) return null
  const move = (step) => setActive((current) => (current + step + items.length) % items.length)
  const handleSwipe = (_, info) => {
    if (info.offset.x <= -40 || info.velocity.x <= -300) move(1)
    else if (info.offset.x >= 40 || info.velocity.x >= 300) move(-1)
  }
  const safeActive = active % items.length
  const item = items[safeActive]
  const title = getTitle?.(item) || item.title || item.name || label
  const titleLink = getLink?.(item) || ''
  const [bg, panel, accent] = palettes[safeActive % palettes.length]
  return (
    <section className="cinematic-slider" aria-label={label} style={{ '--cinema-bg': bg, '--cinema-panel': panel, '--cinema-accent': accent }}>
      <div className="cinema-atmosphere" aria-hidden="true" />
      <div className="cinema-copy">
        <span className="cinema-kicker">{label} <i /> {String(safeActive + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
        <AnimatePresence mode="wait">
          <motion.div key={`${safeActive}-title`} initial={reduceMotion ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .42 }}>
            <h3>{titleLink ? (titleLink.startsWith('http') ? <a href={titleLink} target='_blank' rel='noreferrer'>{title}</a> : <Link to={titleLink}>{title}</Link>) : title}</h3>
            {renderDetails?.(item, safeActive, true)}
          </motion.div>
        </AnimatePresence>
        <div className="cinema-controls">
          <button type="button" onClick={() => move(-1)} aria-label={`Previous ${label}`}><ChevronLeft size={19} /></button>
          <button type="button" onClick={() => move(1)} aria-label={`Next ${label}`}><ChevronRight size={19} /></button>
          <span className="cinema-progress"><i style={{ width: `${((active + 1) / items.length) * 100}%` }} /></span>
        </div>
        <span className="cinema-footnote"><MoveUpRight size={13} /> Explore the collection</span>
      </div>
      <motion.div
        className="cinema-rail"
        aria-live="polite"
        drag={items.length > 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={handleSwipe}
      >
        {[-1, 0, 1].map((offset) => {
          const index = (safeActive + offset + items.length) % items.length
          const slide = items[index]
          const slideImage = getImage?.(slide)
          return <motion.button type="button" key={items.length > 2 ? (slide.id || slide.slug || slide.title || index) : `${index}-${offset}`} className={`cinema-image cinema-image-${offset === 0 ? 'active' : offset < 0 ? 'previous' : 'next'}`} onClick={() => setActive(index)} aria-label={`Show ${getTitle?.(slide) || slide.title || slide.name || `item ${index + 1}`}`} initial={false} animate={{ x: offset * 185, y: offset === 0 ? 0 : 10, rotate: offset * -3, scale: offset === 0 ? .96 : .78, opacity: offset === 0 ? 1 : .86, filter: offset === 0 ? 'blur(0px)' : 'blur(.15px)' }} transition={{ duration: reduceMotion ? 0 : .72, ease: [.22, .68, .24, 1] }}>
            {slideImage ? <img src={slideImage} alt="" loading="lazy" /> : <span className="cinema-image-placeholder">{(getTitle?.(slide) || slide.title || slide.name || 'MD').split(/\s+/).slice(0, 2).map((part) => part[0]).join('')}</span>}
            {offset === 0 && <span className="cinema-image-caption">{getTitle?.(slide) || slide.title || slide.name}</span>}
          </motion.button>
        })}
      </motion.div>
      <div className="cinema-detail-mobile">{renderDetails?.(item, safeActive, false)}</div>
    </section>
  )
}
