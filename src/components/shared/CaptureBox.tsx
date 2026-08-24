import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../../store/useStore'

export default function CaptureBox({ autoFocus = false, variant = 'sidebar' }: { autoFocus?: boolean; variant?: 'sidebar' | 'dash' }) {
  const addInboxItem = useStore().addInboxItem
  const [text, setText] = useState('')

  const submit = () => {
    const t = text.trim()
    if (!t) return
    addInboxItem(t)
    setText('')
  }

  return (
    <div
      className={`flex items-center gap-1 rounded-lg border bg-surface transition-colors duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${variant === 'sidebar' ? 'p-1.5' : 'p-2'}`}
      style={{ borderColor: 'var(--surface-border)' }}
    >
      <button
        type="button"
        onClick={submit}
        title="Capture to Inbox"
        className={`flex shrink-0 items-center justify-center rounded-md text-primary transition-colors duration-150 hover:bg-primary-subtle active:scale-[0.98] ${variant === 'sidebar' ? 'h-7 w-7' : 'h-8 w-8'}`}
      >
        <Plus size={16} />
      </button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
        placeholder="Capture a task…"
        autoFocus={autoFocus}
        className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
      />
    </div>
  )
}
