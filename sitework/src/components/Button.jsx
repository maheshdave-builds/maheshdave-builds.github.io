import { ArrowUpRight } from 'lucide-react'
import { Link } from '../lib/RouterLink'

/**
 * Button and link primitives. `to` renders an in-app navigation; `href` renders
 * a normal anchor (external links get rel="noreferrer"). Anything with an on-
 * click and no destination renders a button, so a control never looks actionable
 * without being actionable.
 */
export function Button({
  children,
  to,
  href,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'end',
  type = 'button',
  className = '',
  ...rest
}) {
  const classes = `button button-${variant} button-${size} ${className}`.trim()
  const Icon = icon
  const content = (
    <>
      {Icon && iconPosition === 'start' ? <Icon size={size === 'sm' ? 14 : 16} aria-hidden="true" /> : null}
      <span>{children}</span>
      {Icon && iconPosition === 'end' ? <Icon size={size === 'sm' ? 14 : 16} aria-hidden="true" /> : null}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }
  if (href) {
    const external = /^https?:/i.test(href)
    return (
      <a
        href={href}
        className={classes}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        {...rest}
      >
        {content}
      </a>
    )
  }
  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  )
}

export function TextLink({ href, to, children, className = '', icon = ArrowUpRight, external }) {
  const Icon = icon
  const isExternal = external ?? (href ? /^https?:/i.test(href) : false)
  const classes = `text-link ${className}`.trim()

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
        {Icon ? <Icon size={15} aria-hidden="true" /> : null}
      </Link>
    )
  }
  return (
    <a
      href={href}
      className={classes}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
    >
      {children}
      {Icon ? <Icon size={15} aria-hidden="true" /> : null}
    </a>
  )
}

