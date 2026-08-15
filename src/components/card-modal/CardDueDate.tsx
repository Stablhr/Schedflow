import { useState } from 'react'
import { CalendarDays, X } from 'lucide-react'
import type { Card } from '../../store/schema'
import { useStore } from '../../store/useStore'
import { formatDate } from '../../utils/dates'
import SectionLabel from '../shared/SectionLabel'

export default function CardDueDate({ card }: { card: Card }) {
  const { updateCard, addActivity } = useStore()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(card.dueDate ?? '')

  const setDue = (raw: string) => {
    setEditing(false)
    const due = raw || null
    if (due === card.dueDate) return
    updateCard(card.id, { dueDate: due })
    addActivity(card.id, due ? `set a due date (${formatDate(due)})` : 'removed the due date')
  }

  return (
    <section>
      <SectionLabel icon={<CalendarDays size={14} />}>Due date</SectionLabel>

      {card.dueDate && !editing ? (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="rounded-lg bg-surface-alt px-2.5 py-1 font-mono text-[11px] font-medium text-ink-muted">
            {formatDate(card.dueDate)}
          </span>
          <button
            type="button"
            title="Edit"
            onClick={() => {
              setValue(card.dueDate ?? '')
              setEditing(true)
            }}
            className="text-xs font-semibold text-brand hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            title="Remove due date"
            onClick={() => setDue('')}
            className="text-ink-faint transition hover:text-danger"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setDue(value)}
            autoFocus
            className="rounded-lg px-2 py-1 font-mono text-[11px] text-ink outline-none ring-1 ring-border transition focus:ring-2 focus:ring-brand"
          />
          {card.dueDate && (
            <button
              type="button"
              onClick={() => {
                setValue('')
                setDue('')
              }}
              className="text-xs font-semibold text-ink-faint hover:text-danger"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </section>
  )
}
