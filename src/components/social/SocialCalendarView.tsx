import { useState } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import { ChevronLeft, ChevronRight, Plus, Share2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { SocialPost } from '../../store/schema'
import { addDays, formatDate, isSameDay, startOfWeek, toISODate } from '../../utils/dates'
import SocialUnscheduledPool from './SocialUnscheduledPool'
import SocialDayColumn from './SocialDayColumn'
import ComposeModal from './ComposeModal'
import PostDetailModal from './PostDetailModal'

const DAY_COUNT = 7

export default function SocialCalendarView() {
  const { socialPosts, moveSocialPost } = useStore()
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek())
  const [detailPostId, setDetailPostId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeDate, setComposeDate] = useState<string | undefined>()

  const days = Array.from({ length: DAY_COUNT }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  const poolPosts = socialPosts
    .filter((p) => !p.scheduledDate)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const dayPosts = (date: Date) =>
    socialPosts
      .filter((p) => p.scheduledDate === toISODate(date))
      .sort((a, b) => {
        if (a.scheduledTime && b.scheduledTime) return a.scheduledTime.localeCompare(b.scheduledTime)
        if (a.scheduledTime) return -1
        if (b.scheduledTime) return 1
        return b.updatedAt.localeCompare(a.updatedAt)
      })

  const onDragEnd = (result: DropResult) => {
    const { draggableId, source, destination } = result
    if (!destination) return

    const destDay = destination.droppableId.startsWith('day-')
      ? destination.droppableId.slice(4)
      : null

    if (source.droppableId === 'unscheduled-pool' && !destDay) return

    if (!destDay) {
      moveSocialPost(draggableId, '')
      return
    }

    moveSocialPost(draggableId, destDay)
  }

  const handlePostClick = (post: SocialPost) => {
    setDetailPostId(post.id)
  }

  const handleEditFromDetail = (post: SocialPost) => {
    setDetailPostId(null)
    setEditingPost(post)
    setComposeOpen(true)
  }

  const handleEmptySlotClick = (date: string) => {
    setEditingPost(null)
    setComposeDate(date)
    setComposeOpen(true)
  }

  const handleCloseCompose = () => {
    setComposeOpen(false)
    setEditingPost(null)
    setComposeDate(undefined)
  }

  const weekLabel = `${formatDate(toISODate(days[0]))} – ${formatDate(toISODate(days[6]))}`
  const navButtonClass =
    'flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors duration-150 hover:bg-primary-subtle hover:text-primary-hover active:scale-[0.98]'

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2 sm:px-4 sm:py-3">
        <Share2 size={18} className="shrink-0 text-primary" />
        <h1 className="text-lg font-semibold text-text-primary sm:text-xl">Social Calendar</h1>

        <div className="ml-2 flex items-center gap-1 sm:ml-4">
          <button
            type="button"
            className={navButtonClass}
            title="Previous week"
            aria-label="Go to previous week"
            onClick={() => setWeekStart((w) => addDays(w, -DAY_COUNT))}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek())}
            aria-label="Go to current week"
            className="rounded-md px-2 py-1 text-xs font-semibold text-primary-hover transition-colors duration-150 hover:bg-primary-subtle active:scale-[0.98]"
          >
            Today
          </button>
          <button
            type="button"
            className={navButtonClass}
            title="Next week"
            aria-label="Go to next week"
            onClick={() => setWeekStart((w) => addDays(w, DAY_COUNT))}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <span className="ml-1 font-mono text-[11px] text-text-secondary sm:ml-2">{weekLabel}</span>

        <button
          type="button"
          onClick={() => { setEditingPost(null); setComposeDate(undefined); setComposeOpen(true) }}
          aria-label="Create new social post"
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover active:scale-[0.98]"
        >
          <Plus size={14} />
          New Post
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="scroll-slim flex h-full min-h-0 gap-4 overflow-x-auto p-4">
          <SocialUnscheduledPool posts={poolPosts} onPostClick={handlePostClick} />
          <div className="flex min-w-0 flex-1 gap-2">
            {days.map((d) => (
              <SocialDayColumn
                key={toISODate(d)}
                date={d}
                isToday={isSameDay(d, today)}
                posts={dayPosts(d)}
                onPostClick={handlePostClick}
                onEmptySlotClick={handleEmptySlotClick}
              />
            ))}
          </div>
        </div>
      </DragDropContext>

      {composeOpen && (
        <ComposeModal
          post={editingPost}
          initialDate={composeDate}
          onClose={handleCloseCompose}
        />
      )}

      {detailPostId && (
        <PostDetailModal
          postId={detailPostId}
          onClose={() => setDetailPostId(null)}
          onEdit={handleEditFromDetail}
        />
      )}
    </div>
  )
}
