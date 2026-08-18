import { X, Check } from 'lucide-react'
import type { Board, Visibility } from '../../store/schema'
import { useStore } from '../../store/useStore'
import Modal from '../shared/Modal'

const OPTIONS: { value: Visibility; label: string; description: string }[] = [
  { value: 'private', label: 'Private', description: 'Only you can view this board.' },
  { value: 'workspace', label: 'Workspace', description: 'Visible to members of your local workspace.' },
  { value: 'public', label: 'Public', description: 'Anyone with the link can view this board.' },
]

export default function VisibilityModal({ board, onClose }: { board: Board; onClose: () => void }) {
  const setBoardVisibility = useStore().setBoardVisibility

  return (
    <Modal open onClose={onClose} solid className="max-w-md rounded-2xl shadow-lg">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Board visibility</h2>
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

        <div className="mt-5 space-y-2">
          {OPTIONS.map((option) => {
            const active = board.visibility === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setBoardVisibility(board.id, option.value)
                  onClose()
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left ring-1 transition ${
                  active ? 'bg-brand-light ring-brand' : 'ring-border hover:bg-surface-alt'
                }`}
              >
                <span className="flex-1">
                  <span className={`block text-sm font-semibold ${active ? 'text-brand-dark' : 'text-ink'}`}>
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{option.description}</span>
                </span>
                {active && <Check size={16} className="text-brand-dark" />}
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
