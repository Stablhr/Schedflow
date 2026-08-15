import { Trash2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { formatDateTime } from '../../utils/dates'
import CaptureBox from '../shared/CaptureBox'

export default function InboxView() {
  const { data, dismissInboxItem } = useStore()

  return (
    <div className="scroll-slim mx-auto h-full max-w-2xl overflow-y-auto p-8">
      <h1 className="font-display text-2xl font-bold text-ink">Inbox</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Quick captures land here until you move them to a board or schedule them.
      </p>

      <div className="mt-6">
        <CaptureBox variant="dash" />
      </div>

      <ul className="mt-6 space-y-2">
        {data.inbox.map((item) => (
          <li
            key={item.id}
            className="animate-in flex items-center gap-3 rounded-xl bg-surface px-4 py-3 shadow-sm"
          >
            <span className="flex-1 text-sm text-ink">{item.text}</span>
            <span className="font-mono text-[10.5px] text-ink-faint">{formatDateTime(item.createdAt)}</span>
            <button
              type="button"
              onClick={() => dismissInboxItem(item.id)}
              title="Dismiss"
              className="text-ink-faint transition hover:text-danger"
            >
              <Trash2 size={15} />
            </button>
          </li>
        ))}
        {data.inbox.length === 0 && (
          <li className="rounded-xl border-2 border-dashed border-border p-10 text-center text-sm text-ink-faint">
            Nothing captured yet — use the box above to jot a task, and it will land here.
          </li>
        )}
      </ul>
    </div>
  )
}
