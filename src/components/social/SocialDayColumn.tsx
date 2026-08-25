import { Droppable } from '@hello-pangea/dnd'
import type { SocialPost } from '../../store/schema'
import { toISODate } from '../../utils/dates'
import SocialPostCard from './SocialPostCard'

interface SocialDayColumnProps {
  date: Date
  isToday: boolean
  posts: SocialPost[]
  onPostClick: (post: SocialPost) => void
  onEmptySlotClick: (date: string) => void
}

export default function SocialDayColumn({ date, isToday, posts, onPostClick, onEmptySlotClick }: SocialDayColumnProps) {
  const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' })
  const dayNum = date.getDate()
  const isoDate = toISODate(date)

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div
        className={`mb-2 rounded-md px-2 py-1.5 text-center ${
          isToday ? 'bg-primary text-primary-foreground' : 'bg-surface-alt'
        }`}
      >
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.05em] ${
            isToday ? 'text-primary-foreground' : 'text-text-secondary'
          }`}
        >
          {dayLabel}
        </p>
        <p className={`font-mono text-lg font-semibold ${isToday ? 'text-primary-foreground' : 'text-text-primary'}`}>
          {dayNum}
        </p>
      </div>

      <Droppable droppableId={`day-${isoDate}`} type="SOCIAL_POST">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`scroll-slim min-h-[120px] flex-1 rounded-lg p-1.5 transition-colors duration-150 ${
              snapshot.isDraggingOver
                ? 'bg-primary-subtle/60 ring-2 ring-inset ring-primary'
                : 'ring-1 ring-border'
            }`}
          >
            <div className="flex flex-col gap-1.5">
              {posts.map((post, i) => (
                <SocialPostCard key={post.id} post={post} index={i} onClick={() => onPostClick(post)} />
              ))}
              {posts.length === 0 && (
                <button
                  type="button"
                  onClick={() => onEmptySlotClick(isoDate)}
                  className="flex min-h-[60px] items-center justify-center rounded-md border border-dashed border-border-strong text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  + Add post
                </button>
              )}
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
