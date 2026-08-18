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
            className={`scroll-slim min-h-[120px] flex-1 rounded-xl p-1.5 ${
              snapshot.isDraggingOver
                ? 'bg-brand-light/70 ring-2 ring-inset ring-brand/20 shadow-[inset_0_0_0_1px_rgba(13,171,163,0.15)]'
                : 'bg-white/50 ring-1 ring-white/20'
            }`}
            style={{
              transition: snapshot.isDraggingOver ? 'all 0.2s ease' : 'all 0.3s ease',
            }}
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
