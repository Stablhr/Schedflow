import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Share2, Eye, Tag, Archive, Palette, Trash2 } from 'lucide-react'
import type { Board } from '../../store/schema'
import { BOARD_BACKGROUNDS, COLOR_THEMES } from '../../store/schema'
import { blendTwoStop } from '../../utils/color'
import { useStore } from '../../store/useStore'
import ShareModal from './ShareModal'
import VisibilityModal from './VisibilityModal'
import LabelsModal from './LabelsModal'
import ArchivedPanel from './ArchivedPanel'

type DrawerModal = 'share' | 'visibility' | 'labels' | 'archived' | null

export default function BoardMenuDrawer({
  board,
  open,
  onClose,
}: {
  board: Board
  open: boolean
  onClose: () => void
}) {
  const { data, setBoardBackground, setBoardDescription, resetAll } = useStore()
  const navigate = useNavigate()
  const [modal, setModal] = useState<DrawerModal>(null)
  const [desc, setDesc] = useState(board.description)

  useEffect(() => {
    if (open) setDesc(board.description)
  }, [open, board.description])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const archivedCount = Object.values(data.cards).filter(
    (c) => c.boardId === board.id && c.archived,
  ).length

  const menuItem =
    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink transition hover:bg-surface-alt'

  const handleReset = () => {
    if (
      window.confirm(
        'Reset ALL app data? This clears every board, card, and inbox item on this device. This cannot be undone.',
      )
    ) {
      resetAll()
      navigate('/')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-md" onClick={onClose} />
      <aside className="animate-in fixed bottom-0 right-0 top-0 z-40 flex w-full flex-col glass-heavy shadow-lg sm:bottom-auto sm:w-72">
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
          <h2 className="font-display text-lg font-bold text-ink">Menu</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-faint transition hover:bg-surface-alt hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="scroll-slim flex-1 overflow-y-auto p-4">
          <section>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">About</p>
            <textarea
              value={desc}
              onChange={(e) => {
                setDesc(e.target.value)
                setBoardDescription(board.id, e.target.value)
              }}
              rows={3}
              placeholder="Add a description…"
              className="mt-2 w-full resize-none rounded-lg px-2.5 py-2 text-sm leading-relaxed text-ink outline-none ring-1 ring-border transition placeholder:text-ink-faint focus:ring-2 focus:ring-brand"
            />
          </section>

          <section className="mt-5 space-y-0.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Actions</p>
            <button type="button" className={menuItem} onClick={() => setModal('share')}>
              <Share2 size={15} className="text-ink-muted" />
              Share board
            </button>
            <button type="button" className={menuItem} onClick={() => setModal('visibility')}>
              <Eye size={15} className="text-ink-muted" />
              Visibility
            </button>
            <button type="button" className={menuItem} onClick={() => setModal('labels')}>
              <Tag size={15} className="text-ink-muted" />
              Labels
            </button>
            <button type="button" className={menuItem} onClick={() => setModal('archived')}>
              <Archive size={15} className="text-ink-muted" />
              Archived items
              <span className="ml-auto rounded-full bg-surface-alt px-1.5 py-0.5 font-mono text-[10.5px] text-ink-muted">
                {archivedCount}
              </span>
            </button>
          </section>

          <section className="mt-5">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              <Palette size={12} />
              Color Themes
            </p>
            <div className="mt-2 space-y-2">
              {COLOR_THEMES.map((theme) => {
                const gradient = blendTwoStop(theme.primary, theme.secondary)
                const isActive = board.background === gradient
                return (
                  <button
                    key={theme.id}
                    type="button"
                    title={theme.name}
                    onClick={() => setBoardBackground(board.id, gradient)}
                    className={`flex w-full items-center gap-3 rounded-lg p-2 transition ${
                      isActive ? 'ring-2 ring-brand' : 'ring-1 ring-black/10 hover:ring-black/20'
                    }`}
                  >
                    <div
                      className="h-8 w-8 shrink-0 rounded-lg"
                      style={{ background: gradient }}
                    />
                    <span className="text-sm font-medium text-ink">{theme.name}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="mt-5">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              <Palette size={12} />
              Solid Background
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {BOARD_BACKGROUNDS.map((color) => (
                <button
                  key={color}
                  type="button"
                  title="Set background"
                  onClick={() => setBoardBackground(board.id, color)}
                  className={`h-6 w-6 rounded-md transition hover:scale-110 ${
                    board.background === color ? 'ring-2 ring-ink' : 'ring-1 ring-black/10'
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </section>

          <div className="my-5 h-px bg-border" />

          <button
            type="button"
            onClick={handleReset}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-danger transition hover:bg-danger-light"
          >
            <Trash2 size={15} />
            Reset all data
          </button>
        </div>
      </aside>

      {modal === 'share' && <ShareModal board={board} onClose={() => setModal(null)} />}
      {modal === 'visibility' && <VisibilityModal board={board} onClose={() => setModal(null)} />}
      {modal === 'labels' && <LabelsModal board={board} onClose={() => setModal(null)} />}
      {modal === 'archived' && <ArchivedPanel board={board} onClose={() => setModal(null)} />}
    </>
  )
}
