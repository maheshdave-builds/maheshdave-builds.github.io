import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import SectionHeading from '../components/SectionHeading'

export default function TestimonialsSection({ testimonials, sectionContent }) {
  return (
    <section id="testimonials" className="section-shell">
      <div className="container-shell">
        <SectionHeading title={sectionContent.title} description={sectionContent.description} />

        <motion.div
          className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {testimonials.map((testimonial) => (
            <motion.article
              key={testimonial.name}
              className="gradient-border-card rounded-2xl p-6"
              variants={{
                hidden: { opacity: 0, x: 30 },
                show: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                },
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{testimonial.name}</p>
                    <p className="text-xs text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
                <span className="icon-orb h-9 w-9">
                  <Quote className="h-4 w-4 text-cyan-100" />
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-300">"{testimonial.feedback}"</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
