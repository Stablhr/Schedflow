import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, ChevronsLeft, ChevronsRight, Trash2, UserPlus, Palette } from 'lucide-react'
import type { List } from '../../store/schema'
import { useStore } from '../../store/useStore'
import { useAdaptiveTheme } from '../../hooks/useAdaptiveTheme'

const LIST_COLORS = [
  '', '#FFFFFF', '#0DABA3', '#33B27A', '#FF8B5E', '#F6C453',
  '#FF5E6C', '#7C5CFC', '#3B82F6', '#E879F9',
]

export default function ListMenu({ list }: { list: List }) {
  const { toggleListCollapsed, deleteList, setListAssignee, setListBackgroundColor } = useStore()
  const [open, setOpen] = useState(false)
  const [assignee, setAssignee] = useState(list.assignee)
  const ref = useRef<HTMLDivElement>(null)

  const bg = list.backgroundColor || '#FFFFFF'
  const theme = useAdaptiveTheme(bg)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="List actions"
        className="flex h-6 w-6 items-center justify-center rounded-md transition"
        style={{ color: 'var(--surface-text-muted)' }}
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div
          className="animate-in absolute right-0 top-8 z-20 w-56 rounded-xl p-1.5 shadow-md ring-1"
          style={{ background: theme.foreground === '#FFFFFF' ? '#1a2c2b' : '#FFFFFF', borderColor: theme.border, color: theme.foreground === '#FFFFFF' ? '#e0f0ef' : '#132A29' }}
        >
          <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium transition hover:bg-white/10" onClick={() => {
            toggleListCollapsed(list.id)
            setOpen(false)
          }}>
            {list.collapsed ? <ChevronsRight size={15} className="opacity-60" /> : <ChevronsLeft size={15} className="opacity-60" />}
            {list.collapsed ? 'Expand list' : 'Collapse list'}
          </button>

          <div className="my-1 h-px bg-white/10" />

          <div className="flex items-center gap-2 px-2.5 py-1.5">
            <UserPlus size={15} className="shrink-0 opacity-60" />
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
              className="w-full rounded-md bg-white/10 px-1 py-0.5 text-sm outline-none placeholder:text-white/40"
            />
          </div>

          <div className="my-1 h-px bg-white/10" />

          <div className="px-2.5 py-2">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-40">
              <Palette size={12} />
              List color
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {LIST_COLORS.map((color) => (
                <button
                  key={color || 'default'}
                  type="button"
                  title={color ? 'Set list color' : 'Reset to default'}
                  onClick={() => {
                    setListBackgroundColor(list.id, color)
                  }}
                  className={`h-6 rounded-md ring-2 ring-white transition hover:scale-110 active:scale-95 ${
                    list.backgroundColor === color ? 'ring-brand ring-offset-1' : ''
                  }`}
                  style={{ background: color || '#FFFFFF' }}
                />
              ))}
            </div>
          </div>

          <div className="my-1 h-px bg-white/10" />

          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-red-400 transition hover:bg-red-500/20"
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
