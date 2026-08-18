import { X, RotateCcw, Trash2 } from 'lucide-react'
import type { Board } from '../../store/schema'
import { useStore } from '../../store/useStore'
import Modal from '../shared/Modal'

export default function ArchivedPanel({ board, onClose }: { board: Board; onClose: () => void }) {
  const { data, restoreCard, deleteCard } = useStore()

  const cards = Object.values(data.cards).filter(
    (c) => c.boardId === board.id && c.archived,
  )

  return (
    <Modal open onClose={onClose} solid className="max-w-md rounded-2xl shadow-lg">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Archived cards</h2>
            <p className="mt-0.5 text-sm text-ink-muted">{board.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-faint transition hover:bg-surface-alt hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 space-y-1.5">
          {cards.length === 0 && (
            <p className="rounded-lg bg-bg px-3 py-3 text-center text-xs text-ink-faint">
              Nothing archived.
            </p>
          )}
          {cards.map((card) => (
            <div key={card.id} className="flex items-center gap-2 rounded-xl bg-bg px-3 py-2 sm:py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{card.title}</p>
                <p className="truncate text-[11px] text-ink-muted">
                  {data.lists[card.listId]?.name ?? 'Unknown list'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => restoreCard(card.id)}
                title="Restore to board"
                className="rounded-lg p-1.5 text-brand transition hover:bg-brand-light"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Permanently delete "${card.title}"?`)) deleteCard(card.id)
                }}
                title="Delete permanently"
                className="rounded-lg p-1.5 text-ink-faint transition hover:bg-danger-light hover:text-danger"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
