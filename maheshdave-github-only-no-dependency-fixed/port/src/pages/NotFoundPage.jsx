import { ArrowLeft, Compass } from 'lucide-react'
import { Link } from '../lib/RouterLink'
import { useSeo } from '../lib/useSeo'

export default function NotFoundPage() {
  useSeo({
    title: 'Page not found — Mahesh Dave',
    description: 'The page you were looking for does not exist.',
    noindex: true,
  })

  return (
    <main id="main" className="notfound">
      <span className="notfound-code" aria-hidden="true">
        404
      </span>
      <Compass size={26} aria-hidden="true" />
      <h1>This page went off-site</h1>
      <p>The address may be mistyped, or the page may have moved. The portfolio and its published notes are still here.</p>
      <div className="notfound-actions">
        <Link className="button button-primary" to="/">
          <ArrowLeft size={16} aria-hidden="true" /> Back to portfolio
        </Link>
        <Link className="button button-secondary" to="/#blog">
          Read the notes
        </Link>
      </div>
    </main>
  )
}
