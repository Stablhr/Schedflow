import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { BOARD_TEMPLATES } from '../../store/schema'
import { blendGradient } from '../../utils/color'
import { useStore } from '../../store/useStore'
import Modal from '../shared/Modal'

interface CreateBoardModalProps {
  open: boolean
  onClose: () => void
}

export default function CreateBoardModal({ open, onClose }: CreateBoardModalProps) {
  const { createBoard } = useStore()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(BOARD_TEMPLATES[0].id)
  const [name, setName] = useState('')

  const template = BOARD_TEMPLATES.find((t) => t.id === selected) ?? BOARD_TEMPLATES[0]

  const submit = () => {
    const boardName = name.trim() || template.name
    const boardId = createBoard(template.id, boardName)
    setName('')
    onClose()
    navigate(`/boards/${boardId}`)
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-md rounded-2xl sm:rounded-2xl">
      <div className="flex items-center justify-between px-6 pt-5">
        <h2 className="font-display text-[20px] font-bold text-ink">Create board</h2>
        <button type="button" onClick={onClose} className="text-ink-muted transition hover:text-ink">
          <X size={18} />
        </button>
      </div>

      <div className="scroll-slim max-h-[50vh] overflow-y-auto px-6 py-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BOARD_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setSelected(t.id)
                setName('')
              }}
              className={`relative rounded-xl p-2 text-left ring-1 transition ${
                selected === t.id
                  ? 'ring-2 ring-brand bg-brand-light/40'
                  : 'ring-border hover:bg-surface-alt'
              }`}
            >
              <span
                className="block h-9 rounded-lg"
                style={{ background: blendGradient(t.swatch) }}
              />
              <span className="mt-1.5 block truncate text-xs font-semibold text-ink">{t.name}</span>
              {selected === t.id && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                  <Check size={12} />
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-muted">{template.description}</p>

        <div className="mt-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Board title
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={template.name}
            autoFocus
            className="mt-1.5 w-full rounded-xl px-3 py-2 text-sm outline-none neu-input transition focus:neu-input-focus"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 px-6 pb-5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3.5 py-2 text-sm font-semibold text-ink-muted transition hover:bg-surface-alt"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark active:scale-95"
        >
          Create
        </button>
      </div>
    </Modal>
  )
}
