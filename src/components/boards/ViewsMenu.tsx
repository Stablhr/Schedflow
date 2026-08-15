import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, Table, CalendarDays, LayoutDashboard, GanttChartSquare, Map, Check, ArrowUpRight } from 'lucide-react'

const VIEWS = [
  { id: 'board', label: 'Board', icon: LayoutGrid, to: null as string | null },
  { id: 'table', label: 'Table', icon: Table, to: null },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, to: '/planner' },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: null },
  { id: 'timeline', label: 'Timeline', icon: GanttChartSquare, to: null },
  { id: 'map', label: 'Map', icon: Map, to: null },
]

export default function ViewsMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
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
    <div ref={ref} className="animate-in absolute right-0 top-11 z-30 w-52 rounded-xl bg-surface p-1.5 shadow-md ring-1 ring-border">
      <p className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-faint">
        View
      </p>
      {VIEWS.map((view) => {
        const Icon = view.icon
        const isActive = view.id === 'board'
        if (view.to) {
          return (
            <Link
              key={view.id}
              to={view.to}
              onClick={onClose}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink transition hover:bg-surface-alt"
            >
              <Icon size={15} className="text-ink-muted" />
              <span className="flex-1">{view.label}</span>
              <ArrowUpRight size={13} className="text-ink-faint" />
            </Link>
          )
        }
        return (
          <button
            key={view.id}
            type="button"
            onClick={onClose}
            disabled={!isActive}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
              isActive
                ? 'font-semibold text-brand-dark'
                : 'cursor-default font-medium text-ink-muted'
            } ${isActive ? 'bg-brand-light' : ''}`}
          >
            <Icon size={15} />
            <span className="flex-1">{view.label}</span>
            {isActive ? (
              <Check size={14} className="text-brand-dark" />
            ) : (
              <span className="font-mono text-[9.5px] text-ink-faint">soon</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
