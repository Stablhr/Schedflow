import { CheckCircle2, Clock, AlertCircle, XCircle, Loader2 } from 'lucide-react'
import type { Platform, PlatformStatus } from '../../store/schema'

interface PublishStatusBadgeProps {
  platform: Platform
  status: PlatformStatus
  error?: string
  publishedUrl?: string
}

const STATUS_CONFIG: Record<PlatformStatus, {
  icon: typeof CheckCircle2
  label: string
  colorClass: string
  bgColorClass: string
}> = {
  pending: {
    icon: Clock,
    label: 'Pending',
    colorClass: 'text-text-muted',
    bgColorClass: 'bg-elevated',
  },
  scheduled: {
    icon: Clock,
    label: 'Scheduled',
    colorClass: 'text-info-text',
    bgColorClass: 'bg-info-bg',
  },
  publishing: {
    icon: Loader2,
    label: 'Publishing',
    colorClass: 'text-warning-text',
    bgColorClass: 'bg-warning-bg',
  },
  posted: {
    icon: CheckCircle2,
    label: 'Posted',
    colorClass: 'text-success-text',
    bgColorClass: 'bg-success-bg',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    colorClass: 'text-danger-text',
    bgColorClass: 'bg-danger-bg',
  },
  cancelled: {
    icon: AlertCircle,
    label: 'Cancelled',
    colorClass: 'text-text-muted',
    bgColorClass: 'bg-elevated',
  },
}

export default function PublishStatusBadge({ platform, status, error, publishedUrl }: PublishStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const Icon = config.icon

  const content = (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${config.bgColorClass} ${config.colorClass}`}>
      <Icon className={`h-3 w-3 ${status === 'publishing' ? 'animate-spin' : ''}`} />
      <span>{config.label}</span>
    </span>
  )

  if (publishedUrl) {
    return (
      <a href={publishedUrl} target="_blank" rel="noopener noreferrer" title={`View on ${platform}`}>
        {content}
      </a>
    )
  }

  if (error && status === 'failed') {
    return (
      <span title={error} className="cursor-help">
        {content}
      </span>
    )
  }

  return content
}
