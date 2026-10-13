import { motion } from 'framer-motion'

export default function SectionHeading({ title, description, align = 'left' }) {
  const isCentered = align === 'center'

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`${isCentered ? 'mx-auto text-center' : 'text-left'} max-w-3xl`}
    >
      <h2 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
        <span className="animated-gradient-text">{title}</span>
      </h2>
      {description ? (
        <p className="mt-4 text-sm text-slate-300 sm:text-base">{description}</p>
      ) : null}
      <div className={`section-divider ${isCentered ? 'mx-auto' : ''}`} />
    </motion.div>
  )
}
