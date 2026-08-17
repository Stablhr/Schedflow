import { useEffect, useRef, useState } from 'react'
import { X, ImageIcon, AlertTriangle } from 'lucide-react'
import type { Card, FileAttachment } from '../../store/schema'
import { COVER_COLORS } from '../../store/schema'
import { useStore } from '../../store/useStore'
import { uid } from '../../utils/id'
import { formatSize } from '../../utils/format'
import { MAX_FILE_SIZE } from './CardAttachments'

interface CoverPanelProps {
  card: Card
  open: boolean
  onClose: () => void
}

export default function CoverPanel({ card, open, onClose }: CoverPanelProps) {
  const store = useStore()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const imageCoverUrl = card.cover !== null && typeof card.cover !== 'string' ? card.cover.dataUrl : null
  const activeColor = typeof card.cover === 'string' ? card.cover : null
  const imageAttachments = card.files.filter((f) => f.type === 'image')

  const setCoverSize = (size: 'large' | 'small') => {
    store.updateCard(card.id, { coverSize: size })
    store.addActivity(card.id, 'changed cover size')
  }

  const removeCover = () => {
    store.updateCard(card.id, { cover: null, coverSize: 'small' })
    store.addActivity(card.id, 'removed the cover')
  }

  const setColorCover = (color: string) => {
    store.updateCard(card.id, { cover: color, coverSize: 'small' })
    store.addActivity(card.id, 'changed the cover')
  }

  const setImageCover = (attachment: FileAttachment) => {
    store.updateCard(card.id, {
      cover: { type: 'image', dataUrl: attachment.dataUrl },
    })
    store.addActivity(card.id, 'changed the cover image')
  }

  const uploadCover = (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setError(`"${file.name}" is ${formatSize(file.size)} — keep cover images under 2 MB.`)
      return
    }
    setUploading(true)
    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const attachment: FileAttachment = {
        id: uid(),
        name: file.name,
        type: 'image',
        dataUrl,
        size: file.size,
        addedAt: new Date().toISOString(),
      }
      store.updateCard(card.id, {
        files: [...card.files, attachment],
        cover: { type: 'image', dataUrl },
        coverSize: card.coverSize || 'small',
      })
      store.addActivity(card.id, `attached ${file.name} as cover`)
      setUploading(false)
    }
    reader.onerror = () => setUploading(false)
    reader.readAsDataURL(file)
  }

  const sectionTitle =
    'text-[11px] font-bold uppercase tracking-wider text-ink-faint'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="animate-in fixed right-0 top-0 z-40 flex h-full w-80 flex-col bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
          <h2 className="font-display text-lg font-bold text-ink">Cover</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-faint transition hover:bg-surface-alt hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="scroll-slim flex-1 overflow-y-auto p-4 space-y-5">
          {/* Size */}
          <section>
            <p className={sectionTitle}>Size</p>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setCoverSize('large')}
                className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition active:scale-95 ${
                  card.coverSize === 'large'
                    ? 'ring-2 ring-brand bg-brand-light'
                    : 'ring-1 ring-border hover:ring-brand/40'
                }`}
              >
                <div className="h-16 w-12 rounded-lg bg-surface-alt overflow-hidden">
                  {imageCoverUrl ? (
                    <img src={imageCoverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{ background: activeColor ?? 'linear-gradient(135deg, #0DABA3, #0A8981)' }}
                    />
                  )}
                </div>
                <span className="text-[11px] font-semibold text-ink-muted">Large</span>
              </button>
              <button
                type="button"
                onClick={() => setCoverSize('small')}
                className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition active:scale-95 ${
                  card.coverSize === 'small'
                    ? 'ring-2 ring-brand bg-brand-light'
                    : 'ring-1 ring-border hover:ring-brand/40'
                }`}
              >
                <div className="h-4 w-12 rounded-lg overflow-hidden">
                  {imageCoverUrl ? (
                    <img src={imageCoverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{ background: activeColor ?? '#0DABA3' }}
                    />
                  )}
                </div>
                <span className="text-[11px] font-semibold text-ink-muted">Small</span>
              </button>
            </div>
          </section>

          {/* Remove cover */}
          {card.cover && (
            <button
              type="button"
              onClick={removeCover}
              className="flex items-center gap-1.5 text-xs font-semibold text-ink-faint transition hover:text-danger"
            >
              <X size={12} />
              Remove cover
            </button>
          )}

          {/* Colors */}
          <section>
            <p className={sectionTitle}>Colors</p>
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {COVER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  title="Set cover color"
                  onClick={() => setColorCover(color)}
                  className={`h-7 rounded-md transition hover:scale-110 active:scale-95 ${
                    activeColor === color ? 'ring-2 ring-ink ring-offset-1' : ''
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </section>

          {/* Attachments */}
          <section>
            <p className={sectionTitle}>Attachments</p>
            {imageAttachments.length === 0 ? (
              <p className="mt-2 text-xs text-ink-faint">No image attachments yet.</p>
            ) : (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {imageAttachments.map((att) => {
                  const isActiveCover =
                    imageCoverUrl !== null && imageCoverUrl === att.dataUrl
                  return (
                    <button
                      key={att.id}
                      type="button"
                      title={att.name}
                      onClick={() => setImageCover(att)}
                      className={`relative aspect-square overflow-hidden rounded-lg transition active:scale-95 ${
                        isActiveCover
                          ? 'ring-2 ring-brand ring-offset-1'
                          : 'ring-1 ring-border hover:ring-brand/40'
                      }`}
                    >
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        className="h-full w-full object-cover"
                      />
                      {isActiveCover && (
                        <span className="absolute bottom-0.5 left-0.5 rounded bg-brand px-1 py-0.5 text-[9px] font-bold text-white">
                          Cover
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* Upload */}
          <section>
            <p className={sectionTitle}>Upload a cover image</p>
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
                uploadCover(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </section>
        </div>
      </aside>
    </>
  )
}
