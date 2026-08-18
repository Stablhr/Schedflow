import { useEffect, useRef } from 'react'
import { LayoutGrid, Table, CalendarDays, GanttChartSquare, Map, Check, ArrowUpRight } from 'lucide-react'
import type { BoardViewType } from './BoardView'

const VIEWS: { id: BoardViewType; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'table', label: 'Table', icon: Table },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'timeline', label: 'Timeline', icon: GanttChartSquare },
  { id: 'map', label: 'Map', icon: Map },
]

interface ViewsMenuProps {
  open: boolean
  onClose: () => void
  activeView: BoardViewType
  onViewChange: (view: BoardViewType) => void
}

export default function ViewsMenu({ open, onClose, activeView, onViewChange }: ViewsMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open, onClose])

  if (!open) return null

  return (
    <div ref={ref} className="animate-in absolute right-0 top-11 z-30 w-52 rounded-xl glass p-1.5 shadow-md">
      <p className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-faint">
        View
      </p>
      {VIEWS.map((view) => {
        const Icon = view.icon
        const isActive = view.id === activeView
        return (
          <button
            key={view.id}
            type="button"
            onClick={() => {
              onViewChange(view.id)
              onClose()
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
              isActive
                ? 'font-semibold text-brand-dark bg-brand-light'
                : 'font-medium text-ink hover:bg-surface-alt'
            }`}
          >
            <Icon size={15} />
            <span className="flex-1">{view.label}</span>
            {isActive && <Check size={14} className="text-brand-dark" />}
          </button>
        )
      })}
    </div>
  )
}
