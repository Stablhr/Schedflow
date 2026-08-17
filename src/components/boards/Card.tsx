import { Draggable } from '@hello-pangea/dnd'
import { Paperclip, MessageSquare, Eye, Check } from 'lucide-react'
import type { Card } from '../../store/schema'
import { useStore } from '../../store/useStore'
import DueBadge from '../shared/DueBadge'
import LabelChip from '../shared/Chip'
import Avatar from '../shared/Avatar'

interface CardFaceProps {
  card: Card
  index: number
  onOpenCard: (cardId: string) => void
}

function CardCoverBand({ card }: { card: Card }) {
  if (typeof card.cover === 'string') {
    return (
      <div
        className="-mx-2.5 -mt-2.5 mb-2 h-8 rounded-t-xl"
        style={{ background: card.cover }}
      />
    )
  }
  if (card.cover?.type === 'image') {
    if (card.coverSize === 'small') {
      return (
        <div className="-mx-2.5 -mt-2.5 mb-2 h-8 w-[calc(100%+20px)] overflow-hidden rounded-t-xl">
          <img
            src={card.cover.dataUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )
    }
    return (
      <div className="relative -mx-2.5 -mt-2.5 mb-2 aspect-[4/5] w-[calc(100%+20px)] overflow-hidden rounded-t-xl">
        <img
          src={card.cover.dataUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    )
  }
  const previewImage = card.files.find((f) => f.type === 'image')
  if (previewImage) {
    return (
      <div className="relative -mx-2.5 -mt-2.5 mb-2 aspect-[4/5] w-[calc(100%+20px)] overflow-hidden rounded-t-xl">
        <img
          src={previewImage.dataUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    )
  }
  return null
}

function DoneToggle({ card }: { card: Card }) {
  const toggleDone = useStore().toggleDone
  return (
    <button
      type="button"
      title={card.done ? 'Mark as not done' : 'Mark as done'}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        toggleDone(card.id)
      }}
      className={`absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-sm ring-1 transition active:scale-90 ${
        card.done
          ? 'bg-success text-white ring-success'
          : 'bg-white/85 text-ink-faint ring-ink-faint/40 hover:bg-brand-light hover:text-brand-dark hover:ring-brand'
      }`}
    >
      {card.done && <Check size={14} strokeWidth={3} />}
    </button>
  )
}

export default function CardFace({ card, index, onOpenCard }: CardFaceProps) {
  const { data } = useStore()
  const board = data.boards[card.boardId]
  const labels = (card.labelIds
    .map((id) => board?.labels[id])
    .filter(Boolean)) as NonNullable<typeof board>['labels'][string][]
  const members = card.memberIds
    .map((id) => data.members[id])
    .filter(Boolean) as typeof data.members[string][]
  const extraLabels = labels.length > 4 ? labels.length - 4 : 0

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpenCard(card.id)}
          className={`relative cursor-pointer rounded-xl bg-white/50 backdrop-blur-md p-2.5 shadow-sm ring-1 ring-white/20 transition-all duration-150 hover:shadow-md hover:ring-border ${
            snapshot.isDragging ? 'scale-[1.03] shadow-lg ring-brand/30' : ''
          }`}
        >
          <DoneToggle card={card} />
          <CardCoverBand card={card} />

          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {labels.slice(0, 4).map((label) => (
                <LabelChip key={label.id} label={label} />
              ))}
              {extraLabels > 0 && (
                <span className="rounded-full bg-surface-alt px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink-muted">
                  +{extraLabels}
                </span>
              )}
            </div>
          )}

          <p
            className={`mt-1 text-[14px] font-semibold leading-snug ${
              card.done ? 'text-ink-muted line-through decoration-ink-faint' : 'text-ink'
            }`}
          >
            {card.title}
          </p>

          {(card.dueDate ||
            card.files.length > 0 ||
            card.comments.length > 0 ||
            card.watching ||
            members.length > 0) && (
            <div className="mt-2 flex items-center gap-1.5 text-ink-muted">
              {card.dueDate && <DueBadge due={card.dueDate} />}
              {card.files.length > 0 && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                  <Paperclip size={12} />
                  {card.files.length}
                </span>
              )}
              {card.comments.length > 0 && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                  <MessageSquare size={12} />
                  {card.comments.length}
                </span>
              )}
              {card.watching && <Eye size={12} className="text-brand" />}
              <span className="ml-auto flex -space-x-1">
                {members.slice(0, 4).map((m) => (
                  <Avatar key={m.id} member={m} stacked />
                ))}
              </span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}
