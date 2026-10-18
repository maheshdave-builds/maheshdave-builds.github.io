import { useEffect } from 'react'

/** Small theme-coloured cursor halo; leaves the native pointer and touch UX intact. */
export default function ThemeCursor() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const cursor = document.createElement('span')
    cursor.className = 'theme-cursor-halo'
    cursor.setAttribute('aria-hidden', 'true')
    document.body.appendChild(cursor)
    let frame = 0
    let x = -80
    let y = -80
    const move = (event) => {
      x = event.clientX
      y = event.clientY
      if (!frame) frame = requestAnimationFrame(() => {
        cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
        frame = 0
      })
      cursor.classList.toggle('is-interactive', Boolean(event.target?.closest?.('a, button, input, textarea, select, summary, [role="button"]')))
    }
    const leave = () => cursor.classList.add('is-away')
    const enter = () => cursor.classList.remove('is-away')
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    document.addEventListener('pointerenter', enter)
    return () => {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      document.removeEventListener('pointerenter', enter)
      if (frame) cancelAnimationFrame(frame)
      cursor.remove()
    }
  }, [])
  return null
}
