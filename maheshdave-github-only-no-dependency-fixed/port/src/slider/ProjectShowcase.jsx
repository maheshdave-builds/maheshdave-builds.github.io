
import { useState } from "react";
import { flushSync } from "react-dom";
import "./ProjectShowcase.css";

const project = {
  number: "01",
  title: "KINETIC",
  category: "CREATIVE DEVELOPMENT",
  description:
    "An experimental digital experience exploring motion, architecture, and the relationship between space and interaction.",
  tags: ["React", "Creative Coding", "Interaction Design"],
  image:
    "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1800&q=90",
};

export default function ProjectShowcase() {
  const [expanded, setExpanded] = useState(false);

  function toggleProject() {
    const update = () => {
      flushSync(() => setExpanded((value) => !value));
    };

    if (document.startViewTransition) {
      document.startViewTransition(update);
    } else {
      update();
    }
  }

  return (
    <main className="portfolio">
      <header className="portfolio__header">
        <span>SELECTED WORK</span>
        <span>PORTFOLIO — 2026</span>
      </header>

      <section className="project">
        <div className="project__details">
          <span className="project__eyebrow">
            {project.number} / {project.category}
          </span>

          <h1>{project.title}</h1>

          <p>{project.description}</p>

          <div className="project__tags">
            {project.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <button
            className="project__explore"
            onClick={toggleProject}
          >
            Explore project <span>↗</span>
          </button>
        </div>

        <button
          className="project__image-button"
          onClick={toggleProject}
          aria-label="Expand project image"
        >
          <img
            className="project__image"
            src={project.image}
            alt="Contemporary architectural project"
            style={{ viewTransitionName: "project-image" }}
          />
          <span className="project__image-hint">
            CLICK TO EXPLORE ↗
          </span>
        </button>
      </section>

      {expanded && (
        <section
          className="project-expanded"
          role="dialog"
          aria-modal="true"
          aria-label={`${project.title} project details`}
        >
          <header className="project-expanded__header">
            <span>PROJECT {project.number} — CASE STUDY</span>

            <button
              onClick={toggleProject}
              className="project-expanded__close"
              aria-label="Close project"
            >
              CLOSE <span>×</span>
            </button>
          </header>

          <div className="project-expanded__hero">
            <img
              src={project.image}
              alt="Expanded architectural project"
              style={{ viewTransitionName: "project-image" }}
            />
          </div>

          <div className="project-expanded__body">
            <span>{project.category}</span>
            <h2>{project.title}</h2>
            <p>{project.description}</p>

            <div className="project__tags">
              {project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            <button
              className="project__explore"
              onClick={toggleProject}
            >
              ← Back to projects
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
