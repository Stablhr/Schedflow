import { useState } from 'react'
import { Plus, Search, Share2, Calendar, BarChart3, FileText, Trash2, Copy, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { SocialPost, SocialPostStatus } from '../../store/schema'
import { PLATFORM_COLORS } from '../../store/schema'
import Button from '../shared/Button'
import ComposeModal from './ComposeModal'

const STATUS_CONFIG: Record<SocialPostStatus, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'text-text-muted', icon: FileText },
  scheduled: { label: 'Scheduled', color: 'text-info-text', icon: Clock },
  publishing: { label: 'Publishing', color: 'text-warning-text', icon: AlertCircle },
  posted: { label: 'Posted', color: 'text-success-text', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'text-danger-text', icon: XCircle },
}

function PostRow({ post, onEdit, onDelete, onDuplicate }: {
  post: SocialPost
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const status = STATUS_CONFIG[post.status]
  const StatusIcon = status.icon
  const enabledPlatforms = post.platforms.filter((p) => p.enabled)

  return (
    <div
      className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-surface-alt sm:gap-4"
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEdit() } }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <StatusIcon size={16} className={`shrink-0 ${status.color}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">{post.title || 'Untitled Post'}</p>
          <p className="mt-0.5 truncate text-xs text-text-secondary">
            {post.caption ? post.caption.slice(0, 80) + (post.caption.length > 80 ? '...' : '') : 'No caption'}
          </p>
        </div>
      </div>

      <div className="hidden items-center gap-1.5 sm:flex">
        {enabledPlatforms.map((p) => (
          <span
            key={p.platform}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ background: PLATFORM_COLORS[p.platform] }}
            title={p.platform}
          >
            {p.platform[0].toUpperCase()}
          </span>
        ))}
      </div>

      {post.scheduledDate && (
        <span className="hidden whitespace-nowrap text-xs text-text-secondary sm:block">
          {post.scheduledDate}{post.scheduledTime ? ` ${post.scheduledTime}` : ''}
        </span>
      )}

      <span className={`shrink-0 text-[11px] font-semibold ${status.color}`}>
        {status.label}
      </span>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDuplicate() }}
          className="rounded p-1 text-text-muted transition-colors hover:bg-surface-alt hover:text-text-primary"
          title="Duplicate"
        >
          <Copy size={14} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="rounded p-1 text-text-muted transition-colors hover:bg-danger-subtle hover:text-danger-text"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default function SocialDashboard() {
  const { socialPosts, deleteSocialPost, duplicateSocialPost } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SocialPostStatus | 'all'>('all')
  const [composeOpen, setComposeOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null)

  const filtered = socialPosts.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        p.title.toLowerCase().includes(q) ||
        p.caption.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return true
  })

  const counts = {
    all: socialPosts.length,
    draft: socialPosts.filter((p) => p.status === 'draft').length,
    scheduled: socialPosts.filter((p) => p.status === 'scheduled').length,
    posted: socialPosts.filter((p) => p.status === 'posted').length,
    failed: socialPosts.filter((p) => p.status === 'failed').length,
  }

  const handleEdit = (post: SocialPost) => {
    setEditingPost(post)
    setComposeOpen(true)
  }

  const handleCloseCompose = () => {
    setComposeOpen(false)
    setEditingPost(null)
  }

  return (
    <div className="scroll-slim h-full overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Share2 size={22} className="shrink-0 text-primary" />
        <div>
          <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">Social Scheduler</h1>
          <p className="mt-0.5 text-sm text-text-secondary">Compose, schedule, and track posts across platforms.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-6">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border-strong bg-surface py-1.5 pl-8 pr-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-1">
          {(['all', 'draft', 'scheduled', 'posted', 'failed'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              {counts[s] > 0 && <span className="ml-1 opacity-70">({counts[s]})</span>}
            </button>
          ))}
        </div>

        <Button variant="primary" size="sm" onClick={() => setComposeOpen(true)}>
          <Plus size={15} />
          New Post
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center">
            <Share2 size={32} className="mx-auto text-text-muted" />
            <p className="mt-3 text-sm font-medium text-text-secondary">
              {socialPosts.length === 0 ? 'No social posts yet' : 'No posts match your filter'}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {socialPosts.length === 0
                ? 'Click "New Post" to create your first social media post.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {socialPosts.length === 0 && (
              <Button variant="primary" size="sm" className="mt-4" onClick={() => setComposeOpen(true)}>
                <Plus size={15} />
                Create First Post
              </Button>
            )}
          </div>
        ) : (
          filtered.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              onEdit={() => handleEdit(post)}
              onDelete={() => deleteSocialPost(post.id)}
              onDuplicate={() => duplicateSocialPost(post.id)}
            />
          ))
        )}
      </div>

      {composeOpen && (
        <ComposeModal post={editingPost} onClose={handleCloseCompose} />
      )}
    </div>
  )
}
