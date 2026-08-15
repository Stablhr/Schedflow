import { Droppable } from '@hello-pangea/dnd'
import type { Card } from '../../store/schema'
import { toISODate } from '../../utils/dates'
import PlannerCard from './PlannerCard'

interface DayColumnProps {
  date: Date
  isToday: boolean
  cards: Card[]
}

export default function DayColumn({ date, isToday, cards }: DayColumnProps) {
  const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' })
  const dayNum = date.getDate()

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div
        className={`mb-2 rounded-lg px-2 py-1.5 text-center ${
          isToday ? 'bg-brand text-white shadow-sm' : 'bg-surface shadow-sm'
        }`}
      >
        <p
          className={`text-[11px] font-bold uppercase tracking-wider ${
            isToday ? 'text-white' : 'text-ink-muted'
          }`}
        >
          {dayLabel}
        </p>
        <p className={`font-display text-lg font-bold ${isToday ? 'text-white' : 'text-ink'}`}>
          {dayNum}
        </p>
      </div>

      <Droppable droppableId={`day-${toISODate(date)}`} type="CARD">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`scroll-slim min-h-[120px] flex-1 rounded-xl p-1.5 transition-colors ${
              snapshot.isDraggingOver ? 'bg-brand-light/80' : 'bg-surface/70'
            }`}
          >
            <div className="flex flex-col gap-1.5">
              {cards.map((card, i) => (
                <PlannerCard key={card.id} card={card} index={i} />
              ))}
              {cards.length === 0 && <p className="py-2 text-center text-xs text-ink-faint">—</p>}
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
