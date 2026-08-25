import { Droppable } from '@hello-pangea/dnd'
import { Inbox } from 'lucide-react'
import type { SocialPost } from '../../store/schema'
import SocialPostCard from './SocialPostCard'

interface SocialUnscheduledPoolProps {
  posts: SocialPost[]
  onPostClick: (post: SocialPost) => void
}

export default function SocialUnscheduledPool({ posts, onPostClick }: SocialUnscheduledPoolProps) {
  return (
    <Droppable droppableId="unscheduled-pool" type="SOCIAL_POST">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          aria-label="Unscheduled posts pool"
          className={`flex w-[150px] shrink-0 flex-col rounded-lg p-2 sm:w-[180px] lg:w-[230px] sm:p-3 ${
            snapshot.isDraggingOver
              ? 'bg-primary-subtle/60 ring-2 ring-inset ring-primary'
              : 'ring-1 ring-border'
          }`}
        >
          <div className="flex items-center gap-1.5 px-1 pb-2">
            <Inbox size={14} className="text-text-muted" />
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
              Unscheduled
            </h2>
            <span className="ml-auto font-mono text-[10.5px] text-text-muted">{posts.length}</span>
          </div>
          <div className="scroll-slim flex max-h-[calc(100vh-170px)] min-h-2 flex-1 flex-col gap-1.5 overflow-y-auto">
            {posts.map((post, i) => (
              <SocialPostCard key={post.id} post={post} index={i} onClick={() => onPostClick(post)} />
            ))}
            {posts.length === 0 && (
              <p className="px-1 py-3 text-center text-xs text-text-muted" role="status">All posts scheduled</p>
            )}
          </div>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}
