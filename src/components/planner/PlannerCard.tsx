import { Draggable } from '@hello-pangea/dnd'
import type { Card } from '../../store/schema'
import { useStore } from '../../store/useStore'
import DueBadge from '../shared/DueBadge'

export default function PlannerCard({ card, index }: { card: Card; index: number }) {
  const { data } = useStore()
  const board = data.boards[card.boardId]

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`cursor-grab rounded-lg bg-white p-2 shadow-sm ring-1 ring-transparent transition hover:shadow-md hover:ring-border active:cursor-grabbing ${
            snapshot.isDragging ? 'opacity-40' : ''
          }`}
        >
          <p className="truncate text-[13px] font-semibold leading-snug text-ink">{card.title}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate text-[11px] text-ink-muted">
              {board?.name}
            </span>
            {card.dueDate && <DueBadge due={card.dueDate} />}
          </div>
        </div>
      )}
    </Draggable>
  )
}
