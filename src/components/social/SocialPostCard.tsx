import { Draggable } from '@hello-pangea/dnd'
import type { SocialPost } from '../../store/schema'
import { PLATFORM_COLORS } from '../../store/schema'
import { Clock, CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react'

const STATUS_ICONS: Record<string, typeof Clock> = {
  draft: FileText,
  scheduled: Clock,
  publishing: AlertCircle,
  posted: CheckCircle2,
  failed: XCircle,
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-text-muted',
  scheduled: 'text-info-text',
  publishing: 'text-warning-text',
  posted: 'text-success-text',
  failed: 'text-danger-text',
}

export default function SocialPostCard({ post, index, onClick }: {
  post: SocialPost
  index: number
  onClick: () => void
}) {
  const enabledPlatforms = post.platforms.filter((p) => p.enabled)
  const StatusIcon = STATUS_ICONS[post.status] ?? Clock
  const statusColor = STATUS_COLORS[post.status] ?? 'text-text-muted'

  return (
    <Draggable draggableId={post.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
          tabIndex={0}
          role="button"
          className={`cursor-grab rounded-lg border border-border bg-surface p-2 active:cursor-grabbing ${
            snapshot.isDragging
              ? 'z-50 shadow-modal ring-2 ring-primary/40'
              : 'transition-colors duration-150 hover:bg-surface-alt'
          }`}
          style={provided.draggableProps.style}
        >
          <div className="flex items-start gap-1.5">
            <StatusIcon size={12} className={`mt-0.5 shrink-0 ${statusColor}`} />
            <p className="min-w-0 flex-1 truncate text-[12px] font-medium leading-snug text-text-primary">
              {post.title || 'Untitled'}
            </p>
          </div>
          {post.caption && (
            <p className="mt-0.5 line-clamp-2 pl-[18px] text-[11px] leading-snug text-text-secondary">
              {post.caption.slice(0, 60)}{post.caption.length > 60 ? '...' : ''}
            </p>
          )}
          <div className="mt-1 flex items-center gap-1 pl-[18px]">
            {enabledPlatforms.map((p) => (
              <span
                key={p.platform}
                className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-bold text-white"
                style={{ background: PLATFORM_COLORS[p.platform] }}
                title={p.platform}
              >
                {p.platform[0].toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}
    </Draggable>
  )
}
