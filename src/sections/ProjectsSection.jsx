import { motion } from 'framer-motion'
import { ArrowUpRight, Github } from 'lucide-react'
import SectionHeading from '../components/SectionHeading'

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function ProjectsSection({ projectItems, sectionContent }) {
  return (
    <section id="projects" className="section-shell">
      <div className="container-shell">
        <SectionHeading title={sectionContent.title} description={sectionContent.description} />

        <motion.div
          className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.18 }}
        >
          {projectItems.map((project) => (
            <motion.article
              key={project.title}
              variants={cardVariants}
              whileHover={{ y: -6, scale: 1.01 }}
              className="group project-card"
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              </div>
              <div className="space-y-4 p-6">
                <h3 className="text-xl font-semibold text-slate-100">{project.title}</h3>
                <p className="text-sm text-slate-300">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <span
                      key={`${project.title}-${tech}`}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 pt-2 text-sm">
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-200 transition hover:text-cyan-100"
                  >
                    Live Demo
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-200 transition hover:text-white"
                  >
                    GitHub
                    <Github className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
