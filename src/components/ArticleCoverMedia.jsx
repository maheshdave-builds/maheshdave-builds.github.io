import { articleHasUploadedCover, getArticlePlaceholderSvgMarkup } from '../lib/articleImages'

/**
 * Uploaded cover uses <img>; default cover uses inline animated SVG (CSS motion does not run in <img src="data:...">).
 */
export default function ArticleCoverMedia({
  article,
  className = '',
  imgClassName = '',
  placeholderClassName = 'article-cover-placeholder',
  alt = '',
  loading = 'lazy',
  decoding = 'async',
  width,
  height,
}) {
  const mergedImgClass = [className, imgClassName].filter(Boolean).join(' ') || undefined

  if (articleHasUploadedCover(article)) {
    return (
      <img
        className={mergedImgClass}
        src={article.cover_image_url}
        alt={alt}
        loading={loading}
        decoding={decoding}
        width={width}
        height={height}
      />
    )
  }

  return (
    <span
      className={[placeholderClassName, className, 'is-animated-cover'].filter(Boolean).join(' ')}
      role="img"
      aria-label={alt || undefined}
      dangerouslySetInnerHTML={{ __html: getArticlePlaceholderSvgMarkup(article) }}
    />
  )
}
