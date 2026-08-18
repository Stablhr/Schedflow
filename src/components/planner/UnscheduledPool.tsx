import { Droppable } from '@hello-pangea/dnd'
import { Inbox } from 'lucide-react'
import type { Card } from '../../store/schema'
import PlannerCard from './PlannerCard'

export default function UnscheduledPool({ cards }: { cards: Card[] }) {
  return (
    <Droppable droppableId="unscheduled-pool" type="CARD">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`flex w-[180px] shrink-0 flex-col rounded-xl bg-white/50 p-2 shadow-sm ring-1 ring-white/20 sm:w-[230px] sm:p-3 ${
            snapshot.isDraggingOver
              ? 'bg-brand-light/60 ring-2 ring-inset ring-brand/20'
              : ''
          }`}
          style={{
            transition: snapshot.isDraggingOver ? 'all 0.2s ease' : 'all 0.3s ease',
          }}
        >
          <div className="flex items-center gap-1.5 px-1 pb-2">
            <Inbox size={14} className="text-ink-faint" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Unscheduled
            </h2>
            <span className="ml-auto font-mono text-[10.5px] text-ink-faint">{cards.length}</span>
          </div>
          <div className="scroll-slim flex max-h-[calc(100vh-170px)] min-h-2 flex-1 flex-col gap-1.5 overflow-y-auto">
            {cards.map((card, i) => (
              <PlannerCard key={card.id} card={card} index={i} />
            ))}
            {cards.length === 0 && (
              <p className="px-1 py-3 text-center text-xs text-ink-faint">All cards scheduled</p>
            )}
          </div>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}
