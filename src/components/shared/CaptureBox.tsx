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
      className={`flex items-center gap-1.5 rounded-xl glass-subtle shadow-sm transition focus-within:ring-2 focus-within:ring-brand ${variant === 'sidebar' ? 'p-2' : 'p-2 sm:p-2.5'}`}
    >
      <button
        type="button"
        onClick={submit}
        title="Capture to Inbox"
        className={`flex shrink-0 items-center justify-center rounded-lg text-brand transition hover:bg-brand-light hover-rotate active:scale-95 ${variant === 'sidebar' ? 'h-7 w-7' : 'h-8 w-8'}`}
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
        className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
      />
    </div>
  )
}
