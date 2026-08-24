import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Share2, Eye, Tag, Archive, Trash2 } from 'lucide-react'
import type { Board } from '../../store/schema'
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
  const { data, setBoardDescription, resetAll, deleteBoard } = useStore()
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
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-text-primary transition-colors duration-150 hover:bg-surface-alt'

  const handleDeleteBoard = () => {
    if (window.confirm(`Delete "${board.name}"? All lists and cards on it will be removed. This cannot be undone.`)) {
      deleteBoard(board.id)
      navigate('/boards')
    }
  }

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
      <div className="fixed inset-0 z-40 bg-[#0f1a19]/50" onClick={onClose} />
      <aside className="animate-in fixed bottom-0 right-0 top-0 z-40 flex w-full flex-col border-l border-border bg-surface-elevated shadow-medium sm:bottom-auto sm:w-72">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-text-primary">Menu</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-text-secondary transition-colors duration-150 hover:bg-surface-alt hover:text-text-primary focus-visible:outline-2 focus-visible:outline-brand"
          >
            <X size={16} />
          </button>
        </div>

        <div className="scroll-slim flex-1 overflow-y-auto p-4">
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">About</p>
            <textarea
              value={desc}
              onChange={(e) => {
                setDesc(e.target.value)
                setBoardDescription(board.id, e.target.value)
              }}
              rows={3}
              placeholder="Add a description…"
              className="mt-2 w-full resize-none rounded-md border border-border-strong bg-surface px-2.5 py-2 text-sm leading-relaxed text-text-primary outline-none transition-colors duration-150 placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </section>

          <section className="mt-5 space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">Actions</p>
            <button type="button" className={menuItem} onClick={() => setModal('share')}>
              <Share2 size={15} className="text-text-secondary" />
              Share board
            </button>
            <button type="button" className={menuItem} onClick={() => setModal('visibility')}>
              <Eye size={15} className="text-text-secondary" />
              Visibility
            </button>
            <button type="button" className={menuItem} onClick={() => setModal('labels')}>
              <Tag size={15} className="text-text-secondary" />
              Labels
            </button>
            <button type="button" className={menuItem} onClick={() => setModal('archived')}>
              <Archive size={15} className="text-text-secondary" />
              Archived items
              <span className="ml-auto rounded-full bg-surface-alt px-1.5 py-0.5 font-mono text-[10.5px] text-text-secondary">
                {archivedCount}
              </span>
            </button>
          </section>

          <div className="my-5 h-px bg-border" />

          <button
            type="button"
            onClick={handleDeleteBoard}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-danger-text transition-colors duration-150 hover:bg-danger-subtle"
          >
            <Trash2 size={15} />
            Delete board
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="mt-0.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-danger-text transition-colors duration-150 hover:bg-danger-subtle"
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
