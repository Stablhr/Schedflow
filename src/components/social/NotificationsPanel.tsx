import { CheckCircle2, XCircle, AlertTriangle, Info, Bell, BellRing, CheckCheck, Loader2 } from 'lucide-react'
import { useNotifications } from '../../lib/hooks/useNotifications'
import { formatDateTime } from '../../utils/dates'
import type { TaskNotification } from '../../lib/api/notifications'

const SEVERITY_ICON = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
} as const

const SEVERITY_COLOR = {
  success: 'text-success-text',
  error: 'text-danger-text',
  warning: 'text-warning-text',
  info: 'text-info-text',
} as const

function NotificationRow({
  n,
  onMarkRead,
}: {
  n: TaskNotification
  onMarkRead: (id: string) => void
}) {
  const Icon = SEVERITY_ICON[n.severity] ?? Info
  return (
    <button
      type="button"
      onClick={() => !n.read && onMarkRead(n._id)}
      className={`flex w-full items-start gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:bg-surface-alt ${
        n.read ? 'opacity-60' : ''
      }`}
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${SEVERITY_COLOR[n.severity] ?? 'text-info-text'}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium leading-snug text-text-primary">{n.message}</p>
        <p className="mt-1 text-[11px] text-text-muted">
          {formatDateTime(n.createdAt)}
          {n.platform ? ` · ${n.platform}` : ''}
        </p>
      </div>
      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
    </button>
  )
}

export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8">
      <div className="absolute inset-0 bg-[#0f1a19]/50" onClick={onClose} />
      <div className="animate-in relative z-10 flex h-full max-h-[620px] w-full max-w-md flex-col overflow-hidden rounded-[14px] border border-border bg-surface shadow-modal">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <BellRing size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-text-primary">Notifications</h2>
          <span className="rounded-full bg-primary px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary-foreground">
            {unreadCount}
          </span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:bg-surface-alt hover:text-text-primary"
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="ml-1 rounded-md p-1 text-text-muted transition-colors hover:bg-surface-alt hover:text-text-primary"
          >
            <XCircle size={16} />
          </button>
        </div>

        <div className="scroll-slim flex-1 space-y-2 overflow-y-auto p-3">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-text-muted">
              <Loader2 size={20} className="animate-spin" />
              <p className="text-xs">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-text-muted">
              <Bell size={24} />
              <p className="text-sm font-medium text-text-secondary">No notifications</p>
              <p className="text-xs">Publish activity and auth alerts will appear here.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationRow key={n._id} n={n} onMarkRead={markRead} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
