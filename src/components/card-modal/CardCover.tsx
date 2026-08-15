import { useRef, useState } from 'react'
import { ImageIcon, X, AlertTriangle } from 'lucide-react'
import type { Card } from '../../store/schema'
import { COVER_COLORS } from '../../store/schema'
import { useStore } from '../../store/useStore'
import { formatSize } from '../../utils/format'
import SectionLabel from '../shared/SectionLabel'
import { MAX_FILE_SIZE } from './CardAttachments'

export default function CardCover({ card }: { card: Card }) {
  const { updateCard, addActivity } = useStore()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const setColorCover = (color: string) => {
    updateCard(card.id, { cover: color })
    addActivity(card.id, 'changed the cover')
  }

  const setImageCover = (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setError(`"${file.name}" is ${formatSize(file.size)} — keep cover images under 2 MB.`)
      return
    }
    setUploading(true)
    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      updateCard(card.id, { cover: { type: 'image', dataUrl: reader.result as string } })
      addActivity(card.id, 'changed the cover image')
      setUploading(false)
    }
    reader.onerror = () => setUploading(false)
    reader.readAsDataURL(file)
  }

  return (
    <section>
      <SectionLabel icon={<ImageIcon size={14} />}>Cover</SectionLabel>

      <div className="mt-2">
        {card.cover && (
          <button
            type="button"
            onClick={() => {
              updateCard(card.id, { cover: null })
              addActivity(card.id, 'removed the cover')
            }}
            className="mb-2 flex items-center gap-1 text-xs font-semibold text-ink-faint transition hover:text-danger"
          >
            <X size={12} />
            Remove cover
          </button>
        )}

        <div className="grid grid-cols-5 gap-1.5">
          {COVER_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              title="Set cover color"
              onClick={() => setColorCover(color)}
              className="h-6 rounded-md transition hover:scale-110 active:scale-95"
              style={{ background: color }}
            />
          ))}
        </div>

        {error && (
          <p className="animate-in mt-2 flex items-center gap-1.5 rounded-lg bg-danger-light px-3 py-2 text-xs font-medium text-danger">
            <AlertTriangle size={14} className="shrink-0" />
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-surface-alt px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-brand-light hover:text-brand-dark active:scale-95 disabled:opacity-40"
        >
          <ImageIcon size={13} />
          {uploading ? 'Uploading…' : 'Upload image'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            setImageCover(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
    </section>
  )
}
