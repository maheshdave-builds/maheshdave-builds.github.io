import { motion } from 'framer-motion'

export default function GradientButton({
  children,
  href,
  type = 'button',
  variant = 'solid',
  className = '',
}) {
  const baseClass =
    'inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300'
  const variantClass =
    variant === 'outline'
      ? 'border border-cyan-300/55 bg-slate-950/30 text-cyan-100 hover:border-fuchsia-300/65 hover:text-white hover:shadow-[0_0_28px_rgba(236,72,153,0.25)]'
      : 'gradient-button text-white shadow-[0_0_30px_rgba(56,189,248,0.35)] hover:shadow-[0_0_38px_rgba(236,72,153,0.4)]'
  const classes = `${baseClass} ${variantClass} ${className}`.trim()

  const motionProps = {
    whileHover: { y: -2, scale: 1.01 },
    whileTap: { scale: 0.98 },
    transition: { type: 'spring', stiffness: 280, damping: 18 },
    className: classes,
  }

  if (href) {
    return (
      <motion.a href={href} {...motionProps}>
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button type={type} {...motionProps}>
      {children}
    </motion.button>
  )
}
