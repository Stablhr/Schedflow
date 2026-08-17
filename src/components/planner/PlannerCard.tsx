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
          className={`cursor-grab rounded-lg bg-white/70 p-2 shadow-sm ring-1 ring-white/30 active:cursor-grabbing ${
            snapshot.isDragging
              ? 'z-50 rounded-xl bg-white shadow-[0_10px_32px_rgba(13,171,163,0.18),0_4px_12px_rgba(19,42,41,0.1)] ring-brand/30 opacity-95'
              : 'hover:shadow-md hover:ring-border'
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
