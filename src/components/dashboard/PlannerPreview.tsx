import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { addDays, startOfWeek, toISODate } from '../../utils/dates'

export default function PlannerPreview() {
  const { data } = useStore()

  const weekStart = startOfWeek()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const countFor = (date: Date) =>
    Object.values(data.cards).filter(
      (c) => !c.archived && c.dueDate === toISODate(date),
    ).length

  return (
    <div className="rounded-xl glass-subtle p-4 shadow-sm">
      <div className="flex items-center gap-1.5">
        <CalendarDays size={14} className="text-brand" />
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          This week
        </h2>
        <Link
          to="/planner"
          className="ml-auto text-xs font-semibold text-brand hover:underline"
        >
          Open planner
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const count = countFor(day)
          const dayLetter = day.toLocaleDateString('en-US', { weekday: 'narrow' })
          return (
            <Link
              key={toISODate(day)}
              to="/planner"
              title={`${count} card${count === 1 ? '' : 's'} on ${day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}
              className={`flex flex-col items-center rounded-lg px-1 py-2 transition hover:bg-brand-light ${
                count > 0 ? 'bg-brand-light/60' : 'bg-bg'
              }`}
            >
              <span className="text-[10px] font-bold uppercase text-ink-faint">{dayLetter}</span>
              <span className="font-display text-sm font-bold text-ink">{day.getDate()}</span>
              <span
                className={`mt-1 h-1.5 w-1.5 rounded-full ${count > 0 ? 'bg-brand' : 'bg-ink-faint/30'}`}
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
