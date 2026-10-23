import { useEffect, useRef } from 'react'

const REVEAL_THRESHOLD = 0.12

/**
 * Scroll-triggered entrance. Uses a single IntersectionObserver per element and
 * a CSS class transition rather than a JS animation loop, so scrolling stays
 * cheap on low-powered devices. The animation is expressed entirely in CSS so
 * `prefers-reduced-motion` and the theme's motion setting both disable it
 * without React re-rendering.
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  y = 18,
  className = '',
  once = false,
  ...rest
}) {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined
    if (typeof IntersectionObserver === 'undefined') {
      node.dataset.revealState = 'shown'
      return undefined
    }

    // Anything already above the fold is shown immediately, avoiding a flash of
    // hidden content when the observer's first callback is delayed.
    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.9) node.dataset.revealState = 'shown'
    else node.dataset.revealState = 'hidden'

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.dataset.revealState = 'shown'
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            entry.target.dataset.revealState = 'hidden'
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: REVEAL_THRESHOLD },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [once])

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`.trim()}
      style={{ '--reveal-delay': `${delay}ms`, '--reveal-y': `${y}px` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
