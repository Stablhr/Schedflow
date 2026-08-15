import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, ChevronsLeft, ChevronsRight, Trash2, UserPlus } from 'lucide-react'
import type { List } from '../../store/schema'
import { useStore } from '../../store/useStore'

export default function ListMenu({ list }: { list: List }) {
  const { toggleListCollapsed, deleteList, setListAssignee } = useStore()
  const [open, setOpen] = useState(false)
  const [assignee, setAssignee] = useState(list.assignee)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const menuItemClass =
    'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-ink transition hover:bg-surface-alt'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="List actions"
        className="flex h-6 w-6 items-center justify-center rounded-md text-ink-faint transition hover:bg-surface-alt hover:text-ink"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div className="animate-in absolute right-0 top-8 z-20 w-56 rounded-xl bg-surface p-1.5 shadow-md ring-1 ring-border">
          <button type="button" className={menuItemClass} onClick={() => {
            toggleListCollapsed(list.id)
            setOpen(false)
          }}>
            {list.collapsed ? <ChevronsRight size={15} className="text-ink-muted" /> : <ChevronsLeft size={15} className="text-ink-muted" />}
            {list.collapsed ? 'Expand list' : 'Collapse list'}
          </button>

          <div className="my-1 h-px bg-border" />

          <div className="flex items-center gap-2 px-2.5 py-1.5">
            <UserPlus size={15} className="shrink-0 text-ink-muted" />
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setListAssignee(list.id, assignee.trim())
                  setOpen(false)
                }
              }}
              placeholder="Assignee"
              className="w-full rounded-md px-1 py-0.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:bg-surface-alt"
            />
          </div>

          <div className="my-1 h-px bg-border" />

          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-danger transition hover:bg-danger-light"
            onClick={() => {
              if (window.confirm(`Delete the "${list.name}" list and all of its cards?`)) {
                deleteList(list.id)
              }
              setOpen(false)
            }}
          >
            <Trash2 size={15} />
            Delete list
          </button>
        </div>
      )}
    </div>
  )
}
