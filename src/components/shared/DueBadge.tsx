import { Clock } from 'lucide-react'
import { formatDate, getUrgency } from '../../utils/dates'
import type { Urgency } from '../../utils/dates'

const STYLES: Record<Exclude<Urgency, 'none'>, string> = {
  normal: 'bg-surface-alt text-ink-muted',
  soon: 'bg-accent-light text-accent',
  overdue: 'bg-danger-light text-danger',
}

export default function DueBadge({ due, className = '' }: { due: string; className?: string }) {
  const urgency = getUrgency(due)
  if (urgency === 'none') return null
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10.5px] font-medium ${STYLES[urgency]} ${className}`}
    >
      <Clock size={10} />
      {formatDate(due)}
    </span>
  )
}
