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
    <Modal open onClose={onClose} className="max-w-md">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[17px] font-semibold text-text-primary">Archived cards</h2>
            <p className="mt-0.5 text-sm text-text-secondary">{board.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close archived cards"
            className="rounded-md p-1.5 text-text-secondary transition-colors duration-150 hover:bg-surface-alt hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 space-y-1.5">
          {cards.length === 0 && (
            <p className="rounded-md bg-surface-alt px-3 py-3 text-center text-xs text-text-muted">
              Nothing archived.
            </p>
          )}
          {cards.map((card) => (
            <div key={card.id} className="flex items-center gap-2 rounded-md bg-surface-alt px-3 py-2 sm:py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{card.title}</p>
                <p className="truncate font-mono text-[11px] text-text-secondary">
                  {data.lists[card.listId]?.name ?? 'Unknown list'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => restoreCard(card.id)}
                title="Restore to board"
                className="rounded-md p-1.5 text-primary-hover transition-colors duration-150 hover:bg-primary-subtle"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Permanently delete "${card.title}"?`)) deleteCard(card.id)
                }}
                title="Delete permanently"
                className="rounded-md p-1.5 text-text-muted transition-colors duration-150 hover:bg-danger-subtle hover:text-danger-text"
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
