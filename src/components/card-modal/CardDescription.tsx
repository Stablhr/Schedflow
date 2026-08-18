import { useState } from 'react'
import { AlignLeft } from 'lucide-react'
import type { Card } from '../../store/schema'
import { useStore } from '../../store/useStore'
import SectionLabel from '../shared/SectionLabel'

export default function CardDescription({ card }: { card: Card }) {
  const { updateCard, addActivity } = useStore()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(card.desc)

  const save = () => {
    setEditing(false)
    const v = value.trim()
    if (v !== card.desc) {
      updateCard(card.id, { desc: v })
      addActivity(card.id, v ? 'updated the description' : 'removed the description')
    }
  }

  return (
    <section>
      <SectionLabel icon={<AlignLeft size={14} />}>Description</SectionLabel>

      {card.desc && !editing ? (
        <div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">{card.desc}</p>
          <button
            type="button"
            onClick={() => {
              setValue(card.desc)
              setEditing(true)
            }}
            className="mt-2 text-xs font-semibold text-brand hover:underline"
          >
            Edit
          </button>
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setValue(card.desc)
              setEditing(false)
            }
          }}
          placeholder="Add a more detailed description…"
          autoFocus
          rows={3}
          className="mt-2 w-full resize-none rounded-xl px-3 py-2 text-sm leading-relaxed text-ink outline-none neu-input transition placeholder:text-ink-faint focus:neu-input-focus"
        />
      )}
    </section>
  )
}
