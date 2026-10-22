import { useEffect, useMemo, useState } from 'react'
import { X, RotateCcw, Check } from 'lucide-react'

export default function ImageCropDialog({ file, title, onCancel, onApply, aspectRatio = '1 / 1' }) {
  const [src, setSrc] = useState('')
  const [zoom, setZoom] = useState(1)
  const [x, setX] = useState(50)
  const [y, setY] = useState(50)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file); setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  const reset = () => { setZoom(1); setX(50); setY(50) }
  const apply = async () => {
    if (!src) return
    setBusy(true)
    try {
      const image = new Image(); image.src = src
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject })
      const [ratioW, ratioH] = String(aspectRatio).split('/').map((part) => Number(part.trim()))
      const canvas = document.createElement('canvas'); canvas.width = ratioW > 0 && ratioH > 0 ? 1600 : 900; canvas.height = ratioW > 0 && ratioH > 0 ? Math.round(1600 * ratioH / ratioW) : 900
      const width = canvas.width; const height = canvas.height
      const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Image crop is not supported in this browser.')
      const base = Math.max(width / image.naturalWidth, height / image.naturalHeight)
      const scale = base * zoom; const w = image.naturalWidth * scale; const h = image.naturalHeight * scale
      ctx.drawImage(image, (width - w) * x / 100, (height - h) * y / 100, w, h)
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', .9))
      if (!blob) throw new Error('Could not create the cropped image.')
      await onApply(new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-cropped.jpg`, { type: 'image/jpeg' }))
    } finally { setBusy(false) }
  }
  const previewStyle = useMemo(() => ({ transform: `translate(${(50-x)*.8}%, ${(50-y)*.8}%) scale(${zoom})` }), [x,y,zoom])
  if (!file) return null
  return <div className="crop-dialog-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onCancel() }}>
    <section className="crop-dialog" role="dialog" aria-modal="true" aria-label={title}>
      <header><div><p className="eyebrow">IMAGE EDITOR</p><h2>{title}</h2></div><button type="button" className="icon-button" onClick={onCancel} aria-label="Close crop editor"><X size={18}/></button></header>
      <p className="field-hint">Adjust zoom and image position. The crop will use the selected image ratio for your preview.</p>
      <div className="crop-stage"><div className="crop-window" style={{ aspectRatio }}>{src && <img src={src} alt="Crop preview" style={previewStyle}/>}</div></div>
      <div className="crop-controls"><label>Zoom <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label><label>Horizontal position <input type="range" min="0" max="100" value={x} onChange={e=>setX(Number(e.target.value))}/></label><label>Vertical position <input type="range" min="0" max="100" value={y} onChange={e=>setY(Number(e.target.value))}/></label></div>
      <footer><button type="button" className="button button-secondary button-sm" onClick={reset}><RotateCcw size={14}/> Reset</button><div><button type="button" className="button button-secondary button-sm" onClick={onCancel}>Cancel</button><button type="button" className="button button-primary button-sm" disabled={busy || !src} onClick={apply}>{busy ? 'Applying…' : <><Check size={14}/> Apply crop</>}</button></div></footer>
    </section>
  </div>
}
