import { X } from 'lucide-react'
import type { Label } from '../../store/schema'

interface LabelChipProps {
  label: Label
  onRemove?: () => void
  className?: string
}

export default function LabelChip({ label, onRemove, className = '' }: LabelChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}
      style={{ background: `${label.color}21`, color: label.color }}
    >
      {label.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="opacity-60 transition hover:opacity-100"
          aria-label={`Remove label ${label.name}`}
        >
          <X size={10} />
        </button>
      )}
    </span>
  )
}
