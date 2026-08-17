import { useState } from 'react'
import { Trash2, FolderInput, CalendarPlus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { formatDateTime } from '../../utils/dates'
import CaptureBox from '../shared/CaptureBox'
import InboxActionModal from './InboxActionModal'

export default function InboxView() {
  const { data, dismissInboxItem } = useStore()
  const [action, setAction] = useState<{ itemId: string; mode: 'move' | 'schedule' } | null>(null)

  return (
    <div className="scroll-slim mx-auto h-full max-w-2xl overflow-y-auto p-4 sm:p-6 md:p-8">
      <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Inbox</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Quick captures land here until you move them to a board or schedule them.
      </p>

      <div className="mt-4 sm:mt-6">
        <CaptureBox variant="dash" />
      </div>

      <ul className="mt-4 space-y-2 sm:mt-6">
        {data.inbox.map((item) => (
          <li
            key={item.id}
            className="animate-in flex items-center gap-2 rounded-xl glass-subtle px-3 py-2.5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 sm:gap-3 sm:px-4 sm:py-3"
          >
            <span className="min-w-0 flex-1 truncate text-sm text-ink" title={item.text}>
              {item.text}
            </span>
            <span className="hidden shrink-0 font-mono text-[10.5px] text-ink-faint sm:block">
              {formatDateTime(item.createdAt)}
            </span>
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => setAction({ itemId: item.id, mode: 'move' })}
                title="Move to board"
                className="rounded-lg p-1.5 text-ink-faint transition hover:bg-brand-light hover:text-brand-dark"
              >
                <FolderInput size={15} />
              </button>
              <button
                type="button"
                onClick={() => setAction({ itemId: item.id, mode: 'schedule' })}
                title="Schedule"
                className="rounded-lg p-1.5 text-ink-faint transition hover:bg-brand-light hover:text-brand-dark"
              >
                <CalendarPlus size={15} />
              </button>
              <button
                type="button"
                onClick={() => dismissInboxItem(item.id)}
                title="Dismiss"
                className="rounded-lg p-1.5 text-ink-faint transition hover:bg-danger-light hover:text-danger"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </li>
        ))}
        {data.inbox.length === 0 && (
          <li className="rounded-xl border-2 border-dashed border-border p-8 text-center text-sm text-ink-faint sm:p-10">
            Nothing captured yet — use the box above to jot a task, and it will land here.
          </li>
        )}
      </ul>

      {action && (
        <InboxActionModal
          itemId={action.itemId}
          mode={action.mode}
          onClose={() => setAction(null)}
        />
      )}
    </div>
  )
}
