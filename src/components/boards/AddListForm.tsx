import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useStore } from '../../store/useStore'

export default function AddListForm({ boardId }: { boardId: string }) {
  const addList = useStore().addList
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const submit = () => {
    const n = name.trim()
    if (!n) return
    addList(boardId, n)
    setName('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-[272px] shrink-0 items-center gap-2 rounded-xl bg-surface/70 px-3 py-2.5 text-sm font-semibold text-ink-muted transition hover:bg-brand-light hover:text-brand-dark hover-grow"
      >
        <Plus size={16} />
        Add another list
      </button>
    )
  }

  return (
    <div className="w-[272px] shrink-0 rounded-xl bg-surface p-2 shadow-sm">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') setOpen(false)
        }}
        placeholder="List name"
        autoFocus
        className="w-full rounded-lg px-2 py-1.5 text-sm outline-none ring-1 ring-border transition focus:ring-2 focus:ring-brand"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark active:scale-95"
        >
          Add list
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-ink-muted transition hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
