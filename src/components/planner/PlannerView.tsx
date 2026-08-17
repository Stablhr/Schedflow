import { useState } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { addDays, formatDate, isSameDay, startOfWeek, toISODate } from '../../utils/dates'
import UnscheduledPool from './UnscheduledPool'
import DayColumn from './DayColumn'

const DAY_COUNT = 7

export default function PlannerView() {
  const store = useStore()
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek())

  const days = Array.from({ length: DAY_COUNT }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  const allCards = Object.values(store.data.cards)
  const poolCards = allCards
    .filter((c) => !c.archived && !c.dueDate)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const dayCards = (date: Date) =>
    allCards
      .filter((c) => !c.archived && c.dueDate === toISODate(date))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const onDragEnd = (result: DropResult) => {
    const { draggableId, source, destination } = result
    if (!destination) return
    const card = store.data.cards[draggableId]
    if (!card) return

    const destDay = destination.droppableId.startsWith('day-')
      ? destination.droppableId.slice(4)
      : null
    if (source.droppableId === 'unscheduled-pool' && !destDay) return

    if (!destDay) {
      if (card.dueDate) {
        store.updateCard(card.id, { dueDate: null })
        store.addActivity(card.id, 'unscheduled this card')
      }
      return
    }

    if (card.dueDate === destDay) return
    store.updateCard(card.id, { dueDate: destDay })
    store.addActivity(card.id, `scheduled for ${formatDate(destDay)}`)
  }

  const weekLabel = `${formatDate(toISODate(days[0]))} – ${formatDate(toISODate(days[6]))}`
  const navButtonClass =
    'flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted transition hover:bg-brand-light hover:text-brand-dark active:scale-95'

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border glass-subtle px-4 py-3">
        <h1 className="font-display text-xl font-bold text-ink">Planner</h1>

        <div className="ml-4 flex items-center gap-1">
          <button
            type="button"
            className={navButtonClass}
            title="Previous week"
            onClick={() => setWeekStart((w) => addDays(w, -DAY_COUNT))}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek())}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-brand transition hover:bg-brand-light active:scale-95"
          >
            Today
          </button>
          <button
            type="button"
            className={navButtonClass}
            title="Next week"
            onClick={() => setWeekStart((w) => addDays(w, DAY_COUNT))}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <span className="ml-2 font-mono text-[11px] text-ink-muted">{weekLabel}</span>

        <p className="ml-auto text-xs text-ink-faint">
          Drag cards onto a day to schedule them.
        </p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="scroll-slim flex h-full min-h-0 gap-4 overflow-x-auto p-4">
          <UnscheduledPool cards={poolCards} />
          <div className="flex min-w-0 flex-1 gap-2">
            {days.map((d) => (
              <DayColumn
                key={toISODate(d)}
                date={d}
                isToday={isSameDay(d, today)}
                cards={dayCards(d)}
              />
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  )
}
