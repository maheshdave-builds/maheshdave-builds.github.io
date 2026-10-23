import { useRouter } from './routerCore'

/**
 * Anchor that navigates through the in-app router while remaining a real link:
 * middle-click, copy-link and open-in-new-tab all behave normally. Same-page
 * hash links scroll without a history entry so the back button is not polluted.
 */
export function Link({ to, replace = false, scroll = true, children, onClick, ...rest }) {
  const { navigate } = useRouter()

  const handleClick = (event) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return

    // A plain hash on the current page: let the browser scroll, update the URL
    // without stacking history entries for every section jump.
    const isHashOnly = to.startsWith('#')
    if (isHashOnly) {
      event.preventDefault()
      const id = to.slice(1)
      const target = document.getElementById(id)
      if (target) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
        window.history.replaceState(null, '', to)
      } else {
        navigate(`/${to}`, { replace: true })
      }
      return
    }

    if (to.startsWith('http') || to.startsWith('mailto:')) return
    event.preventDefault()
    navigate(to, { replace })
    // Route-level scroll handling resolves hash targets after the destination renders.
    // Do not immediately scroll to the top for links such as /#contact.
    const hasHashTarget = Boolean(new URL(to, window.location.origin).hash)
    if (scroll && !hasHashTarget) window.scrollTo({ top: 0, behavior: 'auto' })
  }

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}
