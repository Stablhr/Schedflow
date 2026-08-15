import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { Board } from '../../store/schema'
import { LABEL_SWATCHES } from '../../store/schema'
import { useStore } from '../../store/useStore'
import Modal from '../shared/Modal'

export default function LabelsModal({ board, onClose }: { board: Board; onClose: () => void }) {
  const { addLabel, updateLabel, deleteLabel } = useStore()
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<string>(LABEL_SWATCHES[0].color)

  const labels = Object.values(board.labels ?? {})

  const add = () => {
    const name = newName.trim()
    if (!name) return
    addLabel(board.id, name, newColor)
    setNewName('')
  }

  const inputClass =
    'w-full rounded-lg px-2 py-1 text-sm text-ink outline-none ring-1 ring-border transition focus:ring-2 focus:ring-brand'

  return (
    <Modal open onClose={onClose} className="max-w-md rounded-2xl bg-surface shadow-lg">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Labels</h2>
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
          {labels.length === 0 && (
            <p className="rounded-lg bg-bg px-3 py-2.5 text-xs text-ink-faint">
              No labels yet — add your first one below.
            </p>
          )}
          {labels.map((label) => (
            <div key={label.id} className="flex items-center gap-2">
              <select
                value={label.color}
                onChange={(e) => updateLabel(board.id, label.id, { color: e.target.value })}
                title="Label color"
                className="h-8 w-10 shrink-0 cursor-pointer rounded-lg px-0 text-transparent"
                style={{ background: label.color }}
              >
                {LABEL_SWATCHES.map((s) => (
                  <option key={s.color} value={s.color}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                value={label.name}
                onChange={(e) => updateLabel(board.id, label.id, { name: e.target.value })}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete the "${label.name}" label?`)) deleteLabel(board.id, label.id)
                }}
                title="Delete label"
                className="shrink-0 rounded-lg p-1.5 text-ink-faint transition hover:bg-danger-light hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Add a label
          </p>
          <div className="mt-2 flex items-end gap-2">
            <div className="flex-1">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                placeholder="Label name"
                className={`w-full ${inputClass}`}
              />
            </div>
            <div className="flex gap-1">
              {LABEL_SWATCHES.map((s) => (
                <button
                  key={s.color}
                  type="button"
                  title={s.name}
                  onClick={() => setNewColor(s.color)}
                  className={`h-6 w-6 rounded-md transition hover:scale-110 ${
                    newColor === s.color ? 'ring-2 ring-ink' : ''
                  }`}
                  style={{ background: s.color }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={add}
              disabled={!newName.trim()}
              className="flex h-9 items-center gap-1 rounded-lg bg-brand px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark active:scale-95 disabled:opacity-40"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
